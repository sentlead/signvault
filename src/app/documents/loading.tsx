/**
 * documents/loading.tsx — Documents Page Loading State
 *
 * Next.js automatically renders this file while the documents page is
 * fetching data from the database.
 */

import { DocumentListSkeleton } from '@/components/dashboard/DocumentListSkeleton'
import { Skeleton } from '@/components/ui/Skeleton'

export default function DocumentsLoading() {
  return (
    <div className="space-y-6">

      {/* Page title skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-36" />
        <Skeleton className="h-4 w-24" />
      </div>

      {/* Quick actions skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Skeleton className="h-44 rounded-[var(--radius-card)]" />
        <Skeleton className="h-44 rounded-[var(--radius-card)]" />
      </div>

      {/* Document list skeleton */}
      <DocumentListSkeleton />
    </div>
  )
}
