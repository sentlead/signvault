/**
 * Skeleton.tsx — Reusable animated skeleton placeholder
 *
 * Use this wherever you're loading content to avoid layout shift and
 * give users visual feedback that something is loading.
 *
 * Usage:
 *   <Skeleton className="h-4 w-32" />
 *   <Skeleton className="h-10 w-full rounded-lg" />
 *   <Skeleton className="h-8 w-8 rounded-full" />
 *
 * The component applies an animated pulse (Tailwind's animate-pulse) on a
 * neutral background that works in both light and dark mode.
 */

interface SkeletonProps {
  /** Additional Tailwind classes — set width, height, border-radius, etc. */
  className?: string
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div
      className={`
        animate-pulse rounded
        bg-sv-border dark:bg-sv-dark-border
        ${className}
      `}
      aria-hidden="true"
    />
  )
}
