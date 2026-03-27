'use client'

/**
 * TrustSection.tsx
 *
 * Builds credibility with visitors by showing:
 *   - An animated counter ("12,847 users") that counts up when visible
 *   - Four trust badges: encryption, legal status, GDPR, and no credit card
 *
 * The counter uses Framer Motion's useMotionValue + useTransform to animate
 * a number from 0 to 12,847 when this section scrolls into view.
 *
 * 'use client' is required for Framer Motion hooks.
 */

import { useEffect, useRef, useState } from 'react'
import { motion, useInView, useMotionValue, animate } from 'framer-motion'
import { Lock, Scale, Globe, CreditCard, CheckCircle2 } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

interface TrustBadge {
  icon: LucideIcon
  label: string
  detail: string
}

const trustBadges: TrustBadge[] = [
  {
    icon: Lock,
    label: '256-bit Encryption',
    detail: 'Bank-grade AES-256 encryption protects every document.',
  },
  {
    icon: Scale,
    label: 'Legally Binding',
    detail: 'Compliant with ESIGN Act, UETA, and eIDAS regulations.',
  },
  {
    icon: Globe,
    label: 'GDPR Compliant',
    detail: 'Your data is handled in accordance with EU privacy law.',
  },
  {
    icon: CreditCard,
    label: 'No Credit Card',
    detail: 'Sign up and use SignVault completely free — no card needed.',
  },
]

// ─── Animated Counter ─────────────────────────────────────────────────────────
// Counts from 0 to the target number when it comes into view
function AnimatedCounter({ target }: { target: number }) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: '-100px' })
  const motionValue = useMotionValue(0)
  const [displayValue, setDisplayValue] = useState(0)

  useEffect(() => {
    if (!inView) return

    // Animate the motion value from 0 to target over 2 seconds
    const controls = animate(motionValue, target, {
      duration: 2,
      ease: 'easeOut',
      onUpdate: (latest) => {
        // Update display as integer
        setDisplayValue(Math.round(latest))
      },
    })

    return controls.stop
  }, [inView, motionValue, target])

  // Format with comma separator (e.g., 12847 → "12,847")
  const formatted = displayValue.toLocaleString('en-US')

  return <span ref={ref}>{formatted}</span>
}

export function TrustSection() {
  return (
    <section className="py-24 px-6 bg-sv-bg dark:bg-sv-dark-bg">
      <div className="max-w-5xl mx-auto">

        {/* ── Animated Counter ──────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          {/* Big number */}
          <div className="text-5xl md:text-6xl font-extrabold text-sv-primary dark:text-sv-dark-primary mb-3">
            <AnimatedCounter target={12847} />
          </div>
          <p className="text-lg text-sv-secondary dark:text-sv-dark-secondary font-medium">
            people are already using SignVault for free
          </p>
        </motion.div>

        {/* ── Trust Badges Grid ─────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {trustBadges.map((badge, i) => (
            <motion.div
              key={badge.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className="flex flex-col items-center text-center p-6 rounded-[12px]
                         bg-sv-surface dark:bg-sv-dark-surface
                         border border-sv-border dark:border-sv-dark-border
                         shadow-sm"
            >
              {/* Icon with green check overlay */}
              <div className="relative w-12 h-12 mb-4">
                <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-500/15
                                flex items-center justify-center">
                  <badge.icon
                    className="w-6 h-6 text-emerald-600 dark:text-emerald-400"
                    strokeWidth={1.75}
                  />
                </div>
                {/* Checkmark badge */}
                <CheckCircle2
                  className="absolute -bottom-1 -right-1 w-5 h-5 text-emerald-500 dark:text-emerald-400 bg-sv-surface dark:bg-sv-dark-surface rounded-full"
                  strokeWidth={2}
                />
              </div>

              {/* Label */}
              <h3 className="text-sm font-semibold text-sv-text dark:text-sv-dark-text mb-1">
                {badge.label}
              </h3>

              {/* Detail */}
              <p className="text-xs text-sv-secondary dark:text-sv-dark-secondary leading-relaxed">
                {badge.detail}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
