/**
 * GET /api/documents
 *
 * Returns the current user's documents, most recent first.
 * Supports an optional ?status= query parameter to filter by status.
 *
 * Valid status values: draft | awaiting_signatures | completed
 *
 * Response: { documents: Document[] }
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  // ── Auth check ─────────────────────────────────────────────────────────
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // ── Optional status filter from query string ───────────────────────────
  const { searchParams } = new URL(req.url)
  const statusFilter = searchParams.get('status')

  // Allowed status values — anything else is ignored
  const allowedStatuses = ['draft', 'awaiting_signatures', 'completed']
  const validStatus =
    statusFilter && allowedStatuses.includes(statusFilter) ? statusFilter : undefined

  // ── Query database ─────────────────────────────────────────────────────
  const documents = await prisma.document.findMany({
    where: {
      ownerId: session.user.id,
      // Only apply status filter if a valid one was given
      ...(validStatus ? { status: validStatus } : {}),
    },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      status: true,
      createdAt: true,
      fileUrl: true,
    },
  })

  return NextResponse.json({ documents })
}
