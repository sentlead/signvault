/**
 * documents/[id]/sign/page.tsx — Signing Page (Server Component)
 *
 * This server component:
 *   1. Checks the user is authenticated (redirects to /login if not)
 *   2. Loads the document from the database and verifies ownership
 *   3. Loads all signature fields for this document
 *   4. If no fields exist, redirects back to the prepare step
 *   5. Passes data to the client-side SigningEditor component
 *
 * Phase 6 stub: a ?token=xxx query param will allow external signers
 * to access this page without a session. For now it is ignored.
 */

import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { SigningEditor } from '@/components/sign/SigningEditor'

interface PageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ token?: string }>
}

export default async function SignPage({ params, searchParams }: PageProps) {
  const { id } = await params
  // Phase 6: token param will be used for external signers — read but ignore for now
  const { token: _token } = await searchParams

  // ── Auth guard ───────────────────────────────────────────────────────────
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  // ── Load document with signature fields ─────────────────────────────────
  const document = await prisma.document.findFirst({
    where: { id, ownerId: session.user.id },
    select: {
      id: true,
      name: true,
      status: true,
      signedFileUrl: true,
      signatureFields: {
        select: {
          id: true,
          type: true,
          pageNumber: true,
          x: true,
          y: true,
          width: true,
          height: true,
          value: true,
        },
        orderBy: { pageNumber: 'asc' },
      },
    },
  })

  // Document not found or doesn't belong to this user
  if (!document) redirect('/dashboard')

  // If no fields have been placed yet, redirect back to prepare
  if (document.signatureFields.length === 0) {
    redirect(`/documents/${id}/prepare`)
  }

  return (
    <SigningEditor
      documentId={document.id}
      documentName={document.name}
      initialFields={document.signatureFields}
      signerEmail={session.user.email ?? ''}
      signerName={session.user.name ?? ''}
    />
  )
}
