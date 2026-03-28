/**
 * /api/templates/[id] — Get or delete a single template
 *
 * GET    — returns template details (fields + signerRoles parsed from JSON)
 * DELETE — deletes the template (only owner can delete)
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

interface RouteParams {
  params: Promise<{ id: string }>
}

// ── GET /api/templates/[id] ───────────────────────────────────────────────────

export async function GET(_req: NextRequest, { params }: RouteParams) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const { id } = await params

  const template = await prisma.template.findFirst({
    where: { id, ownerId: session.user.id },
  })

  if (!template) {
    return NextResponse.json({ error: 'Template not found.' }, { status: 404 })
  }

  return NextResponse.json({
    template: {
      ...template,
      // Parse JSON strings back into arrays for the client
      fields: JSON.parse(template.fields),
      signerRoles: JSON.parse(template.signerRoles),
    },
  })
}

// ── DELETE /api/templates/[id] ────────────────────────────────────────────────

export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const { id } = await params

  // Verify the template belongs to this user before deleting
  const template = await prisma.template.findFirst({
    where: { id, ownerId: session.user.id },
    select: { id: true },
  })

  if (!template) {
    return NextResponse.json({ error: 'Template not found.' }, { status: 404 })
  }

  await prisma.template.delete({ where: { id } })

  return NextResponse.json({ ok: true })
}
