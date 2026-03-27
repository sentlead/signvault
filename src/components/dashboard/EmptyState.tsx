'use client'

/**
 * EmptyState.tsx — Empty State for Document List (Client Component)
 *
 * Shown when the user has no documents yet.
 * Features a minimal SVG illustration, heading, subtext, and a CTA button.
 * Fades in with Framer Motion.
 */

import Link from 'next/link'
import { motion } from 'framer-motion'

export function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="flex flex-col items-center justify-center py-16 px-4 text-center"
    >
      {/* ── Minimal SVG illustration: document with a pen ─────────────────── */}
      <svg
        width="120"
        height="120"
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="mb-6"
        aria-hidden="true"
      >
        {/* Document body */}
        <rect
          x="20" y="10" width="64" height="80"
          rx="8"
          className="fill-sv-border dark:fill-sv-dark-border"
        />
        {/* Folded corner */}
        <path
          d="M68 10 L84 26 H68 V10Z"
          className="fill-sv-secondary/30 dark:fill-sv-dark-secondary/30"
        />
        {/* Lines on document */}
        <rect x="30" y="38" width="40" height="4" rx="2" fill="#9CA3AF" opacity="0.6" />
        <rect x="30" y="48" width="32" height="4" rx="2" fill="#9CA3AF" opacity="0.5" />
        <rect x="30" y="58" width="36" height="4" rx="2" fill="#9CA3AF" opacity="0.4" />
        {/* Pen body */}
        <rect
          x="66" y="72" width="8" height="30"
          rx="3"
          transform="rotate(-40 66 72)"
          className="fill-sv-primary dark:fill-sv-dark-primary"
          opacity="0.85"
        />
        {/* Pen tip */}
        <path
          d="M58 101 L62 91 L66 96 Z"
          className="fill-sv-primary dark:fill-sv-dark-primary"
          opacity="0.9"
        />
        {/* Pen shine */}
        <rect
          x="68" y="76" width="2" height="14"
          rx="1"
          transform="rotate(-40 68 76)"
          fill="white"
          opacity="0.3"
        />
      </svg>

      <h3 className="text-lg font-semibold text-sv-text dark:text-sv-dark-text mb-2">
        No documents yet
      </h3>
      <p className="text-sm text-sv-secondary dark:text-sv-dark-secondary mb-6 max-w-xs">
        Upload your first document to get started. It only takes a few seconds.
      </p>

      {/* CTA button */}
      <Link
        href="/documents/new"
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-[var(--radius-button)]
                   bg-sv-primary hover:bg-sv-primary-hover
                   dark:bg-sv-dark-primary dark:hover:bg-sv-dark-primary-hover
                   text-white text-sm font-semibold shadow-sm
                   transition-colors duration-200"
      >
        Upload Document
      </Link>
    </motion.div>
  )
}
