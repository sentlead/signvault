'use client'

/**
 * FieldValueOverlay.tsx
 *
 * Renders a single signature field on top of the PDF in the signing view.
 * Unlike FieldOverlay (in prepare), these fields are NOT draggable.
 *
 * States:
 *   - Unfilled: pulsing indigo border with "Click to sign" label
 *   - Filled (image):  shows the signature/initials PNG scaled to fit
 *   - Filled (text):   shows the date or typed text value
 *
 * Clicking an unfilled field fires onFieldClick so SigningEditor can
 * open the appropriate input (SignatureModal or inline text).
 */

import Image from 'next/image'
import { PenLine, Type, Calendar, AlignLeft } from 'lucide-react'

// The field types we can encounter during signing
type FieldType = 'signature' | 'initials' | 'date' | 'text'

interface FieldValueOverlayProps {
  fieldId: string
  type: FieldType
  /** Position and size as percentages of the page (0–100) */
  x: number
  y: number
  width: number
  height: number
  /** The filled value: base64 PNG (data URL) for signature/initials, text string for date/text */
  value: string | undefined
  /** Called when the user clicks an unfilled field */
  onFieldClick: (fieldId: string) => void
  /** Width of the PDF container div in pixels (used to convert % → px) */
  containerW: number
  /** Height of the PDF container div in pixels */
  containerH: number
}

// Visual config per field type for the unfilled state label
const FIELD_CONFIG: Record<FieldType, {
  label: string
  Icon: React.ComponentType<{ className?: string }>
  border: string
  bg: string
  text: string
}> = {
  signature: {
    label: 'Click to sign',
    Icon: PenLine,
    border: 'border-indigo-500 dark:border-indigo-400',
    bg: 'bg-indigo-50/80 dark:bg-indigo-900/40',
    text: 'text-indigo-700 dark:text-indigo-300',
  },
  initials: {
    label: 'Click to initial',
    Icon: Type,
    border: 'border-violet-500 dark:border-violet-400',
    bg: 'bg-violet-50/80 dark:bg-violet-900/40',
    text: 'text-violet-700 dark:text-violet-300',
  },
  date: {
    label: 'Auto-filled date',
    Icon: Calendar,
    border: 'border-amber-500 dark:border-amber-400',
    bg: 'bg-amber-50/80 dark:bg-amber-900/40',
    text: 'text-amber-700 dark:text-amber-300',
  },
  text: {
    label: 'Click to type',
    Icon: AlignLeft,
    border: 'border-slate-500 dark:border-slate-400',
    bg: 'bg-slate-50/80 dark:bg-slate-900/40',
    text: 'text-slate-700 dark:text-slate-300',
  },
}

export function FieldValueOverlay({
  fieldId,
  type,
  x,
  y,
  width,
  height,
  value,
  onFieldClick,
  containerW,
  containerH,
}: FieldValueOverlayProps) {
  // Convert percentage positions to absolute pixels for positioning
  const pxLeft   = (x / 100) * containerW
  const pxTop    = (y / 100) * containerH
  const pxWidth  = (width / 100) * containerW
  const pxHeight = (height / 100) * containerH

  const config = FIELD_CONFIG[type]
  const Icon = config.Icon
  const isFilled = value !== undefined && value !== ''

  // Determine whether the value is an image (base64 data URL) or plain text
  const isImage = isFilled && value!.startsWith('data:image')

  return (
    <div
      onClick={() => {
        // Allow clicking date fields (they auto-fill) and unfilled fields
        if (!isFilled) {
          onFieldClick(fieldId)
        }
      }}
      style={{
        position: 'absolute',
        left: pxLeft,
        top: pxTop,
        width: pxWidth,
        height: pxHeight,
      }}
      className={`
        rounded border-2 overflow-hidden select-none
        transition-all duration-200
        ${isFilled
          ? 'border-emerald-400 dark:border-emerald-500 cursor-default'
          : `${config.border} ${config.bg} cursor-pointer
             animate-pulse hover:animate-none hover:brightness-95`
        }
      `}
      title={isFilled ? 'Field filled' : config.label}
    >
      {isFilled ? (
        // ── Filled state ───────────────────────────────────────────────────
        isImage ? (
          // Signature / initials — show the drawn image
          <div className="w-full h-full flex items-center justify-center bg-white dark:bg-gray-900">
            <Image
              src={value!}
              alt="Signature"
              fill
              style={{ objectFit: 'contain', padding: '2px' }}
              unoptimized  // base64 data URLs cannot go through Next.js image optimization
            />
          </div>
        ) : (
          // Date / text — show the string value
          <div className="w-full h-full flex items-center px-2 bg-white/90 dark:bg-gray-900/90">
            <span className="text-xs font-medium text-sv-text dark:text-sv-dark-text truncate leading-none">
              {value}
            </span>
          </div>
        )
      ) : (
        // ── Unfilled state ─────────────────────────────────────────────────
        <div className={`w-full h-full flex items-center justify-center gap-1 ${config.text}`}>
          <Icon className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="text-xs font-medium truncate">{config.label}</span>
        </div>
      )}
    </div>
  )
}
