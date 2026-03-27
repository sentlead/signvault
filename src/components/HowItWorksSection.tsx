'use client'

/**
 * HowItWorksSection.tsx
 *
 * Explains the 3-step process for using SignVault.
 * Each step shows:
 *   - A numbered circle badge
 *   - An icon
 *   - A title and description
 *
 * Steps are connected with a dashed line (visible on desktop) to show flow.
 * Each step animates into view as the user scrolls down.
 *
 * 'use client' is required for Framer Motion.
 */

import { motion } from 'framer-motion'
import { Upload, PenLine, Download } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

interface Step {
  number: number
  icon: LucideIcon
  title: string
  description: string
}

const steps: Step[] = [
  {
    number: 1,
    icon: Upload,
    title: 'Upload your document',
    description:
      'Drag and drop a PDF or Word file onto SignVault. We\'ll prepare it for signing instantly — no conversion needed.',
  },
  {
    number: 2,
    icon: PenLine,
    title: 'Place & sign fields',
    description:
      'Click anywhere on the document to place your signature, initials, or date. Draw, type, or upload your signature image.',
  },
  {
    number: 3,
    icon: Download,
    title: 'Download or send',
    description:
      'Download your signed document as a PDF, or send it to others for their signature via a secure email link.',
  },
]

export function HowItWorksSection() {
  return (
    <section className="py-24 px-6 bg-sv-surface dark:bg-sv-dark-surface">
      <div className="max-w-5xl mx-auto">

        {/* ── Section Header ────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-sv-text dark:text-sv-dark-text mb-4">
            Sign in 3 simple steps
          </h2>
          <p className="text-sv-secondary dark:text-sv-dark-secondary text-lg max-w-xl mx-auto">
            No tutorials. No lengthy onboarding. Just upload, sign, done.
          </p>
        </motion.div>

        {/* ── Steps ─────────────────────────────────────────────────────── */}
        {/* Relative container so we can draw the connecting line behind steps */}
        <div className="relative flex flex-col md:flex-row items-start md:items-center gap-8 md:gap-0">

          {/* Connecting dashed line — only visible on desktop (md+) */}
          {/* It spans from the center of step 1 to the center of step 3 */}
          <div
            className="hidden md:block absolute top-[2.25rem] left-[calc(16.67%+1.5rem)] right-[calc(16.67%+1.5rem)] h-px
                       border-t-2 border-dashed border-sv-border dark:border-sv-dark-border"
            aria-hidden="true"
          />

          {steps.map((step, i) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.5, delay: i * 0.15 }}
              className="relative flex-1 flex flex-col items-center text-center px-4"
            >
              {/* Step badge + icon stacked */}
              <div className="relative mb-5">
                {/* Outer glow ring */}
                <div className="absolute inset-0 rounded-full bg-sv-primary/10 dark:bg-sv-dark-primary/15 scale-[1.4]" />

                {/* Icon circle — white background so it sits above the dashed line */}
                <div className="relative w-14 h-14 rounded-full
                                bg-sv-surface dark:bg-sv-dark-surface
                                border-2 border-sv-primary dark:border-sv-dark-primary
                                flex items-center justify-center
                                shadow-md shadow-sv-primary/20 dark:shadow-sv-dark-primary/20">
                  <step.icon
                    className="w-6 h-6 text-sv-primary dark:text-sv-dark-primary"
                    strokeWidth={1.75}
                  />
                </div>

                {/* Step number badge — top-right corner */}
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full
                                 bg-sv-primary dark:bg-sv-dark-primary
                                 text-white text-xs font-bold
                                 flex items-center justify-center">
                  {step.number}
                </span>
              </div>

              {/* Step title */}
              <h3 className="text-base font-semibold text-sv-text dark:text-sv-dark-text mb-2">
                {step.title}
              </h3>

              {/* Step description */}
              <p className="text-sm text-sv-secondary dark:text-sv-dark-secondary leading-relaxed max-w-[220px]">
                {step.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
