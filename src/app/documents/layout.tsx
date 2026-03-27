/**
 * documents/layout.tsx — Layout for all /documents/* pages
 *
 * Wraps document pages with the same sidebar + navbar as the dashboard.
 * The signing and prepare pages (/documents/[id]/sign, /prepare) are
 * intentionally full-screen — they override this via their own layout logic.
 */

import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { Sidebar } from '@/components/dashboard/Sidebar'
import { DashboardNavbar } from '@/components/dashboard/DashboardNavbar'

export default async function DocumentsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session?.user) redirect('/login')

  return (
    <div className="min-h-screen bg-sv-bg dark:bg-sv-dark-bg flex">
      <Sidebar user={session.user} />
      <div className="flex-1 flex flex-col min-w-0 lg:ml-64">
        <DashboardNavbar user={session.user} />
        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
