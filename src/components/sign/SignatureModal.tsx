'use client'

/**
 * SignatureModal.tsx
 *
 * Modal dialog that lets the user create a signature/initials in one of three ways:
 *   1. Draw  — freehand drawing on a canvas using signature_pad
 *   2. Type  — type their name and pick a handwriting font
 *   3. Upload — drag-and-drop or click to browse for a PNG/JPG image
 *
 * On "Apply Signature", the selected signature is exported as a base64 PNG
 * data URL and passed to the onApply callback.
 *
 * Animated in/out with Framer Motion (scale + fade).
 */

import { useRef, useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Trash2, Upload } from 'lucide-react'
import SignaturePad from 'signature_pad'

// ── Types ──────────────────────────────────────────────────────────────────────

type Tab = 'draw' | 'type' | 'upload'

interface SignatureModalProps {
  isOpen: boolean
  /** Title shown in the modal header, e.g. "Sign" or "Initial" */
  title: string
  /** Pre-populated name for the Type tab (user's name) */
  defaultName?: string
  onApply: (dataUrl: string) => void
  onClose: () => void
}

// ── Handwriting fonts (self-hosted via next/font, injected as CSS variables) ──

const HANDWRITING_FONTS = [
  { id: 'dancing', family: 'var(--font-dancing-script), cursive', label: 'Dancing Script' },
  { id: 'pacifico', family: 'var(--font-pacifico), cursive',      label: 'Pacifico' },
  { id: 'caveat',   family: 'var(--font-caveat), cursive',         label: 'Caveat' },
  { id: 'sacr',     family: 'var(--font-sacramento), cursive',     label: 'Sacramento' },
] as const

// ── Sub-component: Draw tab ────────────────────────────────────────────────────

function DrawTab({ onCapture }: { onCapture: (dataUrl: string | null) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const padRef    = useRef<SignaturePad | null>(null)
  const [thickness, setThickness] = useState(2)

  // Detect dark mode so we can pick the right pen colour
  const isDark = typeof window !== 'undefined' &&
    window.matchMedia('(prefers-color-scheme: dark)').matches

  // Initialise SignaturePad when the canvas mounts
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    // Make canvas fill its container
    const resize = () => {
      const rect = canvas.parentElement?.getBoundingClientRect()
      if (!rect) return
      // Save current signature before resize
      const data = padRef.current?.toDataURL()
      canvas.width  = rect.width
      canvas.height = rect.height
      if (padRef.current && data) {
        void padRef.current.fromDataURL(data)
      }
    }

    padRef.current = new SignaturePad(canvas, {
      penColor:   isDark ? '#F3F4F6' : '#111827',
      minWidth:   thickness,
      maxWidth:   thickness,
    })

    resize()
    window.addEventListener('resize', resize)

    // Notify parent whenever the pad changes
    const notify = () => {
      if (padRef.current?.isEmpty()) {
        onCapture(null)
      } else {
        onCapture(padRef.current?.toDataURL('image/png') ?? null)
      }
    }

    canvas.addEventListener('pointerup', notify)
    canvas.addEventListener('touchend', notify)

    return () => {
      window.removeEventListener('resize', resize)
      canvas.removeEventListener('pointerup', notify)
      canvas.removeEventListener('touchend', notify)
      padRef.current?.off()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Update pen thickness when slider changes
  useEffect(() => {
    if (!padRef.current) return
    padRef.current.minWidth = thickness
    padRef.current.maxWidth = thickness
  }, [thickness])

  const handleClear = () => {
    padRef.current?.clear()
    onCapture(null)
  }

  return (
    <div className="space-y-3">
      {/* Drawing area */}
      <div className="relative w-full h-44 rounded-[var(--radius-button)]
                      border-2 border-dashed border-sv-border dark:border-sv-dark-border
                      bg-white dark:bg-gray-900 overflow-hidden">
        <canvas
          ref={canvasRef}
          className="absolute inset-0 touch-none"
        />
        <p className="absolute inset-0 flex items-center justify-center
                      text-sm text-sv-secondary dark:text-sv-dark-secondary
                      pointer-events-none select-none
                      opacity-40">
          Draw your signature here
        </p>
      </div>

      {/* Controls: thickness slider + clear */}
      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 text-xs text-sv-secondary dark:text-sv-dark-secondary flex-1">
          <span className="whitespace-nowrap">Pen size</span>
          <input
            type="range"
            min={1}
            max={5}
            step={0.5}
            value={thickness}
            onChange={(e) => setThickness(Number(e.target.value))}
            className="flex-1 accent-sv-primary dark:accent-sv-dark-primary"
          />
          <span className="w-6 text-center">{thickness}</span>
        </label>

        <button
          onClick={handleClear}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-button)]
                     text-xs border border-sv-border dark:border-sv-dark-border
                     text-sv-secondary dark:text-sv-dark-secondary
                     hover:border-red-400 hover:text-red-600
                     transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Clear
        </button>
      </div>
    </div>
  )
}

// ── Sub-component: Type tab ────────────────────────────────────────────────────

function TypeTab({
  defaultName,
  onCapture,
}: {
  defaultName: string
  onCapture: (dataUrl: string | null) => void
}) {
  const [typedName, setTypedName]   = useState(defaultName)
  const [selectedFont, setSelectedFont] = useState<string>(HANDWRITING_FONTS[0].family)
  const previewRef = useRef<HTMLCanvasElement>(null)

  // Render the typed text in the selected font on a hidden canvas → export PNG
  const renderToCanvas = useCallback(() => {
    const canvas = previewRef.current
    if (!canvas || !typedName.trim()) {
      onCapture(null)
      return
    }
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width  = 400
    canvas.height = 100

    // Fill white background (pdf-lib needs opaque images for best results)
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Draw the text
    ctx.font      = `48px ${selectedFont}`
    ctx.fillStyle = '#111827'
    ctx.textBaseline = 'middle'
    ctx.fillText(typedName, 16, canvas.height / 2)

    onCapture(canvas.toDataURL('image/png'))
  }, [typedName, selectedFont, onCapture])

  // Re-render whenever name or font changes
  useEffect(() => {
    renderToCanvas()
  }, [renderToCanvas])

  return (
    <div className="space-y-4">
      {/* Name input */}
      <input
        type="text"
        value={typedName}
        onChange={(e) => setTypedName(e.target.value)}
        placeholder="Type your name…"
        className="
          w-full px-3 py-2.5 rounded-[var(--radius-button)]
          border border-sv-border dark:border-sv-dark-border
          bg-sv-bg dark:bg-sv-dark-bg
          text-sv-text dark:text-sv-dark-text
          placeholder:text-sv-secondary dark:placeholder:text-sv-dark-secondary
          text-sm focus:outline-none focus:ring-2 focus:ring-sv-primary dark:focus:ring-sv-dark-primary
        "
      />

      {/* Hidden canvas for rendering */}
      <canvas ref={previewRef} className="hidden" />

      {/* Font picker cards */}
      <div className="grid grid-cols-2 gap-2">
        {HANDWRITING_FONTS.map(({ id, family, label }) => {
          const isSelected = selectedFont === family
          return (
            <button
              key={id}
              onClick={() => setSelectedFont(family)}
              className={`
                p-3 rounded-[var(--radius-button)] border-2 text-left
                transition-all duration-150 overflow-hidden
                ${isSelected
                  ? 'border-sv-primary dark:border-sv-dark-primary bg-sv-primary/5 dark:bg-sv-dark-primary/10'
                  : 'border-sv-border dark:border-sv-dark-border hover:border-sv-secondary dark:hover:border-sv-dark-secondary'
                }
              `}
              aria-pressed={isSelected}
            >
              {/* Signature preview in this font */}
              <p
                className="text-2xl text-sv-text dark:text-sv-dark-text leading-tight truncate"
                style={{ fontFamily: family }}
              >
                {typedName || 'Your Name'}
              </p>
              <p className="text-xs text-sv-secondary dark:text-sv-dark-secondary mt-1">{label}</p>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ── Sub-component: Upload tab ──────────────────────────────────────────────────

function UploadTab({ onCapture }: { onCapture: (dataUrl: string | null) => void }) {
  const [preview, setPreview] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) return

    const reader = new FileReader()
    reader.onload = (e) => {
      const url = e.target?.result as string
      setPreview(url)
      onCapture(url)
    }
    reader.readAsDataURL(file)
  }

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault()
          setIsDragging(false)
          const file = e.dataTransfer.files[0]
          if (file) handleFile(file)
        }}
        onClick={() => inputRef.current?.click()}
        className={`
          relative w-full h-36 rounded-[var(--radius-button)] border-2 border-dashed
          flex flex-col items-center justify-center gap-2 cursor-pointer
          transition-colors duration-150
          ${isDragging
            ? 'border-sv-primary dark:border-sv-dark-primary bg-sv-primary/5 dark:bg-sv-dark-primary/10'
            : 'border-sv-border dark:border-sv-dark-border hover:border-sv-primary dark:hover:border-sv-dark-primary'
          }
        `}
      >
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="Signature preview" className="max-h-full max-w-full object-contain p-2" />
        ) : (
          <>
            <Upload className="w-6 h-6 text-sv-secondary dark:text-sv-dark-secondary" />
            <p className="text-sm text-sv-secondary dark:text-sv-dark-secondary text-center px-4">
              Drag &amp; drop a PNG or JPG, or{' '}
              <span className="text-sv-primary dark:text-sv-dark-primary underline">browse</span>
            </p>
          </>
        )}
      </div>

      {/* Hint */}
      <p className="text-xs text-sv-secondary dark:text-sv-dark-secondary leading-relaxed">
        Tip: use a signature on a white or transparent background for best results.
      </p>

      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleFile(file)
        }}
      />
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────

export function SignatureModal({
  isOpen,
  title,
  defaultName = '',
  onApply,
  onClose,
}: SignatureModalProps) {
  const [activeTab, setActiveTab] = useState<Tab>('draw')
  // Current captured data URL from whichever tab is active
  const [capturedUrl, setCapturedUrl] = useState<string | null>(null)

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setActiveTab('draw')
      setCapturedUrl(null)
    }
  }, [isOpen])

  const handleApply = () => {
    if (!capturedUrl) return
    onApply(capturedUrl)
  }

  const TABS: { id: Tab; label: string }[] = [
    { id: 'draw',   label: 'Draw' },
    { id: 'type',   label: 'Type' },
    { id: 'upload', label: 'Upload' },
  ]

  return (
    <AnimatePresence>
      {isOpen && (
        // Backdrop
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="
            fixed inset-0 z-50 flex items-center justify-center p-4
            bg-black/50 backdrop-blur-sm
          "
          onClick={(e) => {
            // Close when clicking outside the dialog
            if (e.target === e.currentTarget) onClose()
          }}
        >
          {/* Dialog */}
          <motion.div
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.92, opacity: 0 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="
              w-full max-w-lg rounded-[var(--radius-card)]
              bg-sv-surface dark:bg-sv-dark-surface
              border border-sv-border dark:border-sv-dark-border
              shadow-2xl overflow-hidden
            "
            role="dialog"
            aria-modal="true"
            aria-label={title}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4
                            border-b border-sv-border dark:border-sv-dark-border">
              <h2 className="text-base font-semibold text-sv-text dark:text-sv-dark-text">
                {title}
              </h2>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full flex items-center justify-center
                           text-sv-secondary dark:text-sv-dark-secondary
                           hover:bg-sv-bg dark:hover:bg-sv-dark-bg
                           transition-colors"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-sv-border dark:border-sv-dark-border">
              {TABS.map(({ id, label }) => (
                <button
                  key={id}
                  onClick={() => { setActiveTab(id); setCapturedUrl(null) }}
                  className={`
                    flex-1 py-2.5 text-sm font-medium transition-colors
                    ${activeTab === id
                      ? 'text-sv-primary dark:text-sv-dark-primary border-b-2 border-sv-primary dark:border-sv-dark-primary -mb-px'
                      : 'text-sv-secondary dark:text-sv-dark-secondary hover:text-sv-text dark:hover:text-sv-dark-text'
                    }
                  `}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Tab body */}
            <div className="p-5">
              {activeTab === 'draw' && (
                <DrawTab onCapture={setCapturedUrl} />
              )}
              {activeTab === 'type' && (
                <TypeTab defaultName={defaultName} onCapture={setCapturedUrl} />
              )}
              {activeTab === 'upload' && (
                <UploadTab onCapture={setCapturedUrl} />
              )}
            </div>

            {/* Footer actions */}
            <div className="flex items-center justify-end gap-3 px-5 py-4
                            border-t border-sv-border dark:border-sv-dark-border">
              <button
                onClick={onClose}
                className="
                  px-4 py-2 rounded-[var(--radius-button)] text-sm
                  border border-sv-border dark:border-sv-dark-border
                  text-sv-text dark:text-sv-dark-text
                  hover:bg-sv-bg dark:hover:bg-sv-dark-bg
                  transition-colors
                "
              >
                Cancel
              </button>
              <button
                onClick={handleApply}
                disabled={!capturedUrl}
                className="
                  px-4 py-2 rounded-[var(--radius-button)] text-sm font-semibold
                  bg-sv-primary hover:bg-sv-primary-hover
                  dark:bg-sv-dark-primary dark:hover:bg-sv-dark-primary-hover
                  text-white shadow-sm transition-colors
                  disabled:opacity-50 disabled:cursor-not-allowed
                "
              >
                Apply Signature
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
