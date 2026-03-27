'use client'

/**
 * ProgressSidebar.tsx — Left sidebar for the signing page
 *
 * Shows:
 *   - How many fields are filled vs total ("X of Y completed")
 *   - A list of all fields with a checkmark when filled
 *   - "Finish & Download" button (enabled only when all fields are done)
 *   - A spinner while the PDF is being generated
 */

import { CheckCircle2, Circle, PenLine, Type, Calendar, AlignLeft, Loader2, Download } from 'lucide-react'
import type { SigningField } from './SigningEditor'

interface ProgressSidebarProps {
  fields: SigningField[]
  /** Map of fieldId → value (filled fields) */
  values: Record<string, string>
  onFinish: () => void
  isGenerating: boolean
}

// Icon and label for each field type — mirrors FieldOverlay visual config
const FIELD_DISPLAY = {
  signature: { label: 'Signature', Icon: PenLine, color: 'text-indigo-600 dark:text-indigo-400' },
  initials:  { label: 'Initials',  Icon: Type,    color: 'text-violet-600 dark:text-violet-400' },
  date:      { label: 'Date',      Icon: Calendar, color: 'text-amber-600 dark:text-amber-400' },
  text:      { label: 'Text',      Icon: AlignLeft, color: 'text-slate-600 dark:text-slate-400' },
} as const

export function ProgressSidebar({
  fields,
  values,
  onFinish,
  isGenerating,
}: ProgressSidebarProps) {
  const filledCount = fields.filter((f) => values[f.id] !== undefined).length
  const totalCount = fields.length
  const allFilled = filledCount === totalCount
  const pct = totalCount === 0 ? 0 : Math.round((filledCount / totalCount) * 100)

  return (
    <div className="
      w-64 flex-shrink-0 flex flex-col gap-4
      bg-sv-surface dark:bg-sv-dark-surface
      border-r border-sv-border dark:border-sv-dark-border
      p-4 overflow-y-auto
    ">

      {/* ── Progress header ───────────────────────────────────────────────── */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider
                       text-sv-secondary dark:text-sv-dark-secondary mb-2">
          Progress
        </h3>

        {/* Progress bar */}
        <div className="w-full h-2 rounded-full bg-sv-border dark:bg-sv-dark-border overflow-hidden mb-1">
          <div
            className="h-full rounded-full bg-sv-primary dark:bg-sv-dark-primary transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>

        {/* Count */}
        <p className="text-xs text-sv-secondary dark:text-sv-dark-secondary">
          <span className="font-semibold text-sv-text dark:text-sv-dark-text">{filledCount}</span>
          {' '}of{' '}
          <span className="font-semibold text-sv-text dark:text-sv-dark-text">{totalCount}</span>
          {' '}fields completed
        </p>
      </div>

      {/* ── Field list ───────────────────────────────────────────────────── */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider
                       text-sv-secondary dark:text-sv-dark-secondary mb-2">
          Fields
        </h3>

        <ul className="space-y-1.5">
          {fields.map((field, index) => {
            const isFilled = values[field.id] !== undefined
            const display = FIELD_DISPLAY[field.type as keyof typeof FIELD_DISPLAY] ?? FIELD_DISPLAY.text
            const Icon = display.Icon

            return (
              <li
                key={field.id}
                className="flex items-center gap-2 py-1.5 px-2 rounded-[var(--radius-button)]
                           text-sm transition-colors
                           bg-sv-bg dark:bg-sv-dark-bg"
              >
                {/* Filled / unfilled indicator */}
                {isFilled ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                ) : (
                  <Circle className="w-4 h-4 text-sv-border dark:text-sv-dark-border flex-shrink-0" />
                )}

                {/* Field type icon */}
                <Icon className={`w-3.5 h-3.5 flex-shrink-0 ${display.color}`} />

                {/* Label */}
                <span className={`truncate ${
                  isFilled
                    ? 'text-sv-text dark:text-sv-dark-text'
                    : 'text-sv-secondary dark:text-sv-dark-secondary'
                }`}>
                  {display.label} {index + 1}
                  {field.pageNumber > 1 && (
                    <span className="ml-1 text-xs opacity-60">p.{field.pageNumber}</span>
                  )}
                </span>
              </li>
            )
          })}
        </ul>
      </div>

      {/* ── Spacer ───────────────────────────────────────────────────────── */}
      <div className="flex-1" />

      {/* ── Finish button ────────────────────────────────────────────────── */}
      <div className="space-y-2">
        {!allFilled && (
          <p className="text-xs text-sv-secondary dark:text-sv-dark-secondary text-center leading-relaxed">
            Fill all {totalCount - filledCount} remaining field{totalCount - filledCount !== 1 ? 's' : ''} to finish
          </p>
        )}

        <button
          onClick={onFinish}
          disabled={!allFilled || isGenerating}
          className="
            w-full py-3 px-4 rounded-[var(--radius-button)]
            bg-emerald-600 hover:bg-emerald-700
            dark:bg-emerald-500 dark:hover:bg-emerald-600
            text-white text-sm font-semibold
            flex items-center justify-center gap-2
            shadow-sm transition-colors duration-200
            disabled:opacity-50 disabled:cursor-not-allowed
          "
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Generating PDF…
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              Finish &amp; Download
            </>
          )}
        </button>
      </div>
    </div>
  )
}
