/**
 * documents/[id]/prepare/page.tsx — Prepare Document Page (Server Component)
 *
 * This server component:
 *   1. Checks the user is authenticated (redirects to /login if not)
 *   2. Loads the document from the database and verifies ownership
 *   3. Passes data to the client-side PrepareEditor component
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

  // ── Load document with existing fields ───────────────────────────────
  const document = await prisma.document.findFirst({
    where: { id, ownerId: session.user.id },
    select: {
      id: true,
      name: true,
      status: true,
      // Load any previously placed fields so the editor restores them
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

  // If the document doesn't exist or belongs to someone else, go to dashboard
  if (!document) redirect('/dashboard')

  return (
    <PrepareEditor
      documentId={document.id}
      documentName={document.name}
      initialFields={document.signatureFields}
    />
  )
}
