/**
 * /api/documents/[id]
 *
 * GET  — Returns the full details for a single document (owner only)
 * DELETE — Deletes the document record from the DB AND the file from disk
 *           Cascade deletes handle related records (signers, audit logs, etc.)
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import fs from 'fs'
import path from 'path'

// ─── GET /api/documents/[id] ──────────────────────────────────────────────────

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  // Find the document — only return it if the current user owns it
  const document = await prisma.document.findFirst({
    where: {
      id,
      ownerId: session.user.id,
    },
    include: {
      signers: true,
      auditLogs: {
        orderBy: { timestamp: 'desc' },
        take: 20,
      },
    },
  })

  if (!document) {
    return NextResponse.json({ error: 'Document not found' }, { status: 404 })
  }

  return NextResponse.json({ document })
}

// ─── DELETE /api/documents/[id] ───────────────────────────────────────────────

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  // Find the document first so we can get the file path
  const document = await prisma.document.findFirst({
    where: {
      id,
      ownerId: session.user.id,
    },
    select: { id: true, fileUrl: true },
  })

  if (!document) {
    return NextResponse.json({ error: 'Document not found' }, { status: 404 })
  }

  // ── Delete the file from disk ──────────────────────────────────────────
  // Use a scoped path so bundlers don't trace the entire project directory
  const absoluteFilePath = path.join(/*turbopackIgnore: true*/ process.cwd(), 'uploads', path.basename(document.fileUrl))
  try {
    await fs.promises.unlink(absoluteFilePath)
  } catch (err) {
    // Log but don't fail — the file may have already been removed manually
    const fileErr = err as NodeJS.ErrnoException
    if (fileErr.code !== 'ENOENT') {
      console.error(`[delete-document] Could not delete file: ${absoluteFilePath}`, fileErr)
    }
  }

  // ── Delete the DB record (cascade removes signers, audit logs, etc.) ───
  await prisma.document.delete({
    where: { id: document.id },
  })

  return NextResponse.json({ success: true })
}
