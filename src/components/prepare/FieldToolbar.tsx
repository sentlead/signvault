'use client'

/**
 * FieldToolbar.tsx — Left sidebar for the prepare editor
 *
 * Contains:
 *   - Mode toggle: "Sign Myself" vs "Send for Signatures"
 *   - Signer panel (visible in "Send for Signatures" mode)
 *   - Signer selector (pick which signer you're placing fields for)
 *   - Field type selector buttons (Signature, Initials, Date, Text)
 *   - Page navigation controls (← / →)
 *   - Zoom controls (- / +)
 *   - "Save & Continue" or "Send for Signatures" button
 */

import { PenLine, Type, Calendar, AlignLeft, ChevronLeft, ChevronRight, Minus, Plus, Save, Loader2, Send, UserCheck, BookmarkPlus } from 'lucide-react'
import type { FieldType, PrepareMode } from './PrepareEditor'
import type { SignerData } from './SignerPanel'
import { SignerPanel, getSignerColor } from './SignerPanel'

interface FieldToolbarProps {
  // Mode
  mode: PrepareMode
  onModeChange: (mode: PrepareMode) => void
  // Signers (for send mode)
  signers: SignerData[]
  selectedSignerId: string | null
  onSelectSigner: (id: string) => void
  onAddSigner: (signer: SignerData) => void
  onRemoveSigner: (id: string) => void
  /** Color of the currently selected signer, for visual feedback */
  selectedSignerColor: { dot: string; border: string } | null
  // Field types
  selectedType: FieldType
  onSelectType: (type: FieldType) => void
  // Pagination
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  // Zoom
  zoom: number
  onZoomChange: (zoom: number) => void
  // Actions
  onSave: () => void
  isSaving: boolean
  /** Opens the Save as Template modal. Only shown when fields have been placed. */
  onSaveAsTemplate?: () => void
  /** Total number of fields placed (used to show/hide the template button) */
  fieldCount: number
}

// Config for each field type button
const FIELD_TYPES: {
  type: FieldType
  label: string
  description: string
  Icon: React.ComponentType<{ className?: string }>
  colors: string
  ring: string
}[] = [
  {
    type: 'signature',
    label: 'Signature',
    description: 'Full signature',
    Icon: PenLine,
    colors: 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30',
    ring: 'ring-indigo-500',
  },
  {
    type: 'initials',
    label: 'Initials',
    description: 'Short initials',
    Icon: Type,
    colors: 'text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/30',
    ring: 'ring-violet-500',
  },
  {
    type: 'date',
    label: 'Date',
    description: 'Signing date',
    Icon: Calendar,
    colors: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30',
    ring: 'ring-amber-500',
  },
  {
    type: 'text',
    label: 'Text',
    description: 'Free text input',
    Icon: AlignLeft,
    colors: 'text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/30',
    ring: 'ring-slate-500',
  },
]

// Zoom step size and limits
const ZOOM_STEP = 25
const ZOOM_MIN = 50
const ZOOM_MAX = 200

export function FieldToolbar({
  mode,
  onModeChange,
  signers,
  selectedSignerId,
  onSelectSigner,
  onAddSigner,
  onRemoveSigner,
  selectedSignerColor,
  selectedType,
  onSelectType,
  currentPage,
  totalPages,
  onPageChange,
  zoom,
  onZoomChange,
  onSave,
  isSaving,
  onSaveAsTemplate,
  fieldCount,
}: FieldToolbarProps) {
  return (
    <div className="
      w-64 flex-shrink-0 flex flex-col gap-6
      bg-sv-surface dark:bg-sv-dark-surface
      border-r border-sv-border dark:border-sv-dark-border
      p-4 overflow-y-auto
    ">

      {/* ── Section: Mode Toggle ─────────────────────────────────────────── */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider
                       text-sv-secondary dark:text-sv-dark-secondary mb-3">
          Signing Mode
        </h3>

        <div className="flex rounded-[var(--radius-button)] overflow-hidden border border-sv-border dark:border-sv-dark-border">
          {/* "Sign Myself" button */}
          <button
            onClick={() => onModeChange('self')}
            className={`
              flex-1 py-2 text-xs font-medium transition-colors
              ${mode === 'self'
                ? 'bg-sv-primary dark:bg-sv-dark-primary text-white'
                : 'text-sv-secondary dark:text-sv-dark-secondary hover:bg-sv-bg dark:hover:bg-sv-dark-bg'
              }
            `}
          >
            Sign Myself
          </button>
          {/* "Send for Signatures" button */}
          <button
            onClick={() => onModeChange('send')}
            className={`
              flex-1 py-2 text-xs font-medium transition-colors border-l border-sv-border dark:border-sv-dark-border
              ${mode === 'send'
                ? 'bg-sv-primary dark:bg-sv-dark-primary text-white'
                : 'text-sv-secondary dark:text-sv-dark-secondary hover:bg-sv-bg dark:hover:bg-sv-dark-bg'
              }
            `}
          >
            Send Out
          </button>
        </div>
      </div>

      {/* ── Section: Signer Panel (send mode only) ───────────────────────── */}
      {mode === 'send' && (
        <>
          <SignerPanel
            signers={signers}
            onAddSigner={onAddSigner}
            onRemoveSigner={onRemoveSigner}
          />

          {/* Signer selector — pick which signer you're placing fields for */}
          {signers.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider
                             text-sv-secondary dark:text-sv-dark-secondary mb-3">
                Placing fields for
              </h3>

              <div className="space-y-1.5">
                {signers.map((signer, index) => {
                  const color = getSignerColor(index)
                  const isSelected = signer.id === selectedSignerId
                  return (
                    <button
                      key={signer.id}
                      onClick={() => onSelectSigner(signer.id)}
                      className={`
                        w-full flex items-center gap-2 px-3 py-2
                        rounded-[var(--radius-button)]
                        border-2 text-left transition-all
                        ${isSelected
                          ? `${color.border} bg-sv-bg dark:bg-sv-dark-bg`
                          : 'border-sv-border dark:border-sv-dark-border hover:border-sv-secondary dark:hover:border-sv-dark-secondary'
                        }
                      `}
                    >
                      <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${color.dot}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-sv-text dark:text-sv-dark-text truncate">
                          {signer.name}
                        </p>
                      </div>
                      {isSelected && (
                        <UserCheck className="w-3.5 h-3.5 text-sv-secondary dark:text-sv-dark-secondary flex-shrink-0" />
                      )}
                    </button>
                  )
                })}
              </div>

              {/* Color indicator for the active signer */}
              {selectedSignerColor && (
                <p className="mt-2 text-xs text-sv-secondary dark:text-sv-dark-secondary leading-relaxed">
                  Fields placed now will be outlined in the signer&apos;s color.
                </p>
              )}
            </div>
          )}
        </>
      )}

      {/* ── Section: Field Types ─────────────────────────────────────────── */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider
                       text-sv-secondary dark:text-sv-dark-secondary mb-3">
          Field Types
        </h3>
        {mode === 'send' && !selectedSignerId && signers.length > 0 ? (
          <p className="text-xs text-sv-secondary dark:text-sv-dark-secondary leading-relaxed">
            Select a signer above before placing fields.
          </p>
        ) : (
          <>
            <p className="text-xs text-sv-secondary dark:text-sv-dark-secondary mb-3 leading-relaxed">
              Select a type, then click on the PDF to place a field.
            </p>

            <div className="space-y-2">
              {FIELD_TYPES.map(({ type, label, description, Icon, colors, ring }) => {
                const isSelected = selectedType === type
                return (
                  <button
                    key={type}
                    onClick={() => onSelectType(type)}
                    className={`
                      w-full flex items-center gap-3 p-3
                      rounded-[var(--radius-button)]
                      border-2 text-left
                      transition-all duration-150
                      ${isSelected
                        ? `border-current ring-2 ${ring} ring-offset-1 ring-offset-sv-surface dark:ring-offset-sv-dark-surface ${colors}`
                        : `border-sv-border dark:border-sv-dark-border
                           text-sv-text dark:text-sv-dark-text
                           hover:border-sv-primary dark:hover:border-sv-dark-primary
                           hover:bg-sv-bg dark:hover:bg-sv-dark-bg`
                      }
                    `}
                    aria-pressed={isSelected}
                  >
                    {/* Icon */}
                    <div className={`w-8 h-8 rounded-[6px] flex items-center justify-center flex-shrink-0 ${isSelected ? '' : 'bg-sv-bg dark:bg-sv-dark-bg'}`}>
                      <Icon className={`w-4 h-4 ${isSelected ? '' : 'text-sv-secondary dark:text-sv-dark-secondary'}`} />
                    </div>
                    {/* Text */}
                    <div>
                      <p className="text-sm font-medium leading-none mb-0.5">{label}</p>
                      <p className={`text-xs ${isSelected ? 'opacity-75' : 'text-sv-secondary dark:text-sv-dark-secondary'}`}>
                        {description}
                      </p>
                    </div>
                  </button>
                )
              })}
            </div>
          </>
        )}
      </div>

      {/* ── Section: Page Navigation ─────────────────────────────────────── */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider
                       text-sv-secondary dark:text-sv-dark-secondary mb-3">
          Page
        </h3>

        <div className="flex items-center gap-2">
          {/* Previous page */}
          <button
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage <= 1}
            className="
              w-8 h-8 rounded-[var(--radius-button)] flex items-center justify-center
              border border-sv-border dark:border-sv-dark-border
              text-sv-text dark:text-sv-dark-text
              hover:bg-sv-bg dark:hover:bg-sv-dark-bg
              disabled:opacity-40 disabled:cursor-not-allowed
              transition-colors
            "
            aria-label="Previous page"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Page indicator */}
          <span className="flex-1 text-center text-sm text-sv-text dark:text-sv-dark-text">
            {totalPages > 0 ? `${currentPage} / ${totalPages}` : '— / —'}
          </span>

          {/* Next page */}
          <button
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage >= totalPages || totalPages === 0}
            className="
              w-8 h-8 rounded-[var(--radius-button)] flex items-center justify-center
              border border-sv-border dark:border-sv-dark-border
              text-sv-text dark:text-sv-dark-text
              hover:bg-sv-bg dark:hover:bg-sv-dark-bg
              disabled:opacity-40 disabled:cursor-not-allowed
              transition-colors
            "
            aria-label="Next page"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Section: Zoom ────────────────────────────────────────────────── */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider
                       text-sv-secondary dark:text-sv-dark-secondary mb-3">
          Zoom
        </h3>

        <div className="flex items-center gap-2">
          {/* Zoom out */}
          <button
            onClick={() => onZoomChange(Math.max(ZOOM_MIN, zoom - ZOOM_STEP))}
            disabled={zoom <= ZOOM_MIN}
            className="
              w-8 h-8 rounded-[var(--radius-button)] flex items-center justify-center
              border border-sv-border dark:border-sv-dark-border
              text-sv-text dark:text-sv-dark-text
              hover:bg-sv-bg dark:hover:bg-sv-dark-bg
              disabled:opacity-40 disabled:cursor-not-allowed
              transition-colors
            "
            aria-label="Zoom out"
          >
            <Minus className="w-4 h-4" />
          </button>

          {/* Zoom level display */}
          <span className="flex-1 text-center text-sm text-sv-text dark:text-sv-dark-text">
            {zoom}%
          </span>

          {/* Zoom in */}
          <button
            onClick={() => onZoomChange(Math.min(ZOOM_MAX, zoom + ZOOM_STEP))}
            disabled={zoom >= ZOOM_MAX}
            className="
              w-8 h-8 rounded-[var(--radius-button)] flex items-center justify-center
              border border-sv-border dark:border-sv-dark-border
              text-sv-text dark:text-sv-dark-text
              hover:bg-sv-bg dark:hover:bg-sv-dark-bg
              disabled:opacity-40 disabled:cursor-not-allowed
              transition-colors
            "
            aria-label="Zoom in"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Spacer ───────────────────────────────────────────────────────── */}
      <div className="flex-1" />

      {/* ── Save as Template (secondary action, only when fields are placed) ── */}
      {onSaveAsTemplate && fieldCount > 0 && (
        <button
          onClick={onSaveAsTemplate}
          className="
            w-full py-2.5 px-4 rounded-[var(--radius-button)]
            border border-sv-border dark:border-sv-dark-border
            text-sv-secondary dark:text-sv-dark-secondary
            text-sm font-medium
            flex items-center justify-center gap-2
            hover:border-sv-primary dark:hover:border-sv-dark-primary
            hover:text-sv-primary dark:hover:text-sv-dark-primary
            transition-colors duration-150
          "
        >
          <BookmarkPlus className="w-4 h-4" />
          Save as Template
        </button>
      )}

      {/* ── Primary action button ─────────────────────────────────────────── */}
      <button
        onClick={onSave}
        disabled={isSaving}
        className="
          w-full py-3 px-4 rounded-[var(--radius-button)]
          bg-sv-primary hover:bg-sv-primary-hover
          dark:bg-sv-dark-primary dark:hover:bg-sv-dark-primary-hover
          text-white text-sm font-semibold
          flex items-center justify-center gap-2
          shadow-sm transition-colors duration-200
          disabled:opacity-60 disabled:cursor-not-allowed
        "
      >
        {isSaving ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            {mode === 'send' ? 'Sending…' : 'Saving…'}
          </>
        ) : mode === 'send' ? (
          <>
            <Send className="w-4 h-4" />
            Send for Signatures
          </>
        ) : (
          <>
            <Save className="w-4 h-4" />
            Save &amp; Continue
          </>
        )}
      </button>
    </div>
  )
}
