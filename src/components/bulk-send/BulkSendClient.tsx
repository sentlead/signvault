'use client'

/**
 * BulkSendClient.tsx
 *
 * Handles the entire Bulk Send UI:
 *   - Upgrade prompt for non-business users
 *   - List of past bulk-send batches with progress bars
 *   - "New Bulk Send" slide-in panel with:
 *       - Template selector
 *       - Recipient entry (paste CSV or add rows manually)
 *       - Preview table
 *       - Send button
 */

import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Send,
  Plus,
  X,
  AlertCircle,
  Loader2,
  FileText,
  Users,
  CheckCircle,
  Clock,
  Upload,
  Trash2,
  ArrowRight,
  Lock,
} from 'lucide-react'
import Link from 'next/link'
import { toast } from '@/lib/toast'

// ── Types ─────────────────────────────────────────────────────────────────────

interface BulkSendItem {
  id: string
  name: string
  templateName: string
  totalCount: number
  completedCount: number
  createdAt: string
}

interface TemplateOption {
  id: string
  name: string
  signerRoleCount: number
  fieldCount: number
}

interface Recipient {
  name: string
  email: string
}

interface BulkSendClientProps {
  isBusinessPlan: boolean
  bulkSends: BulkSendItem[]
  templates: TemplateOption[]
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Parse a CSV string into an array of {name, email} rows.
 *  Accepts: "name,email" or "email,name" header rows (order-insensitive),
 *  or plain two-column CSV with no header (col 0 = name, col 1 = email).
 */
function parseCSV(raw: string): { rows: Recipient[]; error: string | null } {
  const lines = raw.trim().split(/\r?\n/).filter((l) => l.trim())
  if (lines.length === 0) return { rows: [], error: 'CSV is empty.' }

  const rows: Recipient[] = []

  // Check if first line looks like a header
  const firstLine = lines[0].toLowerCase()
  const hasHeader = firstLine.includes('name') || firstLine.includes('email')
  const startIndex = hasHeader ? 1 : 0

  // Detect column order from header (default: name=0, email=1)
  let nameCol = 0
  let emailCol = 1
  if (hasHeader) {
    const headerCols = lines[0].split(',').map((c) => c.trim().toLowerCase())
    const nameIdx = headerCols.findIndex((c) => c === 'name')
    const emailIdx = headerCols.findIndex((c) => c.includes('email'))
    if (emailIdx !== -1) emailCol = emailIdx
    if (nameIdx !== -1) nameCol = nameIdx
  }

  for (let i = startIndex; i < lines.length; i++) {
    const cols = lines[i].split(',').map((c) => c.trim().replace(/^"|"$/g, ''))
    const name  = cols[nameCol]  ?? ''
    const email = cols[emailCol] ?? ''
    if (!name && !email) continue  // skip blank lines
    rows.push({ name, email })
  }

  if (rows.length === 0) return { rows: [], error: 'No valid rows found in CSV.' }
  return { rows, error: null }
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

// ── Upgrade prompt ─────────────────────────────────────────────────────────────

function UpgradePrompt() {
  return (
    <div className="text-center py-16 px-6">
      <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/30
                      flex items-center justify-center mx-auto mb-5">
        <Lock className="w-8 h-8 text-amber-600 dark:text-amber-400" />
      </div>
      <h2 className="text-xl font-bold text-sv-text dark:text-sv-dark-text mb-2">
        Bulk Send is a Business feature
      </h2>
      <p className="text-sm text-sv-secondary dark:text-sv-dark-secondary mb-8 max-w-sm mx-auto leading-relaxed">
        Send the same document to hundreds of recipients at once — each gets their own
        personalised signing link. Upgrade to Business to unlock Bulk Send.
      </p>
      <Link
        href="/pricing"
        className="inline-flex items-center gap-2 px-6 py-3 rounded-[var(--radius-button)]
                   bg-sv-primary dark:bg-sv-dark-primary text-white text-sm font-semibold
                   hover:opacity-90 transition-opacity"
      >
        <ArrowRight className="w-4 h-4" />
        View Pricing Plans
      </Link>
    </div>
  )
}

// ── New Bulk Send panel ────────────────────────────────────────────────────────

interface NewBulkSendPanelProps {
  templates: TemplateOption[]
  onClose: () => void
  onSuccess: (item: BulkSendItem) => void
}

function NewBulkSendPanel({ templates, onClose, onSuccess }: NewBulkSendPanelProps) {
  // Setup step state
  const [batchName, setBatchName] = useState('')
  const [templateId, setTemplateId] = useState(templates[0]?.id ?? '')
  const [csvText, setCsvText] = useState('')
  const [csvError, setCsvError] = useState<string | null>(null)
  const [parsedRecipients, setParsedRecipients] = useState<Recipient[]>([])

  // Manual row input
  const [manualName, setManualName] = useState('')
  const [manualEmail, setManualEmail] = useState('')

  // Sending state
  const [isSending, setIsSending] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const selectedTemplate = templates.find((t) => t.id === templateId)

  // ── Add manual row ─────────────────────────────────────────────────────
  function addManualRow() {
    if (!manualName.trim()) return
    if (!manualEmail.trim() || !manualEmail.includes('@')) return
    setParsedRecipients((prev) => [
      ...prev,
      { name: manualName.trim(), email: manualEmail.trim().toLowerCase() },
    ])
    setManualName('')
    setManualEmail('')
  }

  // ── Remove a row ───────────────────────────────────────────────────────
  function removeRow(index: number) {
    setParsedRecipients((prev) => prev.filter((_, i) => i !== index))
  }

  // ── Parse pasted CSV ───────────────────────────────────────────────────
  function handleCSVPaste() {
    setCsvError(null)
    if (!csvText.trim()) return
    const { rows, error } = parseCSV(csvText)
    if (error) {
      setCsvError(error)
      return
    }
    setParsedRecipients((prev) => {
      // Deduplicate by email
      const existing = new Set(prev.map((r) => r.email.toLowerCase()))
      const newRows = rows.filter((r) => !existing.has(r.email.toLowerCase()))
      return [...prev, ...newRows]
    })
    setCsvText('')
    toast.success(`Added ${rows.length} recipient${rows.length !== 1 ? 's' : ''} from CSV`)
  }

  // ── Upload CSV file ────────────────────────────────────────────────────
  function handleCSVFile(file: File) {
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      setCsvError(null)
      const { rows, error } = parseCSV(text)
      if (error) { setCsvError(error); return }
      setParsedRecipients((prev) => {
        const existing = new Set(prev.map((r) => r.email.toLowerCase()))
        const newRows = rows.filter((r) => !existing.has(r.email.toLowerCase()))
        return [...prev, ...newRows]
      })
      toast.success(`Added ${rows.length} recipient${rows.length !== 1 ? 's' : ''} from file`)
    }
    reader.readAsText(file)
  }

  // ── Send the batch ─────────────────────────────────────────────────────
  async function handleSend() {
    setSendError(null)
    setIsSending(true)
    try {
      const res = await fetch('/api/bulk-send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId,
          name: batchName.trim() || `${selectedTemplate?.name ?? 'Batch'} — ${new Date().toLocaleDateString()}`,
          recipients: parsedRecipients,
        }),
      })
      const data = await res.json() as { bulkSendId?: string; count?: number; error?: string }
      if (!res.ok) {
        setSendError(data.error ?? 'Something went wrong.')
        return
      }
      toast.success(`Sent to ${data.count} recipient${(data.count ?? 0) !== 1 ? 's' : ''}!`)
      onSuccess({
        id: data.bulkSendId!,
        name: batchName.trim() || `${selectedTemplate?.name ?? 'Batch'} — ${new Date().toLocaleDateString()}`,
        templateName: selectedTemplate?.name ?? '',
        totalCount: data.count!,
        completedCount: 0,
        createdAt: new Date().toISOString(),
      })
    } catch {
      setSendError('Network error. Please try again.')
    } finally {
      setIsSending(false)
    }
  }

  const canProceed = templateId && parsedRecipients.length > 0

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 40 }}
      transition={{ duration: 0.2 }}
      className="
        fixed inset-y-0 right-0 z-50
        w-full max-w-lg
        bg-sv-surface dark:bg-sv-dark-surface
        border-l border-sv-border dark:border-sv-dark-border
        flex flex-col shadow-2xl
        overflow-hidden
      "
    >
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-6 py-4
                      border-b border-sv-border dark:border-sv-dark-border flex-shrink-0">
        <div>
          <h2 className="text-base font-bold text-sv-text dark:text-sv-dark-text">
            New Bulk Send
          </h2>
          <p className="text-xs text-sv-secondary dark:text-sv-dark-secondary mt-0.5">
            Choose a template and add recipients
          </p>
        </div>
        <button
          onClick={onClose}
          disabled={isSending}
          className="w-8 h-8 rounded-[6px] flex items-center justify-center
                     text-sv-secondary dark:text-sv-dark-secondary
                     hover:bg-sv-border dark:hover:bg-sv-dark-border
                     transition-colors disabled:opacity-40"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* ── Body ────────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">

        {/* Batch name */}
        <div>
          <label className="block text-xs font-semibold text-sv-text dark:text-sv-dark-text mb-1.5">
            Batch Name <span className="text-sv-secondary dark:text-sv-dark-secondary font-normal">(optional)</span>
          </label>
          <input
            type="text"
            value={batchName}
            onChange={(e) => setBatchName(e.target.value)}
            placeholder="e.g. Q1 NDA Batch, April Contracts…"
            className="w-full px-3 py-2 text-sm rounded-[var(--radius-input)]
                       bg-sv-bg dark:bg-sv-dark-bg border border-sv-border dark:border-sv-dark-border
                       text-sv-text dark:text-sv-dark-text
                       placeholder:text-sv-secondary dark:placeholder:text-sv-dark-secondary
                       focus:outline-none focus:ring-2 focus:ring-sv-primary dark:focus:ring-sv-dark-primary"
          />
        </div>

        {/* Template selector */}
        <div>
          <label className="block text-xs font-semibold text-sv-text dark:text-sv-dark-text mb-1.5">
            Template <span className="text-red-500">*</span>
          </label>
          {templates.length === 0 ? (
            <div className="flex items-start gap-2 p-3 rounded-[var(--radius-input)]
                            bg-amber-50 dark:bg-amber-900/20
                            border border-amber-200 dark:border-amber-800">
              <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-medium text-amber-800 dark:text-amber-300">
                  No eligible templates
                </p>
                <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5 leading-relaxed">
                  Bulk Send needs a single-signer template. Go to the prepare step on any
                  document, place fields, and click &quot;Save as Template&quot;.
                </p>
                <Link
                  href="/documents/new"
                  className="inline-flex items-center gap-1 mt-2 text-xs font-medium
                             text-amber-700 dark:text-amber-300 hover:underline"
                >
                  Create a template <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          ) : (
            <select
              value={templateId}
              onChange={(e) => setTemplateId(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-[var(--radius-input)]
                         bg-sv-bg dark:bg-sv-dark-bg border border-sv-border dark:border-sv-dark-border
                         text-sv-text dark:text-sv-dark-text
                         focus:outline-none focus:ring-2 focus:ring-sv-primary dark:focus:ring-sv-dark-primary"
            >
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} — {t.fieldCount} field{t.fieldCount !== 1 ? 's' : ''}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* ── Recipient input ──────────────────────────────────────────── */}
        <div>
          <label className="block text-xs font-semibold text-sv-text dark:text-sv-dark-text mb-3">
            Recipients <span className="text-red-500">*</span>
          </label>

          {/* Manual add row */}
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={manualName}
              onChange={(e) => setManualName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addManualRow() } }}
              placeholder="Full name"
              className="flex-1 px-3 py-2 text-sm rounded-[var(--radius-input)]
                         bg-sv-bg dark:bg-sv-dark-bg border border-sv-border dark:border-sv-dark-border
                         text-sv-text dark:text-sv-dark-text
                         placeholder:text-sv-secondary dark:placeholder:text-sv-dark-secondary
                         focus:outline-none focus:ring-2 focus:ring-sv-primary dark:focus:ring-sv-dark-primary"
            />
            <input
              type="email"
              value={manualEmail}
              onChange={(e) => setManualEmail(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addManualRow() } }}
              placeholder="email@example.com"
              className="flex-1 px-3 py-2 text-sm rounded-[var(--radius-input)]
                         bg-sv-bg dark:bg-sv-dark-bg border border-sv-border dark:border-sv-dark-border
                         text-sv-text dark:text-sv-dark-text
                         placeholder:text-sv-secondary dark:placeholder:text-sv-dark-secondary
                         focus:outline-none focus:ring-2 focus:ring-sv-primary dark:focus:ring-sv-dark-primary"
            />
            <button
              onClick={addManualRow}
              disabled={!manualName.trim() || !manualEmail.includes('@')}
              className="w-9 h-9 flex-shrink-0 rounded-[var(--radius-input)] flex items-center justify-center
                         bg-sv-primary dark:bg-sv-dark-primary text-white
                         hover:opacity-90 transition-opacity disabled:opacity-40"
              aria-label="Add recipient"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* CSV paste area */}
          <div className="mt-3 space-y-2">
            <p className="text-xs text-sv-secondary dark:text-sv-dark-secondary">
              Or paste a CSV (columns: name, email):
            </p>
            <textarea
              value={csvText}
              onChange={(e) => { setCsvText(e.target.value); setCsvError(null) }}
              placeholder={"name,email\nJane Smith,jane@example.com\nJohn Doe,john@example.com"}
              rows={3}
              className="w-full px-3 py-2 text-xs font-mono rounded-[var(--radius-input)]
                         bg-sv-bg dark:bg-sv-dark-bg border border-sv-border dark:border-sv-dark-border
                         text-sv-text dark:text-sv-dark-text
                         placeholder:text-sv-secondary dark:placeholder:text-sv-dark-secondary
                         focus:outline-none focus:ring-2 focus:ring-sv-primary dark:focus:ring-sv-dark-primary
                         resize-none"
            />
            <div className="flex gap-2">
              <button
                onClick={handleCSVPaste}
                disabled={!csvText.trim()}
                className="flex-1 py-1.5 rounded-[var(--radius-button)] text-xs font-medium
                           border border-sv-border dark:border-sv-dark-border
                           text-sv-secondary dark:text-sv-dark-secondary
                           hover:border-sv-primary dark:hover:border-sv-dark-primary
                           hover:text-sv-primary dark:hover:text-sv-dark-primary
                           disabled:opacity-40 transition-colors"
              >
                Add from paste
              </button>
              {/* Upload CSV file button */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 py-1.5 rounded-[var(--radius-button)] text-xs font-medium
                           border border-sv-border dark:border-sv-dark-border
                           text-sv-secondary dark:text-sv-dark-secondary
                           hover:border-sv-primary dark:hover:border-sv-dark-primary
                           hover:text-sv-primary dark:hover:text-sv-dark-primary
                           flex items-center justify-center gap-1 transition-colors"
              >
                <Upload className="w-3 h-3" />
                Upload .csv file
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleCSVFile(file)
                  e.target.value = ''
                }}
              />
            </div>
            {csvError && (
              <p className="text-xs text-red-500 dark:text-red-400 flex items-center gap-1.5">
                <AlertCircle className="w-3 h-3 flex-shrink-0" />
                {csvError}
              </p>
            )}
          </div>
        </div>

        {/* ── Recipients preview table ─────────────────────────────────── */}
        {parsedRecipients.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-sv-text dark:text-sv-dark-text">
                Recipients ({parsedRecipients.length})
              </p>
              <button
                onClick={() => setParsedRecipients([])}
                className="text-xs text-sv-secondary dark:text-sv-dark-secondary
                           hover:text-red-500 dark:hover:text-red-400 transition-colors"
              >
                Clear all
              </button>
            </div>
            <div className="border border-sv-border dark:border-sv-dark-border
                            rounded-[var(--radius-card)] overflow-hidden max-h-60 overflow-y-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-sv-bg dark:bg-sv-dark-bg border-b border-sv-border dark:border-sv-dark-border">
                    <th className="px-3 py-2 text-left font-medium text-sv-secondary dark:text-sv-dark-secondary w-1/2">Name</th>
                    <th className="px-3 py-2 text-left font-medium text-sv-secondary dark:text-sv-dark-secondary">Email</th>
                    <th className="w-8" />
                  </tr>
                </thead>
                <tbody>
                  {parsedRecipients.map((r, i) => (
                    <tr
                      key={i}
                      className="border-b border-sv-border dark:border-sv-dark-border last:border-0
                                 hover:bg-sv-bg dark:hover:bg-sv-dark-bg transition-colors"
                    >
                      <td className="px-3 py-2 text-sv-text dark:text-sv-dark-text truncate max-w-[140px]">
                        {r.name || <span className="text-red-400 italic">missing</span>}
                      </td>
                      <td className="px-3 py-2 text-sv-secondary dark:text-sv-dark-secondary truncate">
                        {r.email || <span className="text-red-400 italic">missing</span>}
                      </td>
                      <td className="px-2 py-1">
                        <button
                          onClick={() => removeRow(i)}
                          className="w-6 h-6 rounded flex items-center justify-center
                                     text-sv-secondary dark:text-sv-dark-secondary
                                     hover:text-red-500 dark:hover:text-red-400
                                     hover:bg-red-50 dark:hover:bg-red-900/20
                                     transition-colors"
                          aria-label="Remove"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Error message */}
        {sendError && (
          <div className="flex items-start gap-2 p-3 rounded-[var(--radius-input)]
                          bg-red-50 dark:bg-red-900/20
                          border border-red-200 dark:border-red-800">
            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-red-600 dark:text-red-400">{sendError}</p>
          </div>
        )}
      </div>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <div className="flex-shrink-0 px-6 py-4
                      border-t border-sv-border dark:border-sv-dark-border
                      flex gap-3">
        <button
          onClick={onClose}
          disabled={isSending}
          className="flex-1 py-2.5 rounded-[var(--radius-button)] text-sm font-medium
                     border border-sv-border dark:border-sv-dark-border
                     text-sv-secondary dark:text-sv-dark-secondary
                     hover:bg-sv-bg dark:hover:bg-sv-dark-bg transition-colors
                     disabled:opacity-40"
        >
          Cancel
        </button>
        <button
          onClick={handleSend}
          disabled={!canProceed || isSending || templates.length === 0}
          className="flex-1 py-2.5 rounded-[var(--radius-button)] text-sm font-semibold
                     bg-sv-primary dark:bg-sv-dark-primary text-white
                     hover:opacity-90 transition-opacity
                     flex items-center justify-center gap-2
                     disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isSending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Sending…
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              Send {parsedRecipients.length > 0 ? `(${parsedRecipients.length})` : ''}
            </>
          )}
        </button>
      </div>
    </motion.div>
  )
}

// ── Batch progress card ────────────────────────────────────────────────────────

function BulkSendCard({ item }: { item: BulkSendItem }) {
  const pct = item.totalCount === 0 ? 0 : Math.round((item.completedCount / item.totalCount) * 100)
  const allDone = item.completedCount === item.totalCount

  return (
    <div className="p-5 rounded-[var(--radius-card)]
                    bg-sv-surface dark:bg-sv-dark-surface
                    border border-sv-border dark:border-sv-dark-border
                    hover:border-sv-primary/40 dark:hover:border-sv-dark-primary/40
                    transition-colors">
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className={`w-10 h-10 rounded-[10px] flex items-center justify-center flex-shrink-0
          ${allDone
            ? 'bg-emerald-50 dark:bg-emerald-900/30'
            : 'bg-sv-primary/10 dark:bg-sv-dark-primary/20'
          }`}>
          {allDone
            ? <CheckCircle className="w-5 h-5 text-emerald-500" />
            : <Clock className="w-5 h-5 text-sv-primary dark:text-sv-dark-primary" />
          }
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-semibold text-sv-text dark:text-sv-dark-text truncate">
              {item.name}
            </p>
            <span className={`flex-shrink-0 text-xs font-medium px-2 py-0.5 rounded-full ${
              allDone
                ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400'
                : 'bg-sv-primary/10 dark:bg-sv-dark-primary/20 text-sv-primary dark:text-sv-dark-primary'
            }`}>
              {allDone ? 'Complete' : 'In progress'}
            </span>
          </div>
          <p className="text-xs text-sv-secondary dark:text-sv-dark-secondary mt-0.5">
            Template: {item.templateName} · {formatDate(item.createdAt)}
          </p>

          {/* Progress bar */}
          <div className="mt-3">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs text-sv-secondary dark:text-sv-dark-secondary flex items-center gap-1">
                <Users className="w-3 h-3" />
                {item.completedCount} / {item.totalCount} signed
              </span>
              <span className="text-xs font-medium text-sv-text dark:text-sv-dark-text">
                {pct}%
              </span>
            </div>
            <div className="w-full h-1.5 bg-sv-border dark:bg-sv-dark-border rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  allDone ? 'bg-emerald-500' : 'bg-sv-primary dark:bg-sv-dark-primary'
                }`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────

export function BulkSendClient({ isBusinessPlan, bulkSends: initialBulkSends, templates }: BulkSendClientProps) {
  const [bulkSends, setBulkSends] = useState<BulkSendItem[]>(initialBulkSends)
  const [showPanel, setShowPanel] = useState(false)

  if (!isBusinessPlan) {
    return (
      <div>
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-sv-text dark:text-sv-dark-text">Bulk Send</h1>
          <p className="text-sm text-sv-secondary dark:text-sv-dark-secondary mt-1">
            Send the same document to many recipients at once.
          </p>
        </div>
        <UpgradePrompt />
      </div>
    )
  }

  return (
    <div>
      {/* ── Page header ────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-sv-text dark:text-sv-dark-text">Bulk Send</h1>
          <p className="text-sm text-sv-secondary dark:text-sv-dark-secondary mt-1">
            Send the same document to many recipients at once.
          </p>
        </div>
        <button
          onClick={() => setShowPanel(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-[var(--radius-button)]
                     bg-sv-primary dark:bg-sv-dark-primary text-white text-sm font-semibold
                     hover:opacity-90 transition-opacity shadow-sm"
        >
          <Plus className="w-4 h-4" />
          New Bulk Send
        </button>
      </div>

      {/* ── How it works (info box, shown when no sends yet) ────────────── */}
      {bulkSends.length === 0 && (
        <div className="mb-6 p-4 rounded-[var(--radius-card)]
                        bg-sv-primary/5 dark:bg-sv-dark-primary/10
                        border border-sv-primary/20 dark:border-sv-dark-primary/30">
          <p className="text-xs text-sv-text dark:text-sv-dark-text leading-relaxed">
            <span className="font-semibold">How Bulk Send works:</span>{' '}
            Pick one of your saved templates, add a list of recipients (or upload a CSV), then hit Send.
            Each recipient gets their own personalised document and signing link.
          </p>
        </div>
      )}

      {/* ── Batch history ──────────────────────────────────────────────── */}
      {bulkSends.length > 0 ? (
        <div className="space-y-3">
          {bulkSends.map((item) => (
            <BulkSendCard key={item.id} item={item} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <div className="w-14 h-14 rounded-full bg-sv-border dark:bg-sv-dark-border
                          flex items-center justify-center mx-auto mb-4">
            <FileText className="w-7 h-7 text-sv-secondary dark:text-sv-dark-secondary" />
          </div>
          <p className="text-sm font-medium text-sv-text dark:text-sv-dark-text mb-1">
            No bulk sends yet
          </p>
          <p className="text-xs text-sv-secondary dark:text-sv-dark-secondary mb-5">
            Click &quot;New Bulk Send&quot; to get started.
          </p>
          <button
            onClick={() => setShowPanel(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-[var(--radius-button)]
                       bg-sv-primary dark:bg-sv-dark-primary text-white text-sm font-medium
                       hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4" />
            New Bulk Send
          </button>
        </div>
      )}

      {/* ── Slide-in panel ──────────────────────────────────────────────── */}
      <AnimatePresence>
        {showPanel && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-black/40"
              onClick={() => setShowPanel(false)}
            />
            <NewBulkSendPanel
              key="panel"
              templates={templates}
              onClose={() => setShowPanel(false)}
              onSuccess={(newItem) => {
                setBulkSends((prev) => [newItem, ...prev])
                setShowPanel(false)
              }}
            />
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
