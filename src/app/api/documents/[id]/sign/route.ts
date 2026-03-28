/**
 * POST /api/documents/[id]/sign
 *
 * Accepts the completed field values, embeds them into the PDF using pdf-lib,
 * saves the signed PDF to Vercel Blob (or local disk in dev), and updates
 * the document record in the DB.
 *
 * Body: { fields: Array<{ fieldId: string, value: string }>, token?: string }
 *
 * This route handles two signing modes:
 *
 *   A) Owner self-sign (session-based):
 *      - Requires a valid NextAuth session
 *      - Owner can update any field on the document
 *      - After signing, document status → 'completed'
 *
 *   B) External signer (token-based):
 *      - Token provided via `Authorization: Bearer <token>` header
 *        or `?token=` query param, or in the request body as `token`
 *      - No session required
 *      - Signer can only update fields assigned to them
 *      - After saving, sets Signer.status = 'signed' and records IP
 *      - If ALL signers have now signed → generate final PDF, status = 'completed',
 *        send completion email to owner
 *
 * PDF coordinate note:
 *   pdf-lib uses a bottom-left origin (like maths/PostScript).
 *   The browser / our DB use a top-left origin (like CSS/HTML).
 *   The conversion is:  pdfY = pageHeight − cssY − fieldHeight
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { verifySigningToken } from '@/lib/signing-token'
import { sendCompletionNotification, sendSigningRequest } from '@/lib/emails'
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'

// ── Body types ─────────────────────────────────────────────────────────────────

interface FieldValueInput {
  fieldId: string
  /** base64 PNG data URL for image fields, plain text for date/text */
  value: string
}

interface FieldSizeOverride {
  fieldId: string
  /** New width as a percentage of the page width (0–100) */
  width: number
  /** New height as a percentage of the page height (0–100) */
  height: number
}

interface RequestBody {
  fields: FieldValueInput[]
  /** Optional: external-signer JWT token (alternative to Authorization header) */
  token?: string
  /** Optional: per-field size overrides set when the user resizes a field during signing */
  sizeOverrides?: FieldSizeOverride[]
}

// ── Helper: store a signed PDF (Blob in prod, disk in dev) ─────────────────────

async function storeSignedPdf(filename: string, bytes: Uint8Array): Promise<string> {
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const { put } = await import('@vercel/blob')
    const blob = await put(filename, Buffer.from(bytes), {
      access: 'private',
      contentType: 'application/pdf',
    })
    return blob.url
  }

  // Local dev fallback
  const fs = await import('fs')
  const path = await import('path')
  const uploadsDir = path.join(process.cwd(), 'uploads')
  await fs.promises.mkdir(uploadsDir, { recursive: true })
  await fs.promises.writeFile(path.join(uploadsDir, filename), bytes)
  return filename
}

// ── Helper: load original PDF bytes (from Blob URL or local disk) ──────────────

async function loadPdfBytes(fileUrl: string): Promise<Buffer | null> {
  if (fileUrl.startsWith('https://')) {
    try {
      const response = await fetch(fileUrl, {
        headers: {
          Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}`,
        },
      })
      if (!response.ok) return null
      return Buffer.from(await response.arrayBuffer())
    } catch {
      return null
    }
  }

  // Local dev path
  const fs = await import('fs')
  const path = await import('path')
  const filename = path.basename(fileUrl)
  const filePath = path.join(process.cwd(), 'uploads', filename)
  try {
    return await fs.promises.readFile(filePath)
  } catch {
    return null
  }
}

// ── Helper: build the signed PDF from all filled field values ──────────────────

async function buildSignedPdf(
  documentId: string,
  fileUrl: string,
  sizeOverrides?: Map<string, { width: number; height: number }>
): Promise<Uint8Array | null> {
  // Load all fields that have a value
  const dbFields = await prisma.signatureField.findMany({
    where: { documentId, value: { not: null } },
  })

  const pdfBytes = await loadPdfBytes(fileUrl)
  if (!pdfBytes) return null

  let pdfDoc: PDFDocument
  try {
    pdfDoc = await PDFDocument.load(new Uint8Array(pdfBytes))
  } catch {
    return null
  }

  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica)

  for (const field of dbFields) {
    const value = field.value
    if (!value) continue

    const page = pdfDoc.getPage(field.pageNumber - 1)
    const { width: pageW, height: pageH } = page.getSize()

    const override  = sizeOverrides?.get(field.id)
    const fieldW    = override?.width  ?? field.width
    const fieldH    = override?.height ?? field.height

    const absX      = (field.x / 100) * pageW
    const absWidth  = (fieldW / 100) * pageW
    const absHeight = (fieldH / 100) * pageH
    // Convert top-left origin (CSS) to bottom-left origin (PDF)
    const absY = pageH - (field.y / 100) * pageH - absHeight

    if (field.type === 'signature' || field.type === 'initials') {
      const base64Data = value.replace(/^data:image\/\w+;base64,/, '')
      const imgBytes   = Buffer.from(base64Data, 'base64')

      try {
        let img
        try {
          img = await pdfDoc.embedPng(new Uint8Array(imgBytes))
        } catch {
          img = await pdfDoc.embedJpg(new Uint8Array(imgBytes))
        }
        page.drawImage(img, { x: absX, y: absY, width: absWidth, height: absHeight })
      } catch (imgErr) {
        console.error('[sign] Failed to embed image for field', field.id, imgErr)
      }
    } else {
      const fontSize = Math.min(12, Math.max(8, absHeight * 0.55))
      page.drawText(value, {
        x: absX + 4,
        y: absY + (absHeight - fontSize) / 2,
        size: fontSize,
        font: helvetica,
        color: rgb(0, 0, 0),
        maxWidth: absWidth - 8,
      })
    }
  }

  return pdfDoc.save()
}

// ── Route handler ──────────────────────────────────────────────────────────────

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  // ── Parse body ─────────────────────────────────────────────────────────────
  let body: RequestBody
  try {
    body = (await req.json()) as RequestBody
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (!Array.isArray(body.fields)) {
    return NextResponse.json({ error: 'fields must be an array' }, { status: 400 })
  }

  // ── Determine signing mode ─────────────────────────────────────────────────
  // Check for a token in: Authorization header, query param, or body
  const authHeader = req.headers.get('authorization') ?? ''
  const tokenFromHeader = authHeader.startsWith('Bearer ')
    ? authHeader.slice(7)
    : null
  const tokenFromQuery = req.nextUrl.searchParams.get('token')
  const rawToken = tokenFromHeader ?? tokenFromQuery ?? body.token ?? null

  // ═══════════════════════════════════════════════════════════════════════════
  // MODE B: External signer with JWT token
  // ═══════════════════════════════════════════════════════════════════════════

  if (rawToken) {
    const tokenPayload = await verifySigningToken(rawToken)
    if (!tokenPayload) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 })
    }

    // Verify the token's documentId matches the URL
    if (tokenPayload.documentId !== id) {
      return NextResponse.json({ error: 'Token does not match document' }, { status: 403 })
    }

    // Load the signer record
    const signer = await prisma.signer.findFirst({
      where: { id: tokenPayload.signerId, documentId: id },
      select: { id: true, status: true, name: true, email: true },
    })
    if (!signer) {
      return NextResponse.json({ error: 'Signer not found' }, { status: 404 })
    }
    if (signer.status === 'signed') {
      return NextResponse.json({ error: 'You have already signed this document' }, { status: 400 })
    }

    // Load this signer's fields to validate the submitted field IDs
    const signerFields = await prisma.signatureField.findMany({
      where: { documentId: id, signerId: signer.id },
      select: { id: true },
    })
    const allowedFieldIds = new Set(signerFields.map((f) => f.id))

    // Only update fields that belong to this signer
    const filteredFields = body.fields.filter((f) => allowedFieldIds.has(f.fieldId))

    await Promise.all(
      filteredFields.map(({ fieldId, value }) =>
        prisma.signatureField.updateMany({
          where: { id: fieldId, documentId: id, signerId: signer.id },
          data: { value },
        })
      )
    )

    // Capture the signer's IP address for audit purposes
    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
      req.headers.get('x-real-ip') ??
      null

    // Mark this signer as having signed
    await prisma.signer.update({
      where: { id: signer.id },
      data: {
        status: 'signed',
        signedAt: new Date(),
        signedIp: ip,
      },
    })

    // ── Sequential signing: email the next signer(s) in line ─────────────
    // Fetch the order of the signer who just signed, then find any pending
    // signers with order = currentOrder + 1 and email them now.
    const currentSigner = await prisma.signer.findUnique({
      where: { id: signer.id },
      select: { order: true },
    })

    const nextSigners = await prisma.signer.findMany({
      where: {
        documentId: id,
        order: (currentSigner?.order ?? 0) + 1,
        status: 'pending',
      },
      select: { id: true, name: true, email: true, token: true },
    })

    if (nextSigners.length > 0) {
      // Load the document name and owner name for the email
      const docForEmail = await prisma.document.findUnique({
        where: { id },
        select: { name: true, owner: { select: { name: true, email: true } } },
      })
      const senderName = docForEmail?.owner.name ?? docForEmail?.owner.email ?? 'Someone'
      const baseUrl =
        process.env.NEXTAUTH_URL ??
        (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')

      await Promise.all(
        nextSigners.map((ns) =>
          sendSigningRequest({
            to: ns.email,
            signerName: ns.name,
            senderName,
            docName: docForEmail?.name ?? 'Document',
            signingUrl: `${baseUrl}/sign/${ns.token}`,
          })
        )
      )
    }

    // Check whether ALL signers have now signed
    const pendingCount = await prisma.signer.count({
      where: { documentId: id, status: 'pending' },
    })

    let completed = false

    if (pendingCount === 0) {
      // All signers have signed — generate the final PDF
      const document = await prisma.document.findUnique({
        where: { id },
        select: {
          fileUrl: true,
          owner: { select: { name: true, email: true } },
          signers: { select: { name: true } },
          name: true,
        },
      })

      if (document) {
        const signerSizeOverrideMap = body.sizeOverrides
          ? new Map(body.sizeOverrides.map(({ fieldId, width, height }) => [fieldId, { width, height }]))
          : undefined
        const signedBytes = await buildSignedPdf(id, document.fileUrl, signerSizeOverrideMap)

        if (signedBytes) {
          const signedFilename = `${id}-signed.pdf`

          let signedFileUrl: string
          try {
            signedFileUrl = await storeSignedPdf(signedFilename, signedBytes)
          } catch (err) {
            console.error('[sign] Failed to store signed PDF:', err)
            signedFileUrl = signedFilename
          }

          await prisma.document.update({
            where: { id },
            data: {
              signedFileUrl,
              status: 'completed',
              completedAt: new Date(),
            },
          })

          // Notify the document owner that all parties have signed
          const baseUrl = process.env.NEXTAUTH_URL
          ?? (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')
          const ownerEmail = document.owner.email
          if (ownerEmail) {
            await sendCompletionNotification({
              to: ownerEmail,
              ownerName: document.owner.name ?? ownerEmail,
              docName: document.name,
              documentUrl: `${baseUrl}/documents/${id}`,
              signerNames: document.signers.map((s) => s.name),
            })
          }

          completed = true
        }
      }
    }

    // Audit log
    await prisma.auditLog.create({
      data: {
        documentId: id,
        action: 'document_signed',
        actorEmail: signer.email,
        ipAddress: ip,
      },
    })

    return NextResponse.json({ success: true, completed })
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // MODE A: Owner self-sign (session-based — original behaviour)
  // ═══════════════════════════════════════════════════════════════════════════

  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Verify ownership
  const document = await prisma.document.findFirst({
    where: { id, ownerId: session.user.id },
    select: { id: true, fileUrl: true },
  })
  if (!document) {
    return NextResponse.json({ error: 'Document not found' }, { status: 404 })
  }

  // Save field values to DB first so buildSignedPdf picks them up
  await Promise.all(
    body.fields.map(({ fieldId, value }) =>
      prisma.signatureField.updateMany({
        where: { id: fieldId, documentId: id },
        data: { value },
      })
    )
  )

  // Build signed PDF using the shared helper (reads all filled fields from DB)
  const sizeOverrideMap = body.sizeOverrides
    ? new Map(body.sizeOverrides.map(({ fieldId, width, height }) => [fieldId, { width, height }]))
    : undefined
  const signedBytes = await buildSignedPdf(id, document.fileUrl, sizeOverrideMap)
  if (!signedBytes) {
    return NextResponse.json({ error: 'Original PDF not found' }, { status: 500 })
  }

  const signedFilename = `${id}-signed.pdf`

  let signedFileUrl: string
  try {
    signedFileUrl = await storeSignedPdf(signedFilename, signedBytes)
  } catch (err) {
    console.error('[sign] Failed to store signed PDF:', err)
    return NextResponse.json({ error: 'Failed to save signed PDF' }, { status: 500 })
  }

  await prisma.document.update({
    where: { id },
    data: {
      signedFileUrl,
      status: 'completed',
      completedAt: new Date(),
    },
  })

  await prisma.auditLog.create({
    data: {
      documentId: id,
      action: 'document_signed',
      actorEmail: session.user.email ?? 'unknown',
    },
  })

  return NextResponse.json({
    signedFileUrl: `/api/documents/${id}/signed-file`,
  })
}
