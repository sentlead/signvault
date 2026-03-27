'use client'

/**
 * AuditTrail.tsx — Timeline-style audit log display
 *
 * Renders a vertical timeline of audit events for a document.
 * Each entry shows:
 *   - A coloured icon matching the action type
 *   - A human-readable action label
 *   - The actor's email address
 *   - A relative timestamp ("2 hours ago", "just now", etc.)
 *
 * Entries animate in with a stagger effect using Framer Motion.
 * Supports light and dark mode.
 */

import { motion } from 'framer-motion'
import {
  FileUp,
  PenLine,
  Send,
  CheckCircle2,
  Bell,
  Eye,
  Activity,
} from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface AuditEntry {
  id: string
  action: string
  actorEmail: string
  timestamp: Date
  ipAddress?: string | null
}

interface AuditTrailProps {
  entries: AuditEntry[]
}

// ── Action → human-readable label ────────────────────────────────────────────

function formatAction(action: string): string {
  const labels: Record<string, string> = {
    document_created:  'Document uploaded',
    document_prepared: 'Signature fields placed',
    document_signed:   'Document signed',
    document_sent:     'Sent for signing',
    document_viewed:   'Document viewed',
    document_completed:'Document completed',
    reminder_sent:     'Reminder sent',
  }
  return labels[action] ?? action.replace(/_/g, ' ')
}

// ── Action → icon + colour ────────────────────────────────────────────────────

interface ActionStyle {
  Icon: React.ComponentType<{ className?: string }>
  dotClasses: string
  iconClasses: string
}

function getActionStyle(action: string): ActionStyle {
  switch (action) {
    case 'document_created':
      return {
        Icon: FileUp,
        dotClasses: 'bg-indigo-500 dark:bg-indigo-400',
        iconClasses: 'text-indigo-500 dark:text-indigo-400',
      }
    case 'document_signed':
    case 'document_completed':
      return {
        Icon: CheckCircle2,
        dotClasses: 'bg-emerald-500 dark:bg-emerald-400',
        iconClasses: 'text-emerald-500 dark:text-emerald-400',
      }
    case 'document_sent':
      return {
        Icon: Send,
        dotClasses: 'bg-blue-500 dark:bg-blue-400',
        iconClasses: 'text-blue-500 dark:text-blue-400',
      }
    case 'document_prepared':
      return {
        Icon: PenLine,
        dotClasses: 'bg-violet-500 dark:bg-violet-400',
        iconClasses: 'text-violet-500 dark:text-violet-400',
      }
    case 'reminder_sent':
      return {
        Icon: Bell,
        dotClasses: 'bg-amber-500 dark:bg-amber-400',
        iconClasses: 'text-amber-500 dark:text-amber-400',
      }
    case 'document_viewed':
      return {
        Icon: Eye,
        dotClasses: 'bg-slate-400 dark:bg-slate-500',
        iconClasses: 'text-slate-400 dark:text-slate-500',
      }
    default:
      return {
        Icon: Activity,
        dotClasses: 'bg-sv-primary dark:bg-sv-dark-primary',
        iconClasses: 'text-sv-primary dark:text-sv-dark-primary',
      }
  }
}

// ── Relative timestamp helper ─────────────────────────────────────────────────
// Returns strings like "just now", "5 minutes ago", "2 hours ago", "Mar 24"

function relativeTime(date: Date): string {
  const now   = Date.now()
  const then  = new Date(date).getTime()
  const diffMs = now - then
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHr  = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHr / 24)

  if (diffSec < 60)  return 'just now'
  if (diffMin < 60)  return `${diffMin} minute${diffMin !== 1 ? 's' : ''} ago`
  if (diffHr  < 24)  return `${diffHr} hour${diffHr !== 1 ? 's' : ''} ago`
  if (diffDay < 7)   return `${diffDay} day${diffDay !== 1 ? 's' : ''} ago`

  // Fall back to a short date like "Mar 24"
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day:   'numeric',
  }).format(new Date(date))
}

// ── Component ─────────────────────────────────────────────────────────────────

export function AuditTrail({ entries }: AuditTrailProps) {
  if (entries.length === 0) {
    return (
      <p className="text-sm text-sv-secondary dark:text-sv-dark-secondary">
        No activity recorded yet.
      </p>
    )
  }

  return (
    <ol className="relative space-y-0" aria-label="Document activity timeline">
      {entries.map((entry, index) => {
        const { Icon, dotClasses, iconClasses } = getActionStyle(entry.action)
        const isLast = index === entries.length - 1

        return (
          <motion.li
            key={entry.id}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.06, duration: 0.3, ease: 'easeOut' }}
            className="flex gap-4 relative"
          >
            {/* Vertical timeline line — hidden on the last item */}
            {!isLast && (
              <div
                className="
                  absolute left-[15px] top-8 bottom-0
                  w-px bg-sv-border dark:bg-sv-dark-border
                "
                aria-hidden="true"
              />
            )}

            {/* Dot + icon */}
            <div className="relative flex-shrink-0 mt-1">
              <div
                className={`
                  w-8 h-8 rounded-full flex items-center justify-center
                  bg-sv-bg dark:bg-sv-dark-bg
                  border-2 ${dotClasses.replace('bg-', 'border-')}
                  ring-2 ring-sv-bg dark:ring-sv-dark-bg
                `}
              >
                <Icon className={`w-3.5 h-3.5 ${iconClasses}`} />
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 pb-6 min-w-0">
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                {/* Action label */}
                <span className="text-sm font-semibold text-sv-text dark:text-sv-dark-text">
                  {formatAction(entry.action)}
                </span>
                {/* Relative timestamp */}
                <time
                  dateTime={new Date(entry.timestamp).toISOString()}
                  className="text-xs text-sv-secondary dark:text-sv-dark-secondary whitespace-nowrap"
                  title={new Intl.DateTimeFormat('en-US', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  }).format(new Date(entry.timestamp))}
                >
                  {relativeTime(entry.timestamp)}
                </time>
              </div>
              {/* Actor email */}
              <p className="text-xs text-sv-secondary dark:text-sv-dark-secondary mt-0.5">
                by {entry.actorEmail}
              </p>
            </div>
          </motion.li>
        )
      })}
    </ol>
  )
}
