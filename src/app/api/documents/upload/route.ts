/**
 * POST /api/documents/upload
 *
 * Accepts a multipart/form-data request with a "file" field containing a PDF.
 *
 * Steps:
 *   1. Check that the user is authenticated (401 if not)
 *   2. Parse the uploaded file from the form data
 *   3. Validate: must be a PDF, must be <= 10 MB
 *   4. Store the file — Vercel Blob in production, local /uploads/ in dev
 *   5. Create a Document record in the database
 *   6. Create an AuditLog entry for the upload
 *   7. Return { documentId, name }
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { checkDocumentLimit, checkFileSizeLimit, incrementUsage } from '@/lib/usage'
import { imageToPdf, docxToPdf } from '@/lib/convert-to-pdf'
import { v4 as uuidv4 } from 'uuid'

export async function POST(req: NextRequest) {
  // ── 1. Auth check ──────────────────────────────────────────────────────
  const session = await auth()
  if (!session?.user?.id || !session.user.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // ── 1b. Check document limit for this month ────────────────────────────
  const docLimit = await checkDocumentLimit(session.user.id)
  if (!docLimit.allowed) {
    return NextResponse.json(
      {
        error: `You've reached your monthly limit of ${docLimit.limit} documents. Upgrade to Pro for unlimited documents.`,
        code: 'DOCUMENT_LIMIT_REACHED',
        used: docLimit.used,
        limit: docLimit.limit,
      },
      { status: 403 }
    )
  }

  // ── 2. Parse the multipart form data ──────────────────────────────────
  let formData: FormData
  try {
    formData = await req.formData()
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 })
  }

  const fileEntry = formData.get('file')
  if (!fileEntry || !(fileEntry instanceof File)) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }

  const uploadedFile = fileEntry

  // ── 3. Validation ──────────────────────────────────────────────────────
  // Accepted MIME types — PDF, JPG/PNG images, and Word .docx files
  const ACCEPTED_TYPES = new Set([
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  ])

  if (!ACCEPTED_TYPES.has(uploadedFile.type)) {
    return NextResponse.json(
      { error: 'Accepted formats: PDF, JPG, PNG, or DOCX.' },
      { status: 422 }
    )
  }

  // Check file size against the user's plan limit
  const sizeCheck = await checkFileSizeLimit(session.user.id, uploadedFile.size)
  if (!sizeCheck.allowed) {
    return NextResponse.json(
      {
        error: `File is ${sizeCheck.fileSizeMB.toFixed(1)} MB but your plan allows up to ${sizeCheck.limitMB} MB.`,
        code: 'FILE_TOO_LARGE',
      },
      { status: 422 }
    )
  }

  // ── 4. Convert to PDF if needed, then store ────────────────────────────
  const arrayBuffer = await uploadedFile.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  // Convert non-PDF formats to PDF before storing
  // Typed as NodeJS.ArrayBufferView to accept both Buffer<ArrayBuffer> and Buffer<ArrayBufferLike>
  let finalBuffer: Buffer = buffer as Buffer
  const finalFilename = `${uuidv4()}.pdf`
  let documentName = uploadedFile.name

  if (uploadedFile.type !== 'application/pdf') {
    try {
      if (uploadedFile.type.startsWith('image/')) {
        // Embed the image into an A4 PDF page
        finalBuffer = await imageToPdf(buffer, uploadedFile.type)
      } else if (uploadedFile.type.includes('wordprocessingml')) {
        // Extract text from .docx and lay it out in a PDF
        finalBuffer = await docxToPdf(buffer)
      }
      // Strip the original extension and use .pdf for the stored name
      documentName = uploadedFile.name.replace(/\.(docx?|jpe?g|png)$/i, '.pdf')
    } catch (convErr) {
      console.error('[upload] conversion failed:', convErr)
      return NextResponse.json({ error: 'Could not convert file to PDF.' }, { status: 422 })
    }
  }

  let fileUrl: string

  try {
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      // Production / Vercel preview: upload to Vercel Blob
      const { put } = await import('@vercel/blob')
      const blob = await put(finalFilename, finalBuffer, {
        access: 'private',
        contentType: 'application/pdf',
      })
      fileUrl = blob.url
    } else {
      // Local dev fallback: write to /uploads/ directory
      const fs = await import('fs')
      const path = await import('path')
      // The comment below prevents Turbopack from tracing the entire project directory
      const uploadsDir = path.join(/*turbopackIgnore: true*/ process.cwd(), 'uploads')
      await fs.promises.mkdir(uploadsDir, { recursive: true })
      const filePath = path.join(uploadsDir, finalFilename)
      await fs.promises.writeFile(filePath, finalBuffer)
      fileUrl = `uploads/${finalFilename}`
    }
  } catch {
    return NextResponse.json({ error: 'Failed to store file' }, { status: 500 })
  }

  // ── 5. Create Document in database ────────────────────────────────────
  let document: Awaited<ReturnType<typeof prisma.document.create>>
  try {
    document = await prisma.document.create({
      data: {
        name: documentName,
        ownerId: session.user.id,
        fileUrl,
        status: 'draft',
      },
    })
  } catch {
    return NextResponse.json({ error: 'Failed to save document' }, { status: 500 })
  }

  // ── 5b. Increment usage counter for this month ────────────────────────
  try {
    await incrementUsage(session.user.id)
  } catch {
    // Non-fatal: document was created, usage tracking failure shouldn't block
  }

  // ── 6. Create AuditLog entry ───────────────────────────────────────────
  try {
    await prisma.auditLog.create({
      data: {
        documentId: document.id,
        action: 'document_created',
        actorEmail: session.user.email,
        // IP address is not reliably available in Next.js App Router without middleware
      },
    })
  } catch {
    // Non-fatal: document was created, audit log failure shouldn't block the user
  }

  // ── 7. Return the new document's ID and name ───────────────────────────
  return NextResponse.json(
    { documentId: document.id, name: document.name },
    { status: 201 }
  )
}
