'use client'

/**
 * FeaturesSection.tsx
 *
 * A grid of 4 feature cards explaining what SignVault does.
 * Each card has:
 *   - An icon inside a colored circle
 *   - A title
 *   - A short description
 *   - A subtle hover animation (card lifts and shadow grows)
 *
 * The cards animate into view when they enter the viewport using
 * Framer Motion's whileInView feature (so they animate even if user
 * scrolls past the hero first).
 *
 * 'use client' is required for Framer Motion.
 */

import { motion, type Easing } from 'framer-motion'
import { FileText, Send, Shield, Sparkles } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

// Type for a single feature item
interface Feature {
  icon: LucideIcon
  title: string
  description: string
  iconColor: string        // Tailwind classes for the icon color
  iconBgColor: string      // Tailwind classes for the icon background
}

const features: Feature[] = [
  {
    icon: FileText,
    title: 'Upload & Sign',
    description:
      'Drag and drop any PDF or Word document. Place your signature anywhere on the page in seconds.',
    iconColor: 'text-sv-primary dark:text-sv-dark-primary',
    iconBgColor: 'bg-sv-primary/10 dark:bg-sv-dark-primary/15',
  },
  {
    icon: Send,
    title: 'Send for Signature',
    description:
      'Need someone else to sign? Send a secure link via email. They sign right in their browser — no account needed.',
    iconColor: 'text-violet-500 dark:text-violet-400',
    iconBgColor: 'bg-violet-100 dark:bg-violet-500/15',
  },
  {
    icon: Shield,
    title: 'Secure & Legal',
    description:
      'Every signature is encrypted with AES-256 and legally binding under eIDAS and ESIGN Act regulations.',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    iconBgColor: 'bg-emerald-100 dark:bg-emerald-500/15',
  },
  {
    icon: Sparkles,
    title: 'Always Free',
    description:
      'No hidden fees, no paywalls, no "premium" gates. SignVault is free because we believe signing documents shouldn\'t cost money.',
    iconColor: 'text-amber-500 dark:text-amber-400',
    iconBgColor: 'bg-amber-100 dark:bg-amber-500/15',
  },
]

// Easing value typed correctly for Framer Motion
const EASE_OUT: Easing = 'easeOut'

export function FeaturesSection() {
  return (
    <section className="py-24 px-6 bg-sv-bg dark:bg-sv-dark-bg">
      <div className="max-w-6xl mx-auto">

        {/* ── Section Header ────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-sv-text dark:text-sv-dark-text mb-4">
            Everything you need to sign
          </h2>
          <p className="text-sv-secondary dark:text-sv-dark-secondary text-lg max-w-xl mx-auto">
            Powerful features, zero cost. SignVault has everything a professional
            needs to handle documents efficiently.
          </p>
        </motion.div>

        {/* ── Feature Cards Grid ────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.5, delay: i * 0.1, ease: EASE_OUT }}
              // Hover animation: card lifts slightly
              whileHover={{ y: -6, scale: 1.01 }}
              className="group relative p-6 rounded-[12px]
                         bg-sv-surface dark:bg-sv-dark-surface
                         border border-sv-border dark:border-sv-dark-border
                         shadow-sm hover:shadow-lg hover:shadow-sv-primary/10
                         dark:hover:shadow-sv-dark-primary/10
                         cursor-default"
            >
              {/* Icon container */}
              <div className={`w-12 h-12 rounded-[10px] flex items-center justify-center mb-4 ${feature.iconBgColor}`}>
                <feature.icon className={`w-6 h-6 ${feature.iconColor}`} strokeWidth={1.75} />
              </div>

              {/* Title */}
              <h3 className="text-base font-semibold text-sv-text dark:text-sv-dark-text mb-2">
                {feature.title}
              </h3>

              {/* Description */}
              <p className="text-sm text-sv-secondary dark:text-sv-dark-secondary leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
