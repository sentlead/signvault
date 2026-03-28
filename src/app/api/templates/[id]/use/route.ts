/**
 * POST /api/templates/[id]/use
 *
 * Creates a new Document from a saved template. This is called when a user
 * clicks "Use Template" on the templates page or the new-document page.
 *
 * What it does:
 *   1. Loads the template (verifies ownership)
 *   2. Creates a new Document record pointing to the template's PDF
 *   3. If signers are provided (send-mode templates), creates Signer records
 *   4. Creates SignatureField records from the template's saved field layout,
 *      mapping signerRoleIndex → the newly created Signer IDs
 *   5. Returns { documentId } so the client can redirect to /documents/[id]/prepare
 *
 * Request body:
 *   {
 *     signers?: Array<{ name: string; email: string }>
 *     // One entry per signer role in the template. May be omitted for self-sign templates.
 *   }
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import type { TemplateField, SignerRole } from '../../route'

interface RouteParams {
  params: Promise<{ id: string }>
}

interface RequestBody {
  signers?: { name: string; email: string }[]
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const { id } = await params
  const body = await req.json() as RequestBody
  const { signers = [] } = body

  // ── Load the template (verify this user owns it) ──────────────────────────
  const template = await prisma.template.findFirst({
    where: { id, ownerId: session.user.id },
  })

  if (!template) {
    return NextResponse.json({ error: 'Template not found.' }, { status: 404 })
  }

  // Parse the stored JSON strings back into arrays
  const templateFields = JSON.parse(template.fields) as TemplateField[]
  const signerRoles = JSON.parse(template.signerRoles) as SignerRole[]

  // ── Validate signer count matches template roles ──────────────────────────
  // If the template has signer roles, the caller must provide the same number of signers.
  if (signerRoles.length > 0 && signers.length !== signerRoles.length) {
    return NextResponse.json({
      error: `This template requires ${signerRoles.length} signer(s). Please fill in all signer details.`,
    }, { status: 400 })
  }

  // Validate signer emails if provided
  for (const s of signers) {
    if (!s.name?.trim() || !s.email?.trim() || !s.email.includes('@')) {
      return NextResponse.json({ error: 'All signers must have a valid name and email.' }, { status: 400 })
    }
  }

  // ── Create document + signers + fields in a single transaction ────────────
  // A transaction ensures we don't end up with a partial document if something fails.
  const result = await prisma.$transaction(async (tx) => {
    // Create the new Document record (uses the template's PDF file)
    const document = await tx.document.create({
      data: {
        ownerId: session.user.id!,
        name: template.name,
        fileUrl: template.fileUrl,
        status: 'draft',
      },
    })

    // Create Signer records (one per signer provided by the user)
    // Each signer's array index maps to a role in the template's signerRoles.
    const createdSigners = signers.length > 0
      ? await Promise.all(
          signers.map((s) =>
            tx.signer.create({
              data: {
                documentId: document.id,
                name: s.name.trim(),
                email: s.email.trim().toLowerCase(),
              },
              select: { id: true },
            })
          )
        )
      : []

    // Create SignatureField records from the template's field layout.
    // For each field, signerRoleIndex tells us which signer it belongs to.
    // We map that index to the real Signer ID we just created.
    if (templateFields.length > 0) {
      await tx.signatureField.createMany({
        data: templateFields.map((f) => ({
          documentId: document.id,
          type: f.type,
          pageNumber: f.pageNumber,
          x: f.x,
          y: f.y,
          width: f.width,
          height: f.height,
          // If there's a valid signer for this role index, assign it. Otherwise null (self-sign).
          signerId: f.signerRoleIndex >= 0 && createdSigners[f.signerRoleIndex]
            ? createdSigners[f.signerRoleIndex].id
            : null,
        })),
      })
    }

    return document
  })

  return NextResponse.json({ documentId: result.id })
}
