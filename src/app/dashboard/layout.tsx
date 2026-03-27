/**
 * dashboard/layout.tsx — Dashboard Layout (Server Component)
 *
 * This layout wraps every page inside /dashboard/*.
 * It checks that the user is logged in — if not, it bounces them to /login.
 * It renders a two-column layout: a fixed sidebar on the left and
 * the main content area on the right.
 */

import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { Sidebar } from '@/components/dashboard/Sidebar'
import { DashboardNavbar } from '@/components/dashboard/DashboardNavbar'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session?.user) redirect('/login')

  return (
    <div className="min-h-screen bg-sv-bg dark:bg-sv-dark-bg flex">
      {/* ── Sidebar (desktop: fixed left column, mobile: drawer) ─────────── */}
      <Sidebar user={session.user} />

      {/* ── Right side: Navbar + Page content ────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 lg:ml-64">
        {/* Top navbar — handles mobile hamburger + search + theme toggle */}
        <DashboardNavbar user={session.user} />

        {/* Page content — padded and scrollable */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
