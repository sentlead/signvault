/**
 * /api/templates — List and create templates
 *
 * GET  — returns all templates owned by the current user
 * POST — creates a new template from a document's current field layout
 *        (enforces plan limits: Free = 3, Pro/Business = unlimited)
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { getPlan } from '@/lib/plans'

// ── Types for template JSON fields ────────────────────────────────────────────

// A field stored in the template (positions are percentages of page size)
export interface TemplateField {
  type: 'signature' | 'initials' | 'date' | 'text'
  pageNumber: number
  x: number
  y: number
  width: number
  height: number
  signerRoleIndex: number  // -1 = unassigned (self-sign), >= 0 = index into signerRoles
}

// A signer role stored in the template (just a label, not real contact info)
export interface SignerRole {
  role: string  // e.g. "Client", "Witness", "Signer 1"
}

// ── GET /api/templates ────────────────────────────────────────────────────────

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const templates = await prisma.template.findMany({
    where: { ownerId: session.user.id },
    select: {
      id: true,
      name: true,
      description: true,
      fileUrl: true,
      fields: true,
      signerRoles: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({ templates })
}

// ── POST /api/templates ───────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const body = await req.json() as {
    name?: string
    description?: string
    documentId?: string
    fields?: TemplateField[]
    signerRoles?: SignerRole[]
  }

  const { name, description, documentId, fields = [], signerRoles = [] } = body

  // Validate required fields
  if (!name?.trim()) {
    return NextResponse.json({ error: 'Template name is required.' }, { status: 400 })
  }
  if (!documentId) {
    return NextResponse.json({ error: 'documentId is required.' }, { status: 400 })
  }
  if (fields.length === 0) {
    return NextResponse.json({ error: 'Add at least one field before saving as a template.' }, { status: 400 })
  }

  // Get the document's fileUrl (and verify ownership)
  const document = await prisma.document.findFirst({
    where: { id: documentId, ownerId: session.user.id },
    select: { fileUrl: true },
  })

  if (!document) {
    return NextResponse.json({ error: 'Document not found.' }, { status: 404 })
  }

  // Enforce plan template limit
  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { plan: true },
  })
  const plan = getPlan(dbUser?.plan ?? 'free')
  const limit = plan.limits.savedTemplates  // -1 = unlimited

  if (limit !== -1) {
    const count = await prisma.template.count({ where: { ownerId: session.user.id } })
    if (count >= limit) {
      return NextResponse.json({
        error: `You've reached the ${limit}-template limit on the Free plan. Upgrade to Pro for unlimited templates.`,
        code: 'TEMPLATE_LIMIT_REACHED',
      }, { status: 403 })
    }
  }

  // Create the template
  const template = await prisma.template.create({
    data: {
      ownerId: session.user.id,
      name: name.trim(),
      description: description?.trim() || null,
      fileUrl: document.fileUrl,
      fields: JSON.stringify(fields),
      signerRoles: JSON.stringify(signerRoles),
    },
    select: { id: true, name: true },
  })

  return NextResponse.json({ templateId: template.id, name: template.name })
}
