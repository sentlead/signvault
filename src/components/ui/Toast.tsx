'use client'

/**
 * Toast.tsx — Self-contained toast notification system
 *
 * Two exports:
 *   1. <ToastContainer /> — renders the stack of active toasts.
 *      Mount this once, inside providers.tsx. It listens for the custom
 *      "signvault:toast" event and manages the toast queue.
 *
 *   2. Individual <ToastItem /> — one notification pill. Not exported
 *      publicly — only used internally by ToastContainer.
 *
 * Each toast:
 *   - Slides in from the right with a spring animation (Framer Motion)
 *   - Has a coloured left border, icon, and message
 *   - Shows a progress bar at the bottom that drains over 4 seconds
 *   - Dismisses automatically after 4 seconds
 *   - Has an × close button for manual dismissal
 *
 * Variants: success (green), error (red), warning (amber), info (indigo)
 */

import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
  X,
} from 'lucide-react'
import { TOAST_EVENT_NAME } from '@/lib/toast'
import type { ToastPayload, ToastVariant } from '@/lib/toast'

// ── How long each toast stays on screen (milliseconds) ───────────────────────
const DURATION_MS = 4000

// ── Visual config per variant ─────────────────────────────────────────────────

interface VariantConfig {
  /** Icon component to render */
  Icon: React.ComponentType<{ className?: string }>
  /** Tailwind classes for the container background */
  containerClasses: string
  /** Tailwind classes for the left accent bar */
  barClasses: string
  /** Tailwind classes for the icon */
  iconClasses: string
  /** Tailwind classes for the drain progress bar fill */
  progressClasses: string
}

const VARIANTS: Record<ToastVariant, VariantConfig> = {
  success: {
    Icon: CheckCircle2,
    containerClasses:
      'bg-white dark:bg-sv-dark-surface border border-emerald-200 dark:border-emerald-800/60',
    barClasses: 'bg-emerald-500',
    iconClasses: 'text-emerald-500',
    progressClasses: 'bg-emerald-500',
  },
  error: {
    Icon: XCircle,
    containerClasses:
      'bg-white dark:bg-sv-dark-surface border border-red-200 dark:border-red-800/60',
    barClasses: 'bg-red-500',
    iconClasses: 'text-red-500',
    progressClasses: 'bg-red-500',
  },
  warning: {
    Icon: AlertTriangle,
    containerClasses:
      'bg-white dark:bg-sv-dark-surface border border-amber-200 dark:border-amber-800/60',
    barClasses: 'bg-amber-500',
    iconClasses: 'text-amber-500',
    progressClasses: 'bg-amber-500',
  },
  info: {
    Icon: Info,
    containerClasses:
      'bg-white dark:bg-sv-dark-surface border border-indigo-200 dark:border-indigo-800/60',
    barClasses: 'bg-indigo-500',
    iconClasses: 'text-indigo-500',
    progressClasses: 'bg-indigo-500',
  },
}

// ── Single Toast Item ─────────────────────────────────────────────────────────

interface ToastItemProps {
  toast: ToastPayload
  onDismiss: (id: string) => void
}

function ToastItem({ toast, onDismiss }: ToastItemProps) {
  const cfg = VARIANTS[toast.variant]
  const { Icon } = cfg

  // Dismiss when the auto-timer fires
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), DURATION_MS)
    return () => clearTimeout(timer)
  }, [toast.id, onDismiss])

  return (
    <motion.div
      layout
      initial={{ x: '110%', opacity: 0 }}
      animate={{ x: 0,     opacity: 1 }}
      exit={{    x: '110%', opacity: 0 }}
      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
      className={`
        relative w-[340px] max-w-[calc(100vw-2rem)]
        rounded-[var(--radius-card)] shadow-lg overflow-hidden
        flex items-start gap-3 pr-3 pt-3 pb-0 pl-4
        ${cfg.containerClasses}
      `}
      role="alert"
      aria-live="assertive"
    >
      {/* Left accent bar */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${cfg.barClasses}`} />

      {/* Icon */}
      <Icon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${cfg.iconClasses}`} />

      {/* Message */}
      <p className="flex-1 text-sm font-medium text-sv-text dark:text-sv-dark-text py-0.5">
        {toast.message}
      </p>

      {/* Close button */}
      <button
        onClick={() => onDismiss(toast.id)}
        aria-label="Dismiss notification"
        className="
          w-6 h-6 mt-0.5 rounded flex items-center justify-center flex-shrink-0
          text-sv-secondary dark:text-sv-dark-secondary
          hover:text-sv-text dark:hover:text-sv-dark-text
          hover:bg-sv-border dark:hover:bg-sv-dark-border
          transition-colors focus-visible:ring-2 focus-visible:ring-sv-primary
        "
      >
        <X className="w-3.5 h-3.5" />
      </button>

      {/* Draining progress bar at the bottom of the pill */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-sv-border dark:bg-sv-dark-border">
        <motion.div
          className={`h-full ${cfg.progressClasses} origin-left`}
          initial={{ scaleX: 1 }}
          animate={{ scaleX: 0 }}
          transition={{ duration: DURATION_MS / 1000, ease: 'linear' }}
        />
      </div>

      {/* Bottom padding so progress bar doesn't overlap text */}
      <div className="absolute bottom-0 left-0 right-0 h-1.5" />
    </motion.div>
  )
}

// ── Toast Container (mount once in providers.tsx) ─────────────────────────────

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastPayload[]>([])

  // Remove a toast by ID
  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  // Listen for the custom window event fired by toast.ts
  useEffect(() => {
    function handleEvent(e: Event) {
      const payload = (e as CustomEvent<ToastPayload>).detail
      setToasts((prev) => {
        // Keep at most 5 toasts; drop the oldest if we exceed that
        const next = [...prev, payload]
        if (next.length > 5) next.shift()
        return next
      })
    }

    window.addEventListener(TOAST_EVENT_NAME, handleEvent)
    return () => window.removeEventListener(TOAST_EVENT_NAME, handleEvent)
  }, [])

  return (
    /*
     * Positioned fixed in the top-right corner, above everything (z-[9999]).
     * role="status" + aria-live="polite" so screen readers announce new toasts.
     */
    <div
      role="status"
      aria-live="polite"
      aria-atomic="false"
      className="
        fixed top-4 right-4 z-[9999]
        flex flex-col gap-2 items-end
        pointer-events-none
      "
    >
      <AnimatePresence mode="popLayout">
        {toasts.map((t) => (
          /* pointer-events-auto restores click events on each pill */
          <div key={t.id} className="pointer-events-auto">
            <ToastItem toast={t} onDismiss={dismiss} />
          </div>
        ))}
      </AnimatePresence>
    </div>
  )
}
