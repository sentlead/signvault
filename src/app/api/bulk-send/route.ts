/**
 * /api/bulk-send
 *
 * GET  — list all bulk-send batches for the current user (most recent first)
 * POST — create a new bulk-send batch: one document per recipient, all sent immediately
 *
 * POST body:
 * {
 *   templateId: string            // template to use for every document
 *   name: string                  // label for this batch (e.g. "Q1 NDA Batch")
 *   recipients: Array<{
 *     name: string
 *     email: string
 *   }>
 * }
 *
 * Requires: Business plan.
 * Rate: each recipient counts as one document toward the monthly usage limit
 *       (Business plan has unlimited docs, so this is only a sanity check).
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { getPlan } from '@/lib/plans'
import { createSigningToken } from '@/lib/signing-token'
import { sendSigningRequest } from '@/lib/emails'
import type { TemplateField, SignerRole } from '@/app/api/templates/route'

// ── Types ────────────────────────────────────────────────────────────────────

interface Recipient {
  name: string
  email: string
}

interface PostBody {
  templateId: string
  name: string
  recipients: Recipient[]
}

// ── GET: list bulk sends ──────────────────────────────────────────────────────

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const bulkSends = await prisma.bulkSend.findMany({
    where: { ownerId: session.user.id },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      templateName: true,
      totalCount: true,
      createdAt: true,
      // Count completed documents in this batch
      documents: {
        where: { status: 'completed' },
        select: { id: true },
      },
    },
  })

  // Shape the response: replace the documents array with a completedCount number
  const result = bulkSends.map((b) => ({
    id: b.id,
    name: b.name,
    templateName: b.templateName,
    totalCount: b.totalCount,
    completedCount: b.documents.length,
    createdAt: b.createdAt.toISOString(),
  }))

  return NextResponse.json({ bulkSends: result })
}

// ── POST: create a new bulk-send batch ────────────────────────────────────────

export async function POST(req: NextRequest) {
  // ── 1. Auth ──────────────────────────────────────────────────────────────
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // ── 2. Check business plan ───────────────────────────────────────────────
  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { plan: true, name: true, email: true },
  })
  const plan = getPlan(dbUser?.plan ?? 'free')

  if (plan.id !== 'business') {
    return NextResponse.json(
      { error: 'Bulk Send is a Business plan feature. Please upgrade to use it.' },
      { status: 403 }
    )
  }

  // ── 3. Parse and validate body ───────────────────────────────────────────
  let body: PostBody
  try {
    body = (await req.json()) as PostBody
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { templateId, name, recipients } = body

  if (!templateId?.trim()) {
    return NextResponse.json({ error: 'Template is required.' }, { status: 400 })
  }
  if (!name?.trim()) {
    return NextResponse.json({ error: 'Batch name is required.' }, { status: 400 })
  }
  if (!Array.isArray(recipients) || recipients.length === 0) {
    return NextResponse.json({ error: 'At least one recipient is required.' }, { status: 400 })
  }
  if (recipients.length > 500) {
    return NextResponse.json({ error: 'Maximum 500 recipients per batch.' }, { status: 400 })
  }
  for (const r of recipients) {
    if (!r.name?.trim()) {
      return NextResponse.json({ error: 'Every recipient must have a name.' }, { status: 400 })
    }
    if (!r.email?.trim() || !r.email.includes('@')) {
      return NextResponse.json({ error: `Invalid email: "${r.email}"` }, { status: 400 })
    }
  }

  // ── 4. Load the template (must be owned by this user) ───────────────────
  const template = await prisma.template.findFirst({
    where: { id: templateId, ownerId: session.user.id },
  })
  if (!template) {
    return NextResponse.json({ error: 'Template not found.' }, { status: 404 })
  }

  const templateFields = JSON.parse(template.fields) as TemplateField[]
  const signerRoles = JSON.parse(template.signerRoles) as SignerRole[]

  // For bulk send we support templates with 0 or 1 signer role.
  // (Multi-role templates require different recipients per role — not supported here.)
  if (signerRoles.length > 1) {
    return NextResponse.json(
      {
        error:
          'This template has multiple signer roles. Bulk Send only supports single-signer templates. ' +
          'To use a multi-signer template, send documents individually.',
      },
      { status: 400 }
    )
  }

  // ── 5. Determine expiry (business plan = no expiry) ──────────────────────
  const expiryDays = plan.limits.expiryDays  // -1 means never
  const now = new Date()
  const expiresAt = expiryDays === -1 ? null : new Date(now.getTime() + expiryDays * 86400000)

  // ── 6. Create the BulkSend record + all documents in a transaction ───────
  const { bulkSend, createdDocs } = await prisma.$transaction(async (tx) => {
    // Create the parent bulk-send record first
    const bs = await tx.bulkSend.create({
      data: {
        ownerId: session.user.id!,
        name: name.trim(),
        templateName: template.name,
        totalCount: recipients.length,
      },
    })

    // Create one document per recipient
    const docs: Array<{
      documentId: string
      signerToken: string
      signerName: string
      signerEmail: string
      docName: string
    }> = []

    for (const recipient of recipients) {
      const cleanName  = recipient.name.trim()
      const cleanEmail = recipient.email.trim().toLowerCase()
      const docName    = `${template.name} — ${cleanName}`

      // Create the Document (copy of template PDF, linked to this bulk send)
      const document = await tx.document.create({
        data: {
          ownerId: session.user.id!,
          name: docName,
          fileUrl: template.fileUrl,
          status: 'awaiting_signatures',
          sentAt: now,
          expiresAt,
          reminderEnabled: true,
          reminderInterval: 3,
          bulkSendId: bs.id,
        },
      })

      // Create the signer record (the recipient)
      const signer = await tx.signer.create({
        data: {
          documentId: document.id,
          name: cleanName,
          email: cleanEmail,
          status: 'pending',
          order: 0,
        },
        select: { id: true },
      })

      // Generate a JWT signing token for this signer
      const jwtToken = await createSigningToken(signer.id, document.id)
      await tx.signer.update({
        where: { id: signer.id },
        data: { token: jwtToken },
      })

      // Copy the template's fields, assigning them to this signer
      if (templateFields.length > 0) {
        await tx.signatureField.createMany({
          data: templateFields.map((f) => ({
            documentId: document.id,
            // All fields go to the one signer (signerRoleIndex 0 = this recipient)
            signerId: f.signerRoleIndex === 0 ? signer.id : null,
            type: f.type,
            pageNumber: f.pageNumber,
            x: f.x,
            y: f.y,
            width: f.width,
            height: f.height,
          })),
        })
      }

      // Write an audit log entry
      await tx.auditLog.create({
        data: {
          documentId: document.id,
          action: 'document_sent_bulk',
          actorEmail: session.user.email ?? 'unknown',
        },
      })

      docs.push({
        documentId: document.id,
        signerToken: jwtToken,
        signerName: cleanName,
        signerEmail: cleanEmail,
        docName,
      })
    }

    return { bulkSend: bs, createdDocs: docs }
  })

  // ── 7. Send signing emails (outside transaction so email failures don't roll back) ──
  const senderName = dbUser?.name ?? dbUser?.email ?? 'Someone'
  const baseUrl =
    process.env.NEXTAUTH_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')

  // Fire all emails in parallel; log individual failures but don't abort the response
  await Promise.allSettled(
    createdDocs.map((d) =>
      sendSigningRequest({
        to: d.signerEmail,
        signerName: d.signerName,
        senderName,
        docName: d.docName,
        signingUrl: `${baseUrl}/sign/${d.signerToken}`,
      })
    )
  )

  return NextResponse.json({ bulkSendId: bulkSend.id, count: createdDocs.length })
}
