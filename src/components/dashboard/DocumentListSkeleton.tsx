/**
 * DocumentListSkeleton.tsx — Skeleton loading state for the document list
 *
 * Shows 5 placeholder rows while the real document data is loading.
 * Each row mimics the layout of a real DocumentList row:
 *   [icon] [name + date (mobile)] [status badge] [date] [actions]
 *
 * Rendered by the loading.tsx files next to dashboard and documents pages.
 */

import { Skeleton } from '@/components/ui/Skeleton'

/**
 * A single skeleton row — matches the structure of a DocumentList row.
 * Hidden fields (status badge, date) mirror the responsive visibility of
 * the real row (hidden on mobile, shown on md+).
 */
function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 p-4">
      {/* Document icon placeholder */}
      <Skeleton className="w-9 h-9 rounded-[8px] flex-shrink-0" />

      {/* Name + sub-line placeholder */}
      <div className="flex-1 space-y-1.5 min-w-0">
        <Skeleton className="h-3.5 w-48 max-w-full" />
        <Skeleton className="h-3 w-24" />
      </div>

      {/* Status badge — hidden on mobile */}
      <Skeleton className="hidden md:block h-5 w-16 rounded-full" />

      {/* Date — hidden on mobile */}
      <Skeleton className="hidden md:block h-3 w-20" />

      {/* Action buttons */}
      <div className="flex gap-2">
        <Skeleton className="w-8 h-8 rounded-[8px]" />
        <Skeleton className="w-8 h-8 rounded-[8px]" />
      </div>
    </div>
  )
}

export function DocumentListSkeleton() {
  return (
    <div
      className="
        bg-sv-surface dark:bg-sv-dark-surface
        border border-sv-border dark:border-sv-dark-border
        rounded-[var(--radius-card)] overflow-hidden
      "
      aria-label="Loading documents..."
      role="status"
    >
      {/* Tab bar skeleton */}
      <div className="flex gap-2 px-4 py-3 border-b border-sv-border dark:border-sv-dark-border">
        <Skeleton className="h-4 w-8" />
        <Skeleton className="h-4 w-14" />
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-20" />
      </div>

      {/* Five skeleton rows */}
      <div className="divide-y divide-sv-border dark:divide-sv-dark-border">
        <SkeletonRow />
        <SkeletonRow />
        <SkeletonRow />
        <SkeletonRow />
        <SkeletonRow />
      </div>
    </div>
  )
}
