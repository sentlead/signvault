'use client'

/**
 * PrepareEditor.tsx — Main client component for the prepare step
 *
 * Layout:
 *   ┌──────────────┬──────────────────────────────────┐
 *   │ FieldToolbar │       PDF Viewer + Fields         │
 *   │  (left, w-64)│  (center, scrollable, flex-1)    │
 *   └──────────────┴──────────────────────────────────┘
 *
 * Modes:
 *   "Sign Myself"        — owner places fields and signs them directly
 *   "Send for Signatures"— owner adds signers, assigns fields to each signer,
 *                          then sends signing request emails
 *
 * Flow (Sign Myself):
 *   1. Place fields → "Save & Continue" → /documents/[id]/sign
 *
 * Flow (Send for Signatures):
 *   1. Add signers in SignerPanel
 *   2. Select a signer, then place fields for that signer
 *   3. "Send for Signatures" → POST /api/documents/[id]/send
 *
 * Positions are stored as percentages (0–100) relative to the page size.
 */

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { FieldToolbar } from './FieldToolbar'
import { PdfCanvas } from './PdfCanvas'
import { SignerPanel, getSignerColor } from './SignerPanel'
import type { SignerData } from './SignerPanel'
import { toast } from '@/lib/toast'

// ── Types ─────────────────────────────────────────────────────────────────────

export type FieldType = 'signature' | 'initials' | 'date' | 'text'

/** The mode toggle: sign yourself or send to others */
export type PrepareMode = 'self' | 'send'

export interface FieldData {
  /** Temporary client-side ID (never sent to DB — DB generates its own) */
  id: string
  type: FieldType
  pageNumber: number
  /** Position and size as a percentage of page width/height (0–100) */
  x: number
  y: number
  width: number
  height: number
  /** Which signer this field belongs to (only set in "send" mode) */
  signerId?: string
}

// ── Existing DB field shape (what the server returns) ─────────────────────────
interface ServerField {
  id: string
  type: string
  pageNumber: number
  x: number
  y: number
  width: number
  height: number
  signerId: string | null
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface PrepareEditorProps {
  documentId: string
  documentName: string
  /** Fields that were previously saved (loaded from DB on page mount) */
  initialFields: ServerField[]
}

// Tiny guard so fields are never completely invisible (in % of page)
const MIN_FIELD_WIDTH = 0.5
const MIN_FIELD_HEIGHT = 0.5

// Convert DB fields (string type, nullable signerId) → FieldData
function dbFieldsToFieldData(dbFields: ServerField[]): FieldData[] {
  return dbFields.map((f) => ({
    id: crypto.randomUUID(),   // new client-side ID
    type: f.type as FieldType,
    pageNumber: f.pageNumber,
    x: f.x,
    y: f.y,
    width: f.width,
    height: f.height,
    signerId: f.signerId ?? undefined,
  }))
}

// ── Component ─────────────────────────────────────────────────────────────────

export function PrepareEditor({
  documentId,
  documentName,
  initialFields,
}: PrepareEditorProps) {
  const router = useRouter()

  // ── Mode state ────────────────────────────────────────────────────────────
  // "self"  = owner signs directly (original behaviour)
  // "send"  = collect signers and send emails
  const [mode, setMode] = useState<PrepareMode>('self')

  // ── Signers state (only used in "send" mode) ──────────────────────────────
  const [signers, setSigners] = useState<SignerData[]>([])
  // Which signer's fields are being placed right now
  const [selectedSignerId, setSelectedSignerId] = useState<string | null>(null)

  // Currently selected field type (used when placing new fields)
  const [selectedType, setSelectedType] = useState<FieldType>('signature')

  // All placed fields (initialised from DB data)
  const [fields, setFields] = useState<FieldData[]>(() =>
    dbFieldsToFieldData(initialFields)
  )

  // PDF state
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [zoom, setZoom] = useState(100)

  // Save / send state
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  // ── Signer management ────────────────────────────────────────────────────

  const handleAddSigner = useCallback((signer: SignerData) => {
    setSigners((prev) => [...prev, signer])
    // Auto-select the newly added signer for field placement
    setSelectedSignerId(signer.id)
  }, [])

  const handleRemoveSigner = useCallback((id: string) => {
    setSigners((prev) => prev.filter((s) => s.id !== id))
    // Remove all fields assigned to this signer
    setFields((prev) => prev.filter((f) => f.signerId !== id))
    // Clear selection if this was the selected signer
    setSelectedSignerId((prev) => (prev === id ? null : prev))
  }, [])

  // ── Field management ─────────────────────────────────────────────────────

  // Called by PdfCanvas when the user finishes drawing a box on the PDF
  const handlePlaceField = useCallback(
    (xPct: number, yPct: number, wPct: number, hPct: number) => {
      // In "send" mode, require a signer to be selected
      if (mode === 'send' && !selectedSignerId) return

      const newField: FieldData = {
        id: crypto.randomUUID(),
        type: selectedType,
        pageNumber: currentPage,
        // Clamp so the field can't overflow the page
        x: Math.min(Math.max(0, xPct), 100 - MIN_FIELD_WIDTH),
        y: Math.min(Math.max(0, yPct), 100 - MIN_FIELD_HEIGHT),
        width:  Math.max(wPct, MIN_FIELD_WIDTH),
        height: Math.max(hPct, MIN_FIELD_HEIGHT),
        signerId: mode === 'send' ? (selectedSignerId ?? undefined) : undefined,
      }
      setFields((prev) => [...prev, newField])
    },
    [selectedType, currentPage, mode, selectedSignerId]
  )

  // Called by FieldOverlay when a field is dragged or resized
  const handleUpdateField = useCallback(
    (id: string, updates: Partial<FieldData>) => {
      setFields((prev) =>
        prev.map((f) => (f.id === id ? { ...f, ...updates } : f))
      )
    },
    []
  )

  // Called by FieldOverlay when the × button is clicked
  const handleDeleteField = useCallback((id: string) => {
    setFields((prev) => prev.filter((f) => f.id !== id))
  }, [])

  // ── Save (self-sign mode) ─────────────────────────────────────────────────

  async function handleSave() {
    setIsSaving(true)
    setSaveError(null)

    try {
      const res = await fetch(`/api/documents/${documentId}/fields`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fields: fields.map(({ type, pageNumber, x, y, width, height, signerId }) => ({
            type,
            pageNumber,
            x,
            y,
            width,
            height,
            signerId,
          })),
        }),
      })

      if (!res.ok) {
        const data = (await res.json()) as { error?: string }
        throw new Error(data.error ?? 'Save failed')
      }

      toast.success('Fields saved!')
      // Navigate to the sign step
      router.push(`/documents/${documentId}/sign`)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Save failed. Please try again.'
      setSaveError(message)
      toast.error(message)
      setIsSaving(false)
    }
  }

  // ── Send (send mode) ─────────────────────────────────────────────────────

  async function handleSend() {
    setIsSaving(true)
    setSaveError(null)

    // Validate: need at least one signer
    if (signers.length === 0) {
      setSaveError('Please add at least one signer before sending.')
      setIsSaving(false)
      return
    }

    // Validate: all fields must be assigned to a signer
    const unassigned = fields.filter((f) => !f.signerId)
    if (unassigned.length > 0) {
      setSaveError('All fields must be assigned to a signer. Select a signer before placing fields.')
      setIsSaving(false)
      return
    }

    // Validate: need at least one field
    if (fields.length === 0) {
      setSaveError('Please place at least one field on the document.')
      setIsSaving(false)
      return
    }

    try {
      const res = await fetch(`/api/documents/${documentId}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          signers: signers.map(({ name, email }) => ({ name, email })),
          fields: fields.map(({ type, pageNumber, x, y, width, height, signerId }) => ({
            type,
            pageNumber,
            x,
            y,
            width,
            height,
            // We use the client-side signer index to map to server-created IDs.
            // The server receives signers in the same order we send them,
            // so we pass the index instead of the temporary client ID.
            signerIndex: signers.findIndex((s) => s.id === signerId),
          })),
        }),
      })

      if (!res.ok) {
        const data = (await res.json()) as { error?: string }
        throw new Error(data.error ?? 'Send failed')
      }

      toast.success('Signing request sent!')
      // Return to the document detail page
      router.push(`/documents/${documentId}`)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Send failed. Please try again.'
      setSaveError(message)
      toast.error(message)
      setIsSaving(false)
    }
  }

  // The selected signer's color index (for the toolbar indicator)
  const selectedSignerIndex = signers.findIndex((s) => s.id === selectedSignerId)
  const selectedSignerColor = selectedSignerIndex >= 0
    ? getSignerColor(selectedSignerIndex)
    : null

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-sv-bg dark:bg-sv-dark-bg flex flex-col">

      {/* ── Top bar ─────────────────────────────────────────────────────── */}
      <header className="
        flex-shrink-0 flex items-center gap-3 px-4 h-14
        bg-sv-surface dark:bg-sv-dark-surface
        border-b border-sv-border dark:border-sv-dark-border
      ">
        {/* Back to document detail */}
        <Link
          href={`/documents/${documentId}`}
          className="
            inline-flex items-center gap-1.5 text-sm
            text-sv-secondary dark:text-sv-dark-secondary
            hover:text-sv-text dark:hover:text-sv-dark-text
            transition-colors
          "
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>

        {/* Divider */}
        <span className="text-sv-border dark:text-sv-dark-border">|</span>

        {/* Document name */}
        <h1 className="text-sm font-semibold text-sv-text dark:text-sv-dark-text truncate flex-1">
          {documentName}
        </h1>

        {/* Step label */}
        <span className="text-xs text-sv-secondary dark:text-sv-dark-secondary">
          Step 1 of 2: Prepare
        </span>
      </header>

      {/* ── Main editor area ─────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Left toolbar */}
        <FieldToolbar
          mode={mode}
          onModeChange={(newMode) => {
            setMode(newMode)
            // Clear signer selection when switching modes
            if (newMode === 'self') setSelectedSignerId(null)
          }}
          signers={signers}
          selectedSignerId={selectedSignerId}
          onSelectSigner={setSelectedSignerId}
          onAddSigner={handleAddSigner}
          onRemoveSigner={handleRemoveSigner}
          selectedSignerColor={selectedSignerColor}
          selectedType={selectedType}
          onSelectType={setSelectedType}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          zoom={zoom}
          onZoomChange={setZoom}
          onSave={mode === 'self' ? handleSave : handleSend}
          isSaving={isSaving}
        />

        {/* Center PDF viewer */}
        <main className="flex-1 overflow-auto p-6 flex flex-col items-center">

          {/* Save error banner */}
          {saveError && (
            <div className="
              w-full max-w-3xl mb-4 px-4 py-3 rounded-[var(--radius-card)]
              bg-red-50 dark:bg-red-900/20
              border border-red-200 dark:border-red-800
              text-red-700 dark:text-red-400 text-sm
            ">
              {saveError}
            </div>
          )}

          {/* "Send mode" hint when no signer is selected */}
          {mode === 'send' && signers.length > 0 && !selectedSignerId && (
            <div className="
              w-full max-w-3xl mb-4 px-4 py-3 rounded-[var(--radius-card)]
              bg-amber-50 dark:bg-amber-900/20
              border border-amber-200 dark:border-amber-800
              text-amber-700 dark:text-amber-400 text-sm
            ">
              Select a signer in the left panel before placing fields.
            </div>
          )}

          {/* PDF + field overlays */}
          <div className="shadow-xl rounded overflow-hidden">
            <PdfCanvas
              documentId={documentId}
              currentPage={currentPage}
              zoom={zoom}
              fields={fields}
              selectedType={selectedType}
              signers={signers}
              onNumPagesLoaded={setTotalPages}
              onPlaceField={handlePlaceField}
              onUpdateField={handleUpdateField}
              onDeleteField={handleDeleteField}
            />
          </div>

          {/* Instruction hint */}
          <p className="mt-4 text-xs text-sv-secondary dark:text-sv-dark-secondary text-center">
            {mode === 'send' && selectedSignerIndex >= 0 ? (
              <>
                Placing <span className="font-medium text-sv-text dark:text-sv-dark-text">{selectedType}</span> fields
                for <span className="font-medium text-sv-text dark:text-sv-dark-text">
                  {signers[selectedSignerIndex]?.name}
                </span>. Click the PDF to place.
              </>
            ) : (
              <>
                Click and drag on the PDF to draw a{' '}
                <span className="font-medium text-sv-text dark:text-sv-dark-text">
                  {selectedType}
                </span>{' '}
                field. Drag corners to resize, drag the box to reposition.
              </>
            )}
          </p>
        </main>
      </div>
    </div>
  )
}
