'use client'

/**
 * ExternalSigningEditor.tsx
 *
 * Signing experience for external signers (no login required).
 * Functionally the same as SigningEditor, but:
 *   - No "Back" button (they came from an email, there's no dashboard)
 *   - Submits via POST /api/documents/[id]/sign with the JWT token in the body
 *   - On success, redirects to /sign/[token]/success
 *
 * The component reuses the same signing primitives (FieldValueOverlay,
 * SignatureModal, ProgressSidebar) as the owner-signing flow.
 */

import '@/lib/pdf-worker'

import { useState, useRef, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight, Loader2, Download } from 'lucide-react'
import { Document, Page } from 'react-pdf'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'

import { ProgressSidebar } from './ProgressSidebar'
import { FieldValueOverlay } from './FieldValueOverlay'
import { SignatureModal } from './SignatureModal'
import type { SigningField } from './SigningEditor'

// ── Props ──────────────────────────────────────────────────────────────────────

interface ExternalSigningEditorProps {
  documentId: string
  documentName: string
  /** The external signer's name (pre-fills Type tab in SignatureModal) */
  signerName: string
  /** The external signer's email (used in audit log on the server) */
  signerEmail: string
  /** The raw JWT token from the URL — sent to the API to authenticate */
  signerToken: string
  /** Only the fields assigned to this signer */
  initialFields: SigningField[]
}

/** Values collected during signing — fieldId → data URL or text */
type FieldValues = Record<string, string>

// Default rendered width of the PDF at 100% zoom
const BASE_WIDTH = 800

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatTodayDate(): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date())
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 0 || !parts[0]) return ''
  if (parts.length === 1) return parts[0][0].toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

// ── Component ──────────────────────────────────────────────────────────────────

export function ExternalSigningEditor({
  documentId,
  documentName,
  signerName,
  signerEmail: _signerEmail,
  signerToken,
  initialFields,
}: ExternalSigningEditorProps) {
  const router = useRouter()

  // ── PDF state ─────────────────────────────────────────────────────────────
  const [currentPage, setCurrentPage]   = useState(1)
  const [totalPages, setTotalPages]     = useState(0)
  const [isLoading, setIsLoading]       = useState(true)
  const [pdfError, setPdfError]         = useState<string | null>(null)
  const [pageSize, setPageSize]         = useState({ width: BASE_WIDTH, height: BASE_WIDTH * 1.414 })
  const containerRef = useRef<HTMLDivElement>(null)

  // ── Field values state ───────────────────────────────────────────────────
  const [fieldValues, setFieldValues] = useState<FieldValues>(() => {
    const initial: FieldValues = {}
    for (const f of initialFields) {
      if (f.value) initial[f.id] = f.value
    }
    return initial
  })

  // ── Modal state ───────────────────────────────────────────────────────────
  const [modalOpen, setModalOpen]         = useState(false)
  const [activeFieldId, setActiveFieldId] = useState<string | null>(null)

  // ── Inline text input state ───────────────────────────────────────────────
  const [textInputFieldId, setTextInputFieldId] = useState<string | null>(null)
  const [textInputValue, setTextInputValue]     = useState('')

  // ── Finish state ─────────────────────────────────────────────────────────
  const [isGenerating, setIsGenerating] = useState(false)
  const [genError, setGenError]         = useState<string | null>(null)

  // ── Responsive container width ────────────────────────────────────────────
  // Measure the <main> element so the PDF can scale to fit on mobile.
  const mainRef = useRef<HTMLElement>(null)
  const [containerWidth, setContainerWidth] = useState(BASE_WIDTH)

  useEffect(() => {
    function update() {
      if (mainRef.current) {
        setContainerWidth(mainRef.current.clientWidth)
      }
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  // ── Current page fields ───────────────────────────────────────────────────
  const pageFields = initialFields.filter((f) => f.pageNumber === currentPage)

  // ── Field click handler ───────────────────────────────────────────────────
  const handleFieldClick = useCallback((fieldId: string) => {
    const field = initialFields.find((f) => f.id === fieldId)
    if (!field) return

    if (field.type === 'date') {
      setFieldValues((prev) => ({ ...prev, [fieldId]: formatTodayDate() }))
    } else if (field.type === 'text') {
      setTextInputFieldId(fieldId)
      setTextInputValue(fieldValues[fieldId] ?? '')
    } else {
      setActiveFieldId(fieldId)
      setModalOpen(true)
    }
  }, [initialFields, fieldValues])

  // ── Modal apply handler ───────────────────────────────────────────────────
  const handleModalApply = useCallback((dataUrl: string) => {
    if (!activeFieldId) return
    setFieldValues((prev) => ({ ...prev, [activeFieldId]: dataUrl }))
    setModalOpen(false)
    setActiveFieldId(null)
  }, [activeFieldId])

  // ── Inline text confirm handler ───────────────────────────────────────────
  const handleTextConfirm = useCallback(() => {
    if (!textInputFieldId) return
    if (textInputValue.trim()) {
      setFieldValues((prev) => ({ ...prev, [textInputFieldId]: textInputValue.trim() }))
    }
    setTextInputFieldId(null)
    setTextInputValue('')
  }, [textInputFieldId, textInputValue])

  // ── Finish handler ────────────────────────────────────────────────────────
  const handleFinish = useCallback(async () => {
    setIsGenerating(true)
    setGenError(null)

    try {
      const res = await fetch(`/api/documents/${documentId}/sign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // Send the token in the body (the API also accepts Authorization header)
        body: JSON.stringify({
          token: signerToken,
          fields: Object.entries(fieldValues).map(([fieldId, value]) => ({ fieldId, value })),
        }),
      })

      if (!res.ok) {
        const data = (await res.json()) as { error?: string }
        throw new Error(data.error ?? 'Failed to submit signature')
      }

      // Navigate to the success page
      router.push(`/sign/${signerToken}/success`)
    } catch (err) {
      setGenError(err instanceof Error ? err.message : 'Failed to submit. Please try again.')
      setIsGenerating(false)
    }
  }, [documentId, fieldValues, signerToken, router])

  // Modal config
  const activeField     = activeFieldId ? initialFields.find((f) => f.id === activeFieldId) : null
  const modalTitle      = activeField?.type === 'initials' ? 'Add Initials' : 'Add Signature'
  const modalDefaultName = activeField?.type === 'initials' ? getInitials(signerName) : signerName

  // PDF width: cap at BASE_WIDTH but shrink to fit the container on mobile.
  const pageWidth  = Math.min(BASE_WIDTH, containerWidth - 32)
  const pageHeight = pageSize.height * (pageWidth / pageSize.width)

  // Progress values used by the mobile floating bar
  const filledCount = initialFields.filter((f) => fieldValues[f.id] !== undefined).length
  const allFilled   = filledCount === initialFields.length
  const pct         = initialFields.length === 0 ? 0 : Math.round((filledCount / initialFields.length) * 100)

  return (
    <div className="bg-sv-bg dark:bg-sv-dark-bg flex flex-col min-h-[calc(100vh-7rem)]">

      {/* ── Document title bar ─────────────────────────────────────────────── */}
      <div className="
        flex items-center gap-3 px-6 py-3
        bg-sv-surface dark:bg-sv-dark-surface
        border-b border-sv-border dark:border-sv-dark-border
      ">
        <h1 className="text-sm font-semibold text-sv-text dark:text-sv-dark-text truncate flex-1">
          {documentName}
        </h1>
        <span className="text-xs text-sv-secondary dark:text-sv-dark-secondary flex-shrink-0">
          Review and sign all fields to complete
        </span>
      </div>

      {/* ── Main area ─────────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Left sidebar — hidden on mobile, shown on large screens */}
        <div className="hidden lg:block">
          <ProgressSidebar
            fields={initialFields}
            values={fieldValues}
            onFinish={handleFinish}
            isGenerating={isGenerating}
          />
        </div>

        {/* Center PDF viewer — full width on mobile */}
        <main ref={mainRef} className="flex-1 overflow-auto p-6 pb-20 lg:pb-6 flex flex-col items-center">

          {/* Error banner */}
          {genError && (
            <div className="
              w-full max-w-3xl mb-4 px-4 py-3 rounded-[var(--radius-card)]
              bg-red-50 dark:bg-red-900/20
              border border-red-200 dark:border-red-800
              text-red-700 dark:text-red-400 text-sm
            ">
              {genError}
            </div>
          )}

          {/* Inline text input prompt */}
          {textInputFieldId && (
            <div className="
              w-full max-w-3xl mb-4 px-4 py-3 rounded-[var(--radius-card)]
              bg-sv-surface dark:bg-sv-dark-surface
              border border-sv-border dark:border-sv-dark-border
              flex items-center gap-3
            ">
              <input
                autoFocus
                type="text"
                value={textInputValue}
                onChange={(e) => setTextInputValue(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleTextConfirm() }}
                placeholder="Enter text…"
                className="
                  flex-1 px-3 py-2 rounded-[var(--radius-button)]
                  border border-sv-border dark:border-sv-dark-border
                  bg-sv-bg dark:bg-sv-dark-bg
                  text-sv-text dark:text-sv-dark-text
                  text-sm focus:outline-none focus:ring-2
                  focus:ring-sv-primary dark:focus:ring-sv-dark-primary
                "
              />
              <button
                onClick={handleTextConfirm}
                className="
                  px-4 py-2 rounded-[var(--radius-button)] text-sm font-medium
                  bg-sv-primary hover:bg-sv-primary-hover
                  dark:bg-sv-dark-primary dark:hover:bg-sv-dark-primary-hover
                  text-white transition-colors
                "
              >
                Apply
              </button>
              <button
                onClick={() => setTextInputFieldId(null)}
                className="
                  px-3 py-2 rounded-[var(--radius-button)] text-sm
                  border border-sv-border dark:border-sv-dark-border
                  text-sv-secondary dark:text-sv-dark-secondary
                  hover:bg-sv-bg dark:hover:bg-sv-dark-bg transition-colors
                "
              >
                Cancel
              </button>
            </div>
          )}

          {/* PDF + overlays */}
          <div className="shadow-xl rounded overflow-hidden">
            <Document
              file={`/api/documents/${documentId}/file?token=${encodeURIComponent(signerToken)}`}
              onLoadSuccess={({ numPages }) => {
                setIsLoading(false)
                setTotalPages(numPages)
              }}
              onLoadError={(err) => {
                setIsLoading(false)
                setPdfError(`Failed to load PDF: ${err.message}`)
              }}
              error={null}
              loading={null}
            >
              {/* Loading skeleton */}
              {isLoading && !pdfError && (
                <div
                  className="animate-pulse rounded bg-sv-border dark:bg-sv-dark-border"
                  style={{ width: pageWidth, height: Math.round(pageWidth * 1.414) }}
                />
              )}

              {/* Error */}
              {pdfError && (
                <div
                  className="
                    flex items-center justify-center rounded border
                    border-red-200 dark:border-red-800
                    bg-red-50 dark:bg-red-900/20
                    text-red-600 dark:text-red-400 text-sm p-8
                  "
                  style={{ width: pageWidth }}
                >
                  {pdfError}
                </div>
              )}

              {/* Page container with field overlays */}
              <div
                ref={containerRef}
                className="relative"
                style={{ width: pageWidth, height: pageHeight }}
              >
                <Page
                  pageNumber={currentPage}
                  width={pageWidth}
                  onRenderSuccess={() => {
                    if (containerRef.current) {
                      const canvas = containerRef.current.querySelector('canvas')
                      if (canvas) {
                        setPageSize({ width: canvas.offsetWidth, height: canvas.offsetHeight })
                      }
                    }
                  }}
                  renderAnnotationLayer={false}
                  renderTextLayer={false}
                />

                {/* Clickable field overlays */}
                {pageFields.map((field) => (
                  <FieldValueOverlay
                    key={field.id}
                    fieldId={field.id}
                    type={field.type as 'signature' | 'initials' | 'date' | 'text'}
                    x={field.x}
                    y={field.y}
                    width={field.width}
                    height={field.height}
                    value={fieldValues[field.id]}
                    onFieldClick={handleFieldClick}
                    containerW={pageWidth}
                    containerH={pageHeight}
                  />
                ))}
              </div>
            </Document>
          </div>

          {/* Page navigation */}
          {totalPages > 1 && (
            <div className="mt-4 flex items-center gap-4">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
                className="
                  w-8 h-8 rounded-[var(--radius-button)] flex items-center justify-center
                  border border-sv-border dark:border-sv-dark-border
                  text-sv-text dark:text-sv-dark-text
                  hover:bg-sv-surface dark:hover:bg-sv-dark-surface
                  disabled:opacity-40 disabled:cursor-not-allowed transition-colors
                "
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <span className="text-sm text-sv-text dark:text-sv-dark-text">
                {currentPage} / {totalPages}
              </span>

              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
                className="
                  w-8 h-8 rounded-[var(--radius-button)] flex items-center justify-center
                  border border-sv-border dark:border-sv-dark-border
                  text-sv-text dark:text-sv-dark-text
                  hover:bg-sv-surface dark:hover:bg-sv-dark-surface
                  disabled:opacity-40 disabled:cursor-not-allowed transition-colors
                "
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Instruction hint */}
          <p className="mt-4 text-xs text-sv-secondary dark:text-sv-dark-secondary text-center">
            Click any highlighted field to fill it in. Date fields fill automatically.
          </p>
        </main>

        {/* ── Mobile floating progress bar ─────────────────────────────────
            Shown instead of the sidebar on small screens (< lg).
            Sticks to the bottom so the finish button is always reachable. */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-10
                        bg-sv-surface dark:bg-sv-dark-surface
                        border-t border-sv-border dark:border-sv-dark-border
                        px-4 py-3 flex items-center gap-3 shadow-lg">
          {/* Progress text + bar */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-sv-text dark:text-sv-dark-text">
                {filledCount} / {initialFields.length} fields
              </span>
              <span className="text-xs text-sv-secondary dark:text-sv-dark-secondary">
                {pct}%
              </span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-sv-border dark:bg-sv-dark-border overflow-hidden">
              <div
                className="h-full rounded-full bg-sv-primary dark:bg-sv-dark-primary transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
          {/* Finish button */}
          <button
            onClick={handleFinish}
            disabled={!allFilled || isGenerating}
            className="flex-shrink-0 px-4 py-2 rounded-[var(--radius-button)]
                       bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold
                       disabled:opacity-50 disabled:cursor-not-allowed transition-colors
                       flex items-center gap-2"
          >
            {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            Finish
          </button>
        </div>
      </div>

      {/* Signature modal */}
      <SignatureModal
        isOpen={modalOpen}
        title={modalTitle}
        defaultName={modalDefaultName}
        onApply={handleModalApply}
        onClose={() => {
          setModalOpen(false)
          setActiveFieldId(null)
        }}
      />
    </div>
  )
}
