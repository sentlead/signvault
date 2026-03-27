/**
 * dashboard/loading.tsx — Dashboard Loading State
 *
 * Next.js automatically renders this file while the dashboard page is
 * fetching data. It shows skeleton placeholders that match the real
 * layout so the page doesn't jump when content arrives.
 */

import { DocumentListSkeleton } from '@/components/dashboard/DocumentListSkeleton'
import { Skeleton } from '@/components/ui/Skeleton'

export default function DashboardLoading() {
  return (
    <div className="flex gap-8">
      {/* ── Main content area ─────────────────────────────────────────────── */}
      <div className="flex-1 min-w-0 space-y-6">

        {/* Page title skeleton */}
        <div className="space-y-2">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-4 w-64" />
        </div>

        {/* Quick actions skeleton (two cards side by side) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Skeleton className="h-44 rounded-[var(--radius-card)]" />
          <Skeleton className="h-44 rounded-[var(--radius-card)]" />
        </div>

        {/* Section heading + document list */}
        <div className="space-y-3">
          <Skeleton className="h-5 w-36" />
          <DocumentListSkeleton />
        </div>
      </div>

      {/* ── Ad sidebar skeleton (xl only) ────────────────────────────────── */}
      <div className="hidden xl:flex flex-col gap-4 w-[180px] flex-shrink-0">
        <Skeleton className="h-[150px] rounded-[8px]" />
        <Skeleton className="h-[400px] rounded-[8px]" />
      </div>
    </div>
  )
}
