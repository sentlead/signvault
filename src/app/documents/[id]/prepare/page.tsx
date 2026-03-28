/**
 * documents/[id]/prepare/page.tsx — Prepare Document Page (Server Component)
 *
 * This server component:
 *   1. Checks the user is authenticated (redirects to /login if not)
 *   2. Loads the document from the database and verifies ownership
 *   3. Also loads any pre-created signers (e.g. when started from a template)
 *   4. Passes everything to the client-side PrepareEditor component
 *
 * The actual PDF viewer, toolbar, and field placement logic all live in
 * PrepareEditor (a 'use client' component) because they need browser APIs.
 */

import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { PrepareEditor } from '@/components/prepare/PrepareEditor'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function PreparePage({ params }: PageProps) {
  const { id } = await params

  // ── Auth guard ───────────────────────────────────────────────────────
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  // ── Load document with existing fields AND signers ────────────────────
  // Signers exist when this document was started from a template
  // (the "use template" API pre-creates them).
  const document = await prisma.document.findFirst({
    where: { id, ownerId: session.user.id },
    select: {
      id: true,
      name: true,
      status: true,
      // Previously placed fields (restored when editor loads)
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
      // Pre-created signers from a template "use" flow
      signers: {
        select: { id: true, name: true, email: true },
        orderBy: { id: 'asc' },
      },
    },
  })

  // If the document doesn't exist or belongs to someone else, go to dashboard
  if (!document) redirect('/dashboard')

  return (
    <PrepareEditor
      documentId={document.id}
      documentName={document.name}
      initialFields={document.signatureFields}
      // Only pass initialSigners when the document was started from a template
      // (indicated by having pre-created signers before the user adds any)
      initialSigners={document.signers.length > 0 ? document.signers : undefined}
    />
  )
}
