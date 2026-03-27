/**
 * /api/documents/[id]/fields
 *
 * GET  — Return all signature fields for a document (owner only)
 * POST — Replace all fields for a document with the provided list
 *         Body: { fields: FieldInput[] }
 *         Deletes existing fields then inserts the new set in one transaction.
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

// Shape of each field coming from the prepare editor
interface FieldInput {
  type: string
  pageNumber: number
  x: number
  y: number
  width: number
  height: number
  signerId?: string
}

// ─── GET /api/documents/[id]/fields ──────────────────────────────────────────

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  // Verify ownership first
  const doc = await prisma.document.findFirst({
    where: { id, ownerId: session.user.id },
    select: { id: true },
  })
  if (!doc) {
    return NextResponse.json({ error: 'Document not found' }, { status: 404 })
  }

  const fields = await prisma.signatureField.findMany({
    where: { documentId: id },
  })

  return NextResponse.json({ fields })
}

// ─── POST /api/documents/[id]/fields ─────────────────────────────────────────

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  // Verify ownership
  const doc = await prisma.document.findFirst({
    where: { id, ownerId: session.user.id },
    select: { id: true },
  })
  if (!doc) {
    return NextResponse.json({ error: 'Document not found' }, { status: 404 })
  }

  // Parse and validate body
  let body: { fields: FieldInput[] }
  try {
    body = (await req.json()) as { fields: FieldInput[] }
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (!Array.isArray(body.fields)) {
    return NextResponse.json({ error: 'fields must be an array' }, { status: 400 })
  }

  // ── Atomic replace: delete old fields, insert new ones ───────────────
  const savedFields = await prisma.$transaction(async (tx) => {
    // Delete all current fields for this document
    await tx.signatureField.deleteMany({ where: { documentId: id } })

    // Insert the new fields (empty array = clear all)
    if (body.fields.length === 0) return []

    return tx.signatureField.createManyAndReturn({
      data: body.fields.map((f) => ({
        documentId: id,
        type: f.type,
        pageNumber: f.pageNumber,
        x: f.x,
        y: f.y,
        width: f.width,
        height: f.height,
        signerId: f.signerId ?? null,
      })),
    })
  })

  return NextResponse.json({ success: true, fields: savedFields })
}
