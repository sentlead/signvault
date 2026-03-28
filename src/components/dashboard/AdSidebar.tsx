'use client'

/**
 * AdSidebar.tsx — Advertisement sidebar for the dashboard (xl+ screens only)
 *
 * Hidden entirely for Pro/Business users — no ads for paid plans.
 */

import { AdUnit } from '@/components/ui/AdUnit'
import { HoroscopumAd } from '@/components/ui/HoroscopumAd'
import { isPaidPlan } from '@/lib/plans'

interface AdSidebarProps {
  plan?: string
}

export function AdSidebar({ plan }: AdSidebarProps) {
  // Paid users don't see ads
  if (isPaidPlan(plan ?? 'free')) return null

  return (
    <aside className="hidden xl:flex flex-col gap-4 w-[180px] flex-shrink-0">

      {/* ── Horoscopum.com mockup ad ───────────────────────────────────────── */}
      <div>
        <p className="text-[10px] text-sv-secondary dark:text-sv-dark-secondary mb-1 uppercase tracking-widest">
          Advertisement
        </p>
        <HoroscopumAd />
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
