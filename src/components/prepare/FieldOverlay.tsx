'use client'

/**
 * FieldOverlay.tsx
 *
 * Renders a single signature field on top of the PDF as a draggable,
 * resizable box using react-rnd.
 *
 * In "Send for Signatures" mode, fields are color-coded by signer.
 * If a field has a signerId, we look up the signer's color from the
 * signers array (passed in as a prop). Otherwise we fall back to the
 * default per-field-type color.
 *
 * Props:
 *   field       — The field data (type, position in pixels, size in pixels)
 *   containerW  — Width of the PDF page container in pixels
 *   containerH  — Height of the PDF page container in pixels
 *   signers     — All signers (so we can look up colors by signerId)
 *   onUpdate    — Called when the field is dragged or resized (new px values)
 *   onDelete    — Called when the user clicks the × button
 */

import { Rnd } from 'react-rnd'
import { X, PenLine, Type, Calendar, AlignLeft } from 'lucide-react'
import type { FieldData } from './PrepareEditor'
import type { SignerData } from './SignerPanel'
import { getSignerColor } from './SignerPanel'

interface FieldOverlayProps {
  field: FieldData
  containerW: number
  containerH: number
  /** All signers — used to look up per-signer color when signerId is set */
  signers?: SignerData[]
  onUpdate: (id: string, updates: Partial<FieldData>) => void
  onDelete: (id: string) => void
}

// ── Default visual config per field type (used when no signer is assigned) ──

const FIELD_CONFIG = {
  signature: {
    label: 'Signature',
    Icon: PenLine,
    border: 'border-indigo-500 dark:border-indigo-400',
    bg: 'bg-indigo-50 dark:bg-indigo-900/30',
    text: 'text-indigo-700 dark:text-indigo-300',
    handle: 'bg-indigo-500',
  },
  initials: {
    label: 'Initials',
    Icon: Type,
    border: 'border-violet-500 dark:border-violet-400',
    bg: 'bg-violet-50 dark:bg-violet-900/30',
    text: 'text-violet-700 dark:text-violet-300',
    handle: 'bg-violet-500',
  },
  date: {
    label: 'Date',
    Icon: Calendar,
    border: 'border-amber-500 dark:border-amber-400',
    bg: 'bg-amber-50 dark:bg-amber-900/30',
    text: 'text-amber-700 dark:text-amber-300',
    handle: 'bg-amber-500',
  },
  text: {
    label: 'Text',
    Icon: AlignLeft,
    border: 'border-slate-500 dark:border-slate-400',
    bg: 'bg-slate-50 dark:bg-slate-900/30',
    text: 'text-slate-700 dark:text-slate-300',
    handle: 'bg-slate-500',
  },
} as const

// ── Signer-color border/bg overrides ─────────────────────────────────────────
// Maps signer color name → Tailwind classes for the overlay

const SIGNER_COLOR_CLASSES: Record<string, { border: string; bg: string; text: string }> = {
  indigo:  { border: 'border-indigo-500',  bg: 'bg-indigo-50 dark:bg-indigo-900/30',  text: 'text-indigo-700 dark:text-indigo-300' },
  rose:    { border: 'border-rose-500',    bg: 'bg-rose-50 dark:bg-rose-900/30',      text: 'text-rose-700 dark:text-rose-300' },
  emerald: { border: 'border-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/30',text: 'text-emerald-700 dark:text-emerald-300' },
  amber:   { border: 'border-amber-500',   bg: 'bg-amber-50 dark:bg-amber-900/30',    text: 'text-amber-700 dark:text-amber-300' },
  violet:  { border: 'border-violet-500',  bg: 'bg-violet-50 dark:bg-violet-900/30',  text: 'text-violet-700 dark:text-violet-300' },
}

// Minimum field dimensions in pixels — just enough to keep fields grabbable
const MIN_WIDTH = 8
const MIN_HEIGHT = 8

export function FieldOverlay({
  field,
  containerW,
  containerH,
  signers = [],
  onUpdate,
  onDelete,
}: FieldOverlayProps) {
  const config = FIELD_CONFIG[field.type]
  const Icon = config.Icon

  // If this field has a signer assigned, use that signer's color
  let borderClass: string = config.border
  let bgClass: string = config.bg
  let textClass: string = config.text

  if (field.signerId) {
    const signerIndex = signers.findIndex((s) => s.id === field.signerId)
    if (signerIndex >= 0) {
      const colorConfig = getSignerColor(signerIndex)
      const classes = SIGNER_COLOR_CLASSES[colorConfig.name]
      if (classes) {
        borderClass = classes.border
        bgClass = classes.bg
        textClass = classes.text
      }
    }
  }

  // Convert percentage-based position to pixel values for react-rnd
  const pxX = (field.x / 100) * containerW
  const pxY = (field.y / 100) * containerH
  const pxW = (field.width / 100) * containerW
  const pxH = (field.height / 100) * containerH

  // Find the signer's name for the label (in send mode)
  const signerName = field.signerId
    ? signers.find((s) => s.id === field.signerId)?.name
    : null

  return (
    <Rnd
      // Current position and size in pixels
      position={{ x: pxX, y: pxY }}
      size={{ width: pxW, height: pxH }}
      // Keep the field inside the PDF page boundaries
      bounds="parent"
      minWidth={MIN_WIDTH}
      minHeight={MIN_HEIGHT}
      // When dragging ends, convert back to percentages and update state
      onDragStop={(_e, d) => {
        onUpdate(field.id, {
          x: (d.x / containerW) * 100,
          y: (d.y / containerH) * 100,
        })
      }}
      // When resizing ends, convert back to percentages and update state
      onResizeStop={(_e, _dir, ref, _delta, position) => {
        onUpdate(field.id, {
          x: (position.x / containerW) * 100,
          y: (position.y / containerH) * 100,
          width: (ref.offsetWidth / containerW) * 100,
          height: (ref.offsetHeight / containerH) * 100,
        })
      }}
      // Tailwind classes on the outer wrapper
      className={`
        group border-2 rounded cursor-move select-none
        ${borderClass} ${bgClass}
        transition-shadow hover:shadow-lg
      `}
      // Stop click events from bubbling to the PDF container
      // (otherwise clicking on a field would place a new field)
      enableUserSelectHack={false}
    >
      {/* Inner wrapper — fills the Rnd box */}
      <div className="relative w-full h-full flex items-center justify-center px-2">
        {/* Field label + icon */}
        <div className={`flex items-center gap-1 ${textClass} text-xs font-medium pointer-events-none`}>
          <Icon className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="truncate">
            {config.label}
            {signerName && (
              <span className="ml-1 opacity-70">({signerName})</span>
            )}
          </span>
        </div>

        {/* Delete button — uses CSS group-hover so it stays visible as the
            cursor moves toward it (no JS hover state that can flicker out) */}
        <button
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation()
            onDelete(field.id)
          }}
          className="
            absolute -top-2.5 -right-2.5
            w-5 h-5 rounded-full
            bg-red-500 hover:bg-red-600
            text-white
            flex items-center justify-center
            shadow-sm transition-colors
            z-10
            opacity-0 group-hover:opacity-100
          "
          aria-label={`Delete ${config.label} field`}
        >
          <X className="w-3 h-3" />
        </button>
      </div>
    </Rnd>
  )
}
