'use client'

/**
 * HeroSection.tsx
 *
 * The main headline area of the landing page — the first thing visitors see.
 * Contains:
 *   - A large headline ("Sign documents for free. No tricks.")
 *   - A supporting subheadline
 *   - Two call-to-action buttons: primary ("Get Started — Free") and ghost ("See How It Works")
 *   - The AnimatedBackground behind everything
 *
 * All elements animate in using Framer Motion: they fade in and slide up
 * in a staggered sequence (headline first, then subheadline, then buttons).
 *
 * 'use client' is required for Framer Motion animations.
 */

import { motion } from 'framer-motion'
import { ArrowRight, Play } from 'lucide-react'
import { AnimatedBackground } from './AnimatedBackground'

// Reusable animation variant — slides up from 24px below and fades in
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
}

export function HeroSection() {
  return (
    // relative + overflow-hidden so the blobs don't escape the hero bounds
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden
                        bg-sv-bg dark:bg-sv-dark-bg pt-16">

      {/* Animated background blobs (positioned absolutely behind content) */}
      <AnimatedBackground />

      {/* Hero content — centered, max width constrained, layered above background */}
      <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">

        {/* ── Pill badge ────────────────────────────────────────────────── */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          transition={{ duration: 0.5, delay: 0.1 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full
                     bg-sv-primary/10 dark:bg-sv-dark-primary/15
                     border border-sv-primary/20 dark:border-sv-dark-primary/30
                     text-sv-primary dark:text-sv-dark-primary
                     text-sm font-medium mb-6"
        >
          {/* Small dot indicator */}
          <span className="w-1.5 h-1.5 rounded-full bg-sv-primary dark:bg-sv-dark-primary" />
          100% Free — Always
        </motion.div>

        {/* ── Main Headline ─────────────────────────────────────────────── */}
        <motion.h1
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight
                     text-sv-text dark:text-sv-dark-text leading-tight mb-6"
        >
          Sign documents for free.{' '}
          {/* Highlight the key differentiator in primary color */}
          <span className="text-sv-primary dark:text-sv-dark-primary">
            No tricks.
          </span>
        </motion.h1>

        {/* ── Subheadline ───────────────────────────────────────────────── */}
        <motion.p
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          transition={{ duration: 0.6, delay: 0.35 }}
          className="text-lg md:text-xl text-sv-secondary dark:text-sv-dark-secondary
                     max-w-2xl mx-auto leading-relaxed mb-10"
        >
          Upload, sign, and send documents in minutes. Legally binding e-signatures
          with bank-level security. No subscription required — ever.
        </motion.p>

        {/* ── CTA Buttons ───────────────────────────────────────────────── */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          transition={{ duration: 0.6, delay: 0.5 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          {/* Primary button — solid indigo */}
          <button
            className="group flex items-center gap-2 px-7 py-3.5 rounded-[8px]
                       bg-sv-primary hover:bg-sv-primary-hover
                       dark:bg-sv-dark-primary dark:hover:bg-sv-dark-primary-hover
                       text-white font-semibold text-base
                       shadow-lg shadow-sv-primary/25 dark:shadow-sv-dark-primary/20
                       transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
            aria-label="Get started for free"
          >
            Get Started — Free
            <ArrowRight
              className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5"
            />
          </button>

          {/* Ghost button — transparent with border */}
          <button
            className="group flex items-center gap-2 px-7 py-3.5 rounded-[8px]
                       bg-transparent border border-sv-border dark:border-sv-dark-border
                       text-sv-text dark:text-sv-dark-text font-semibold text-base
                       hover:border-sv-primary dark:hover:border-sv-dark-primary
                       hover:text-sv-primary dark:hover:text-sv-dark-primary
                       transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
            aria-label="See how SignVault works"
          >
            <Play className="w-4 h-4 transition-transform duration-200 group-hover:scale-110" />
            See How It Works
          </button>
        </motion.div>

        {/* ── Social proof hint ─────────────────────────────────────────── */}
        <motion.p
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          transition={{ duration: 0.6, delay: 0.65 }}
          className="mt-8 text-sm text-sv-secondary dark:text-sv-dark-secondary"
        >
          Trusted by <strong className="text-sv-text dark:text-sv-dark-text font-semibold">12,847+</strong> users &mdash; no credit card required
        </motion.p>
      </div>
    </section>
  )
}
