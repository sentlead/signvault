/**
 * POST /api/documents/[id]/send
 *
 * Receives the list of signers and placed fields from the PrepareEditor
 * (in "Send for Signatures" mode), then:
 *
 *   1. Auth check — must be the document owner
 *   2. Validate — at least 1 signer, all fields assigned to a signer
 *   3. Delete any existing signers and fields for this document
 *   4. Create Signer records (one per person), generating a JWT for each
 *   5. Create SignatureField records, linking each to the correct Signer
 *   6. Update document status → 'awaiting_signatures'
 *   7. Send a signing-request email to every signer
 *   8. Write an audit log entry
 *   9. Return { success: true }
 *
 * Body shape:
 * {
 *   signers: Array<{ name: string, email: string }>,
 *   fields:  Array<{ type, pageNumber, x, y, width, height, signerIndex: number }>
 * }
 *
 * Note: the client sends `signerIndex` (not a temporary client ID) so we can
 * map each field to the correct server-generated Signer record.
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { createSigningToken } from '@/lib/signing-token'
import { sendSigningRequest } from '@/lib/emails'

// ── Request body types ────────────────────────────────────────────────────────

interface SignerInput {
  name: string
  email: string
}

interface FieldInput {
  type: string
  pageNumber: number
  x: number
  y: number
  width: number
  height: number
  /** Index into the signers array — tells us which signer owns this field */
  signerIndex: number
}

interface RequestBody {
  signers: SignerInput[]
  fields: FieldInput[]
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // ── 1. Auth check ────────────────────────────────────────────────────────
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  // ── 2. Verify ownership ──────────────────────────────────────────────────
  const document = await prisma.document.findFirst({
    where: { id, ownerId: session.user.id },
    select: {
      id: true,
      name: true,
      owner: { select: { name: true, email: true } },
    },
  })
  if (!document) {
    return NextResponse.json({ error: 'Document not found' }, { status: 404 })
  }

  // ── 3. Parse body ────────────────────────────────────────────────────────
  let body: RequestBody
  try {
    body = (await req.json()) as RequestBody
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { signers, fields } = body

  // ── 4. Validate ──────────────────────────────────────────────────────────
  if (!Array.isArray(signers) || signers.length === 0) {
    return NextResponse.json({ error: 'At least one signer is required' }, { status: 400 })
  }

  if (!Array.isArray(fields) || fields.length === 0) {
    return NextResponse.json({ error: 'At least one field is required' }, { status: 400 })
  }

  // Every field must have a valid signerIndex
  const invalidField = fields.find(
    (f) => typeof f.signerIndex !== 'number' || f.signerIndex < 0 || f.signerIndex >= signers.length
  )
  if (invalidField) {
    return NextResponse.json(
      { error: 'All fields must be assigned to a valid signer' },
      { status: 400 }
    )
  }

  // ── 5. Delete existing signers and fields ────────────────────────────────
  // We use a transaction so either everything succeeds or nothing changes.
  const createdSigners = await prisma.$transaction(async (tx) => {
    // Delete old signature fields first (foreign key: field → signer)
    await tx.signatureField.deleteMany({ where: { documentId: id } })
    // Delete old signers
    await tx.signer.deleteMany({ where: { documentId: id } })

    // ── 6. Create Signer records ─────────────────────────────────────────
    // We create them one by one so we can get each ID before creating the JWT.
    const newSigners: Array<{ id: string; name: string; email: string; token: string }> = []

    for (const signerInput of signers) {
      const signer = await tx.signer.create({
        data: {
          documentId: id,
          name: signerInput.name,
          email: signerInput.email,
          status: 'pending',
        },
        select: { id: true, name: true, email: true },
      })

      // Generate a JWT that encodes this signer's ID and the document ID
      const jwtToken = await createSigningToken(signer.id, id)

      // Store the token in the DB so we can regenerate the URL for reminders
      await tx.signer.update({
        where: { id: signer.id },
        data: { token: jwtToken },
      })

      newSigners.push({ ...signer, token: jwtToken })
    }

    // ── 7. Create SignatureField records ─────────────────────────────────
    await tx.signatureField.createMany({
      data: fields.map((f) => ({
        documentId: id,
        signerId: newSigners[f.signerIndex].id,
        type: f.type,
        pageNumber: f.pageNumber,
        x: f.x,
        y: f.y,
        width: f.width,
        height: f.height,
      })),
    })

    // ── 8. Update document status ─────────────────────────────────────────
    await tx.document.update({
      where: { id },
      data: { status: 'awaiting_signatures' },
    })

    return newSigners
  })

  // ── 9. Send signing-request emails ───────────────────────────────────────
  // Do this outside the transaction so a failed email doesn't roll back the DB changes.
  const senderName = document.owner.name ?? document.owner.email ?? 'Someone'
  const baseUrl = process.env.NEXTAUTH_URL ?? 'http://localhost:3000'

  await Promise.all(
    createdSigners.map((signer) =>
      sendSigningRequest({
        to: signer.email,
        signerName: signer.name,
        senderName,
        docName: document.name,
        signingUrl: `${baseUrl}/sign/${signer.token}`,
      })
    )
  )

  // ── 10. Write audit log ───────────────────────────────────────────────────
  await prisma.auditLog.create({
    data: {
      documentId: id,
      action: 'document_sent',
      actorEmail: session.user.email ?? 'unknown',
    },
  })

  return NextResponse.json({ success: true })
}
