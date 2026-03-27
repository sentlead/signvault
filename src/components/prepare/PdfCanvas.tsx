'use client'

/**
 * PdfCanvas.tsx
 *
 * Renders the PDF using react-pdf's <Document> and <Page> components,
 * then overlays all the placed signature fields on top.
 *
 * Click handling:
 *   When the user clicks anywhere on the PDF page (but NOT on an existing
 *   field), we calculate the click position as a percentage of the page
 *   dimensions and call onPlaceField so PrepareEditor can add a new field.
 *
 * The PDF is fetched from /api/documents/[id]/file (authenticated).
 */

// Must import the worker config BEFORE importing react-pdf components
import '@/lib/pdf-worker'

import { useState, useRef, useCallback } from 'react'
import { Document, Page } from 'react-pdf'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'
import { FieldOverlay } from './FieldOverlay'
import type { FieldData, FieldType } from './PrepareEditor'
import type { SignerData } from './SignerPanel'

interface PdfCanvasProps {
  documentId: string
  currentPage: number
  zoom: number                   // percentage, e.g. 100 = 100%
  fields: FieldData[]            // all fields across all pages
  selectedType: FieldType        // used to colour the ghost preview while drawing
  /** Signers list — passed to FieldOverlay for color-coding */
  signers?: SignerData[]
  onNumPagesLoaded: (n: number) => void
  /** Called with the drawn box as percentages of page size */
  onPlaceField: (xPct: number, yPct: number, wPct: number, hPct: number) => void
  onUpdateField: (id: string, updates: Partial<FieldData>) => void
  onDeleteField: (id: string) => void
}

// Minimum drag distance in pixels before we commit the field
const MIN_DRAW_PX = 10

// SVG stroke + fill colours per field type
const GHOST_STYLE: Record<FieldType, { stroke: string; fill: string }> = {
  signature: { stroke: '#6366F1', fill: 'rgba(99,102,241,0.08)'  },
  initials:  { stroke: '#8B5CF6', fill: 'rgba(139,92,246,0.08)'  },
  date:      { stroke: '#F59E0B', fill: 'rgba(245,158,11,0.08)'  },
  text:      { stroke: '#64748B', fill: 'rgba(100,116,139,0.08)' },
}

// Default width of the PDF page at 100% zoom (pixels)
// react-pdf scales from this base width
const BASE_WIDTH = 800

export function PdfCanvas({
  documentId,
  currentPage,
  zoom,
  fields,
  selectedType,
  signers = [],
  onNumPagesLoaded,
  onPlaceField,
  onUpdateField,
  onDeleteField,
}: PdfCanvasProps) {
  // Whether the PDF is still loading
  const [isLoading, setIsLoading] = useState(true)
  // Error message if the PDF fails to load
  const [error, setError] = useState<string | null>(null)
  // Actual rendered page dimensions (set after the Page renders)
  const [pageSize, setPageSize] = useState({ width: BASE_WIDTH, height: BASE_WIDTH * 1.414 })

  // ── Draw-to-place state ────────────────────────────────────────────────────
  // While the user holds the mouse button we track start + current position
  // in pixels relative to the container, and render a ghost preview rectangle.
  const [drawing, setDrawing] = useState<{
    startX: number; startY: number
    curX: number;   curY: number
  } | null>(null)

  // Ref to the page container div so we can measure it
  const containerRef = useRef<HTMLDivElement>(null)

  // Calculated width based on zoom
  const pageWidth = Math.round((BASE_WIDTH * zoom) / 100)

  // Fields that belong to the current page only
  const pageFields = fields.filter((f) => f.pageNumber === currentPage)

  // ── Mouse handlers for draw-to-place ──────────────────────────────────────

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.button !== 0) return
      const target = e.target as HTMLElement
      if (target.closest('.react-draggable')) return

      e.preventDefault()
      // Always measure from the ref so start/move/end all use the same origin
      const rect = containerRef.current?.getBoundingClientRect()
      if (!rect) return
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      setDrawing({ startX: x, startY: y, curX: x, curY: y })
    },
    []
  )

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!drawing) return
      const rect = containerRef.current?.getBoundingClientRect()
      if (!rect) return
      setDrawing((d) => d ? {
        ...d,
        curX: Math.max(0, Math.min(e.clientX - rect.left, rect.width)),
        curY: Math.max(0, Math.min(e.clientY - rect.top,  rect.height)),
      } : null)
    },
    [drawing]
  )

  const handleMouseUp = useCallback(
    () => {
      if (!drawing) return
      // Use the ref — same element, consistent measurement across all handlers
      const rect = containerRef.current?.getBoundingClientRect()
      if (!rect) { setDrawing(null); return }

      const rawX = Math.min(drawing.startX, drawing.curX)
      const rawY = Math.min(drawing.startY, drawing.curY)
      const rawW = Math.abs(drawing.curX - drawing.startX)
      const rawH = Math.abs(drawing.curY - drawing.startY)

      if (rawW >= MIN_DRAW_PX && rawH >= MIN_DRAW_PX) {
        onPlaceField(
          (rawX / rect.width)  * 100,
          (rawY / rect.height) * 100,
          (rawW / rect.width)  * 100,
          (rawH / rect.height) * 100,
        )
      }

      setDrawing(null)
    },
    [drawing, onPlaceField]
  )

  // Cancel drawing if the mouse leaves the container mid-drag
  const handleMouseLeave = useCallback(() => setDrawing(null), [])

  // Ghost rectangle geometry (pixels, relative to container top-left)
  const ghost = drawing ? {
    x: Math.min(drawing.startX, drawing.curX),
    y: Math.min(drawing.startY, drawing.curY),
    w: Math.abs(drawing.curX - drawing.startX),
    h: Math.abs(drawing.curY - drawing.startY),
  } : null

  return (
    <div className="flex flex-col items-center">

      {/* ── Loading skeleton ───────────────────────────────────────────── */}
      {isLoading && !error && (
        <div
          className="
            animate-pulse rounded
            bg-sv-border dark:bg-sv-dark-border
          "
          style={{ width: pageWidth, height: Math.round(pageWidth * 1.414) }}
          aria-label="Loading PDF…"
        />
      )}

      {/* ── Error state ────────────────────────────────────────────────── */}
      {error && (
        <div
          className="
            flex items-center justify-center
            rounded border border-red-200 dark:border-red-800
            bg-red-50 dark:bg-red-900/20
            text-red-600 dark:text-red-400 text-sm
            p-8
          "
          style={{ width: pageWidth }}
        >
          {error}
        </div>
      )}

      {/* ── PDF Document ───────────────────────────────────────────────── */}
      <Document
        file={`/api/documents/${documentId}/file`}
        onLoadSuccess={({ numPages }) => {
          setIsLoading(false)
          onNumPagesLoaded(numPages)
        }}
        onLoadError={(err) => {
          setIsLoading(false)
          setError(`Failed to load PDF: ${err.message}`)
        }}
        // Hide the default react-pdf error UI (we handle it ourselves)
        error={null}
        loading={null}
      >
        {/* Outer container: gives react-rnd a bounded parent */}
        <div
          ref={containerRef}
          className="relative cursor-crosshair select-none"
          style={{
            width: pageWidth,
            height: pageSize.height * (pageWidth / pageSize.width),
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
        >
          {/* The rendered PDF page */}
          <Page
            pageNumber={currentPage}
            width={pageWidth}
            onRenderSuccess={() => {
              // After the page renders, record its actual dimensions
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

          {/* Field overlays — rendered on top of the PDF */}
          {pageFields.map((field) => (
            <FieldOverlay
              key={field.id}
              field={field}
              containerW={pageSize.width * (pageWidth / pageSize.width)}
              containerH={pageSize.height * (pageWidth / pageSize.width)}
              signers={signers}
              onUpdate={onUpdateField}
              onDelete={onDeleteField}
            />
          ))}

          {/* Ghost preview — SVG so we can animate the dashes (marching ants) */}
          {ghost && ghost.w > 0 && ghost.h > 0 && (
            <svg
              className="absolute pointer-events-none overflow-visible"
              style={{ left: ghost.x, top: ghost.y, width: ghost.w, height: ghost.h }}
            >
              <rect
                x={1} y={1}
                width={ghost.w - 2}
                height={ghost.h - 2}
                rx={3}
                fill={GHOST_STYLE[selectedType].fill}
                stroke={GHOST_STYLE[selectedType].stroke}
                strokeWidth={2}
                strokeDasharray="10 5"
                style={{ animation: 'march 1.8s linear infinite' }}
              />
            </svg>
          )}
        </div>
      </Document>
    </div>
  )
}
