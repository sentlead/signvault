/**
 * POST /api/documents/[id]/void
 *
 * Cancels (voids) a document that is currently awaiting signatures.
 * Only the document owner can void it. Cannot void a draft or completed document.
 *
 * Sets status → 'void' and writes an audit log entry.
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  const document = await prisma.document.findFirst({
    where: { id, ownerId: session.user.id },
    select: { id: true, status: true },
  })

  if (!document) {
    return NextResponse.json({ error: 'Document not found.' }, { status: 404 })
  }

  // Only awaiting_signatures documents can be voided
  if (document.status !== 'awaiting_signatures') {
    return NextResponse.json(
      { error: 'Only documents awaiting signatures can be voided.' },
      { status: 400 }
    )
  }

  await prisma.$transaction([
    prisma.document.update({
      where: { id },
      data: { status: 'void' },
    }),
    prisma.auditLog.create({
      data: {
        documentId: id,
        action: 'document_voided',
        actorEmail: session.user.email ?? 'unknown',
      },
    }),
  ])

  return NextResponse.json({ success: true })
}
