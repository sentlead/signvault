/**
 * documents/page.tsx — My Documents Page (Server Component)
 *
 * Lists ALL of the user's documents (not just the 10 most recent).
 * Supports filtering by status via the ?filter= query param,
 * which the sidebar "Sent for Signing" link uses (?filter=sent).
 */

import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { DocumentList } from '@/components/dashboard/DocumentList'
import { QuickActions } from '@/components/dashboard/QuickActions'

export default async function DocumentsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>
}) {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const { filter } = await searchParams

  // Map the sidebar's ?filter= query param to a DB status value
  const statusFilter =
    filter === 'sent'      ? 'awaiting_signatures' :
    filter === 'completed' ? 'completed'            :
    filter === 'drafts'    ? 'draft'                :
    filter === 'expired'   ? 'expired'              :
    undefined

  const documents = await prisma.document.findMany({
    where: {
      ownerId: session.user.id,
      ...(statusFilter ? { status: statusFilter } : {}),
    },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      status: true,
      createdAt: true,
      expiresAt: true,  // needed for expiry warning badges in DocumentList
    },
  })

  const pageTitle =
    filter === 'sent'      ? 'Sent for Signing' :
    filter === 'completed' ? 'Completed'         :
    filter === 'drafts'    ? 'Drafts'            :
    filter === 'expired'   ? 'Expired'           :
    'My Documents'

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-sv-text dark:text-sv-dark-text">
          {pageTitle}
        </h1>
        <p className="text-sm text-sv-secondary dark:text-sv-dark-secondary mt-1">
          {documents.length} document{documents.length !== 1 ? 's' : ''}
        </p>
      </div>

      <QuickActions />

      <DocumentList documents={documents} />
    </div>
  )
}
