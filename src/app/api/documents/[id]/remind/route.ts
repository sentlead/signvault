/**
 * POST /api/documents/[id]/remind
 *
 * Sends a reminder email to a specific signer who hasn't signed yet.
 * Only the document owner can trigger reminders.
 *
 * Body: { signerId: string }
 *
 * Steps:
 *   1. Auth check — must be the document owner
 *   2. Load the document and verify status is 'awaiting_signatures'
 *   3. Load the signer and verify status is still 'pending'
 *   4. Send reminder email via Resend
 *   5. Write audit log entry
 *   6. Return { success: true }
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { sendSigningReminder } from '@/lib/emails'

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

  // ── 2. Verify ownership and document status ──────────────────────────────
  const document = await prisma.document.findFirst({
    where: { id, ownerId: session.user.id },
    select: {
      id: true,
      name: true,
      status: true,
      owner: { select: { name: true, email: true } },
    },
  })

  if (!document) {
    return NextResponse.json({ error: 'Document not found' }, { status: 404 })
  }

  if (document.status !== 'awaiting_signatures') {
    return NextResponse.json(
      { error: 'Document is not awaiting signatures' },
      { status: 400 }
    )
  }

  // ── 3. Parse body ────────────────────────────────────────────────────────
  let body: { signerId: string }
  try {
    body = (await req.json()) as { signerId: string }
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (!body.signerId) {
    return NextResponse.json({ error: 'signerId is required' }, { status: 400 })
  }

  // ── 4. Load signer and verify they haven't signed yet ───────────────────
  const signer = await prisma.signer.findFirst({
    where: { id: body.signerId, documentId: id },
    select: { id: true, name: true, email: true, status: true, token: true },
  })

  if (!signer) {
    return NextResponse.json({ error: 'Signer not found' }, { status: 404 })
  }

  if (signer.status === 'signed') {
    return NextResponse.json(
      { error: 'This signer has already signed the document' },
      { status: 400 }
    )
  }

  // ── 5. Send reminder email ────────────────────────────────────────────────
  const senderName = document.owner.name ?? document.owner.email ?? 'Someone'
  const baseUrl = process.env.NEXTAUTH_URL ?? 'http://localhost:3000'

  await sendSigningReminder({
    to: signer.email,
    signerName: signer.name,
    senderName,
    docName: document.name,
    signingUrl: `${baseUrl}/sign/${signer.token}`,
  })

  // ── 6. Write audit log ────────────────────────────────────────────────────
  await prisma.auditLog.create({
    data: {
      documentId: id,
      action: 'reminder_sent',
      actorEmail: session.user.email ?? 'unknown',
    },
  })

  return NextResponse.json({ success: true })
}
