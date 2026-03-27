/**
 * app/login/loading.tsx
 *
 * This file is automatically used by Next.js as the loading state for the
 * /login route. It shows a skeleton placeholder while the page loads.
 *
 * Next.js will display this instantly (it's a Server Component with no data
 * fetching), then swap it out for the real login page once it's ready.
 */

export default function LoginLoading() {
  return (
    <div className="relative min-h-screen flex items-center justify-center px-4
                    bg-sv-bg dark:bg-sv-dark-bg">

      {/* Card skeleton */}
      <div className="w-full max-w-md
                      bg-sv-surface dark:bg-sv-dark-surface
                      border border-sv-border dark:border-sv-dark-border
                      rounded-[var(--radius-card)] shadow-2xl
                      px-8 py-8
                      animate-pulse">

        {/* Logo skeleton */}
        <div className="flex items-center gap-2.5 justify-center mb-8">
          <div className="w-9 h-9 rounded-[8px] bg-sv-border dark:bg-sv-dark-border" />
          <div className="w-28 h-5 rounded bg-sv-border dark:bg-sv-dark-border" />
        </div>

        {/* Tab skeleton */}
        <div className="flex mb-8 border-b border-sv-border dark:border-sv-dark-border pb-3 gap-4">
          <div className="flex-1 h-4 rounded bg-sv-border dark:bg-sv-dark-border" />
          <div className="flex-1 h-4 rounded bg-sv-border dark:bg-sv-dark-border" />
        </div>

        {/* Heading skeleton */}
        <div className="w-40 h-5 rounded bg-sv-border dark:bg-sv-dark-border mb-2" />
        <div className="w-56 h-4 rounded bg-sv-border dark:bg-sv-dark-border mb-6" />

        {/* Email input skeleton */}
        <div className="w-20 h-3.5 rounded bg-sv-border dark:bg-sv-dark-border mb-2" />
        <div className="w-full h-10 rounded-[var(--radius-button)] bg-sv-border dark:bg-sv-dark-border mb-3" />

        {/* Button skeleton */}
        <div className="w-full h-10 rounded-[var(--radius-button)] bg-sv-primary/30 dark:bg-sv-dark-primary/30 mb-5" />

        {/* Divider skeleton */}
        <div className="flex items-center gap-3 mb-5">
          <div className="flex-1 h-px bg-sv-border dark:bg-sv-dark-border" />
          <div className="w-24 h-3 rounded bg-sv-border dark:bg-sv-dark-border" />
          <div className="flex-1 h-px bg-sv-border dark:bg-sv-dark-border" />
        </div>

        {/* OAuth button skeletons */}
        <div className="flex flex-col gap-3">
          <div className="w-full h-10 rounded-[var(--radius-button)] bg-sv-border dark:bg-sv-dark-border" />
          <div className="w-full h-10 rounded-[var(--radius-button)] bg-sv-border dark:bg-sv-dark-border" />
        </div>
      </div>
    </div>
  )
}
