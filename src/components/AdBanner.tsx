'use client'

/**
 * AdBanner.tsx — Horizontal ad banner between sections.
 * Currently shows the animated horoscopum.com house ad.
 */

import { motion } from 'framer-motion'
import { HoroscopumAd } from '@/components/ui/HoroscopumAd'

export function AdBanner() {
  return (
    <section className="py-8 px-6 bg-sv-bg dark:bg-sv-dark-bg">
      <div className="max-w-4xl mx-auto">
        <p className="text-[10px] text-sv-secondary dark:text-sv-dark-secondary
                      mb-1 uppercase tracking-widest text-center">
          Advertisement
        </p>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <HoroscopumAd />
        </motion.div>
      </div>
    </section>
  )
}
