/**
 * dashboard/page.tsx — Dashboard Home Page (Server Component)
 *
 * Fetches the current user's most recent 10 documents from the database
 * and passes them to the client-side DocumentList component.
 *
 * Also renders the QuickActions cards and the AdSidebar placeholder.
 */

import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { QuickActions } from '@/components/dashboard/QuickActions'
import { DocumentList } from '@/components/dashboard/DocumentList'
import { AdSidebar } from '@/components/dashboard/AdSidebar'

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  // Fetch the user's most recent 10 documents
  const documents = await prisma.document.findMany({
    where: { ownerId: session.user.id },
    orderBy: { createdAt: 'desc' },
    take: 10,
    select: {
      id: true,
      name: true,
      status: true,
      createdAt: true,
    },
  })

  return (
    <div className="flex gap-8">
      {/* ── Main content area ─────────────────────────────────────────────── */}
      <div className="flex-1 min-w-0 space-y-6">

        {/* Page title */}
        <div>
          <h1 className="text-2xl font-bold text-sv-text dark:text-sv-dark-text">
            Dashboard
          </h1>
          <p className="text-sm text-sv-secondary dark:text-sv-dark-secondary mt-1">
            Welcome back{session.user.name ? `, ${session.user.name.split(' ')[0]}` : ''}! Here&apos;s what&apos;s happening.
          </p>
        </div>

        {/* Quick action cards */}
        <QuickActions />

        {/* Recent documents */}
        <div>
          <h2 className="text-base font-semibold text-sv-text dark:text-sv-dark-text mb-3">
            Recent Documents
          </h2>
          {/* DocumentList is a client component that handles filtering + delete */}
          <DocumentList documents={documents} />
        </div>
      </div>

      {/* ── Ad sidebar (xl screens only) ────────────────────────────────── */}
      <AdSidebar />
    </div>
  )
}
