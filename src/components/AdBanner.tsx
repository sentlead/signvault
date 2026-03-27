'use client'

/**
 * AdBanner.tsx — Horizontal leaderboard ad unit (728×90)
 *
 * Uses the AdUnit component which loads Google AdSense lazily.
 * When NEXT_PUBLIC_ADSENSE_ID is not set, shows a styled placeholder.
 * Fades in with Framer Motion when it enters the viewport.
 */

import { motion } from 'framer-motion'
import { AdUnit } from '@/components/ui/AdUnit'

export function AdBanner() {
  return (
    <section className="py-8 px-6 bg-sv-bg dark:bg-sv-dark-bg">
      <div className="max-w-4xl mx-auto">
        <p className="text-[10px] text-sv-secondary dark:text-sv-dark-secondary
                      mb-1 uppercase tracking-widest text-center">
          Advertisement
        </p>
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
        >
          {/* 728×90 leaderboard format — standard top-of-page banner */}
          <AdUnit
            slot="0000000000"
            format="horizontal"
            style={{ width: '100%', height: 90, maxWidth: 728, margin: '0 auto' }}
            className="rounded-[12px] overflow-hidden"
          />
        </motion.div>
      </div>
    </section>
  )
}
