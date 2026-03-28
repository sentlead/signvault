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
 * When a field is filled and onResize is provided, a drag handle appears
 * in the bottom-right corner so the user can resize the field before
 * finishing. The new dimensions (as percentages) are sent back via onResize.
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
  /** Called while the user drags the resize handle — newW and newH are percentages */
  onResize?: (fieldId: string, newW: number, newH: number) => void
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

// Minimum field size in pixels when resizing
const MIN_PX_W = 40
const MIN_PX_H = 20

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
  onResize,
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

  // ── Resize handle drag ───────────────────────────────────────────────────────
  function handleResizePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    e.stopPropagation()
    e.preventDefault()

    const startX = e.clientX
    const startY = e.clientY
    const startW = pxWidth
    const startH = pxHeight

    function onMove(me: PointerEvent) {
      const newPxW = Math.max(startW + (me.clientX - startX), MIN_PX_W)
      const newPxH = Math.max(startH + (me.clientY - startY), MIN_PX_H)
      onResize!(fieldId, (newPxW / containerW) * 100, (newPxH / containerH) * 100)
    }

    function onUp() {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }

  return (
    <div
      onClick={() => {
        if (!isFilled) onFieldClick(fieldId)
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
        // ── Filled state ─────────────────────────────────────────────────────
        isImage ? (
          <div className="w-full h-full flex items-center justify-center bg-white dark:bg-gray-900">
            <Image
              src={value!}
              alt="Signature"
              fill
              style={{ objectFit: 'contain', padding: '2px' }}
              unoptimized
            />
          </div>
        ) : (
          <div className="w-full h-full flex items-center px-2 bg-white/90 dark:bg-gray-900/90">
            <span className="text-xs font-medium text-sv-text dark:text-sv-dark-text truncate leading-none">
              {value}
            </span>
          </div>
        )
      ) : (
        // ── Unfilled state ────────────────────────────────────────────────────
        <div className={`w-full h-full flex items-center justify-center gap-1 ${config.text}`}>
          <Icon className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="text-xs font-medium truncate">{config.label}</span>
        </div>
      )}

      {/* ── Resize handle (only when filled and resizable) ─────────────────── */}
      {isFilled && onResize && (
        <div
          onPointerDown={handleResizePointerDown}
          style={{ position: 'absolute', bottom: 0, right: 0, width: 14, height: 14 }}
          className="cursor-se-resize z-10 flex items-center justify-center
                     bg-emerald-500 dark:bg-emerald-400 rounded-tl-sm"
          title="Drag to resize"
        >
          {/* Two-line resize indicator */}
          <svg width="8" height="8" viewBox="0 0 8 8" fill="none" aria-hidden="true">
            <line x1="2" y1="7" x2="7" y2="2" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
            <line x1="5" y1="7" x2="7" y2="5" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </div>
      )}
    </div>
  )
}
