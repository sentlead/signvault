/**
 * templates/layout.tsx — Layout for the /templates page
 *
 * Wraps the templates page with the standard dashboard sidebar + navbar,
 * matching the same pattern used by /documents and /settings.
 * Reads the user's plan from DB so the sidebar badge is always up to date.
 */

import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { Sidebar } from '@/components/dashboard/Sidebar'
import { DashboardNavbar } from '@/components/dashboard/DashboardNavbar'

export default async function TemplatesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session?.user) redirect('/login')

  // Read plan from DB (source of truth) so the sidebar badge is always current
  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { plan: true },
  })
  const userWithPlan = { ...session.user, plan: dbUser?.plan ?? session.user.plan ?? 'free' }

  return (
    <div className="min-h-screen bg-sv-bg dark:bg-sv-dark-bg flex">
      <Sidebar user={userWithPlan} />
      <div className="flex-1 flex flex-col min-w-0 lg:ml-64">
        <DashboardNavbar user={userWithPlan} />
        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
