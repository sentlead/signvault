'use client'

/**
 * QuickActions.tsx — Quick Action Cards (Client Component)
 *
 * Shows two large cards side by side (stacked on mobile):
 *   1. "Upload & Sign" — for signing a document yourself
 *   2. "Send for Signature" — for sending a document to someone else
 *
 * Each card has a hover lift animation using Framer Motion.
 */

import Link from 'next/link'
import { motion } from 'framer-motion'
import { FileText, Send } from 'lucide-react'

export function QuickActions() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

      {/* ── Card 1: Upload & Sign ─────────────────────────────────────────── */}
      <motion.div
        whileHover={{ y: -4, boxShadow: '0 12px 32px rgba(99,102,241,0.15)' }}
        whileTap={{ scale: 0.98 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        className="bg-sv-surface dark:bg-sv-dark-surface
                   border border-sv-border dark:border-sv-dark-border
                   rounded-[var(--radius-card)] p-6"
      >
        {/* Icon */}
        <div className="w-12 h-12 rounded-[10px] bg-sv-primary/10 dark:bg-sv-dark-primary/20
                        flex items-center justify-center mb-4">
          <FileText className="w-6 h-6 text-sv-primary dark:text-sv-dark-primary" />
        </div>

        <h3 className="text-base font-semibold text-sv-text dark:text-sv-dark-text mb-1">
          Upload & Sign
        </h3>
        <p className="text-sm text-sv-secondary dark:text-sv-dark-secondary mb-4">
          Sign a document yourself. Upload a PDF and add your signature.
        </p>

        {/* Primary CTA button */}
        <Link
          href="/documents/new"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-[var(--radius-button)]
                     bg-sv-primary hover:bg-sv-primary-hover
                     dark:bg-sv-dark-primary dark:hover:bg-sv-dark-primary-hover
                     text-white text-sm font-semibold shadow-sm
                     transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]
                     focus-visible:ring-2 focus-visible:ring-sv-primary"
        >
          <FileText className="w-4 h-4" />
          Upload Document
        </Link>
      </motion.div>

      {/* ── Card 2: Send for Signature ─────────────────────────────────────── */}
      <motion.div
        whileHover={{ y: -4, boxShadow: '0 12px 32px rgba(99,102,241,0.08)' }}
        whileTap={{ scale: 0.98 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        className="bg-sv-surface dark:bg-sv-dark-surface
                   border border-sv-border dark:border-sv-dark-border
                   rounded-[var(--radius-card)] p-6"
      >
        {/* Icon */}
        <div className="w-12 h-12 rounded-[10px] bg-indigo-50 dark:bg-indigo-900/20
                        flex items-center justify-center mb-4">
          <Send className="w-6 h-6 text-sv-primary dark:text-sv-dark-primary" />
        </div>

        <h3 className="text-base font-semibold text-sv-text dark:text-sv-dark-text mb-1">
          Send for Signature
        </h3>
        <p className="text-sm text-sv-secondary dark:text-sv-dark-secondary mb-4">
          Get others to sign. Upload a PDF and send it to recipients.
        </p>

        {/* Ghost (outline) CTA button */}
        <Link
          href="/documents/new?mode=send"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-[var(--radius-button)]
                     border border-sv-primary dark:border-sv-dark-primary
                     text-sv-primary dark:text-sv-dark-primary
                     text-sm font-semibold
                     hover:bg-sv-primary/5 dark:hover:bg-sv-dark-primary/10
                     transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]
                     focus-visible:ring-2 focus-visible:ring-sv-primary"
        >
          <Send className="w-4 h-4" />
          Send Document
        </Link>
      </motion.div>
    </div>
  )
}
