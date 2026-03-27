/**
 * GET /api/documents/[id]/prepare
 *
 * Returns document metadata plus all existing signature fields for the
 * prepare editor. Only the document owner may call this.
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // ── Auth check ────────────────────────────────────────────────────────
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  // ── Load document (owner check) ───────────────────────────────────────
  const document = await prisma.document.findFirst({
    where: { id, ownerId: session.user.id },
    select: {
      id: true,
      name: true,
      status: true,
      fileUrl: true,
      createdAt: true,
      // Include any previously-saved fields so the editor can restore them
      signatureFields: {
        select: {
          id: true,
          type: true,
          pageNumber: true,
          x: true,
          y: true,
          width: true,
          height: true,
          signerId: true,
        },
      },
    },
  })

  if (!document) {
    return NextResponse.json({ error: 'Document not found' }, { status: 404 })
  }

  return NextResponse.json({ document })
}
