'use client'

/**
 * AdSidebar.tsx — Advertisement sidebar for the dashboard (xl+ screens only)
 *
 * Shows two AdSense units stacked vertically:
 *   - 300×250 Medium Rectangle
 *   - 160×600 Wide Skyscraper
 *
 * Uses the AdUnit component which handles lazy script loading, fallback
 * placeholder display, and dark/light mode support.
 *
 * This must be a Client Component because AdUnit uses useEffect.
 */

import { AdUnit } from '@/components/ui/AdUnit'

export function AdSidebar() {
  return (
    <aside className="hidden xl:flex flex-col gap-4 w-[180px] flex-shrink-0">

      {/* ── Medium Rectangle: 300×250 ─────────────────────────────────────── */}
      <div>
        <p className="text-[10px] text-sv-secondary dark:text-sv-dark-secondary mb-1 uppercase tracking-widest">
          Advertisement
        </p>
        <AdUnit
          slot="1111111111"
          format="rectangle"
          style={{ width: 180, height: 150 }}
          className="rounded-[8px]"
        />
      </div>

      {/* ── Wide Skyscraper: 160×600 ─────────────────────────────────────── */}
      <div>
        <p className="text-[10px] text-sv-secondary dark:text-sv-dark-secondary mb-1 uppercase tracking-widest">
          Advertisement
        </p>
        <AdUnit
          slot="2222222222"
          format="vertical"
          style={{ width: 180, height: 400 }}
          className="rounded-[8px]"
        />
      </div>

    </aside>
  )
}
