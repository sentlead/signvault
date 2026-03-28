'use client'

/**
 * TemplatesClient.tsx — Interactive template grid
 *
 * Handles:
 *   - Displaying template cards (name, description, field count, signer roles)
 *   - "Use" button: shows a role-assignment modal, then creates a document
 *   - "Delete" button: asks for confirmation, then deletes the template
 *   - Empty state when no templates exist
 *   - Upgrade prompt when free user is at the limit
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Copy, Trash2, Play, FileText, Users, AlertCircle,
  X, Loader2, Zap
} from 'lucide-react'
import { toast } from '@/lib/toast'

// ── Types ─────────────────────────────────────────────────────────────────────

interface Template {
  id: string
  name: string
  description: string | null
  fieldCount: number
  signerRoles: { role: string }[]
  createdAt: string
}

interface TemplatesClientProps {
  templates: Template[]
  /** -1 = unlimited (Pro/Business), otherwise the max allowed for Free plan */
  planLimit: number
}

// ── UseTemplateModal ──────────────────────────────────────────────────────────
// When a template has signer roles, this modal collects the actual names/emails
// before creating the document.

interface UseTemplateModalProps {
  template: Template
  onClose: () => void
  onUse: (signers: { name: string; email: string }[]) => Promise<void>
}

function UseTemplateModal({ template, onClose, onUse }: UseTemplateModalProps) {
  // One entry per signer role in the template
  const [signers, setSigners] = useState<{ name: string; email: string }[]>(
    template.signerRoles.map(() => ({ name: '', email: '' }))
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function updateSigner(index: number, field: 'name' | 'email', value: string) {
    setSigners((prev) => {
      const updated = [...prev]
      updated[index] = { ...updated[index], [field]: value }
      return updated
    })
    setError(null)
  }

  async function handleConfirm() {
    // Validate all signers have name + valid email
    for (let i = 0; i < signers.length; i++) {
      const s = signers[i]
      if (!s.name.trim()) {
        setError(`Please enter a name for "${template.signerRoles[i].role}".`)
        return
      }
      if (!s.email.trim() || !s.email.includes('@')) {
        setError(`Please enter a valid email for "${template.signerRoles[i].role}".`)
        return
      }
    }

    setLoading(true)
    setError(null)
    try {
      await onUse(signers.map((s) => ({ name: s.name.trim(), email: s.email.trim().toLowerCase() })))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4
                 bg-black/50 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget && !loading) onClose() }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 8 }}
        transition={{ duration: 0.15 }}
        className="w-full max-w-md
                   bg-sv-surface dark:bg-sv-dark-surface
                   border border-sv-border dark:border-sv-dark-border
                   rounded-[var(--radius-card)] shadow-xl p-6"
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div>
            <h2 className="text-sm font-semibold text-sv-text dark:text-sv-dark-text">
              Use Template
            </h2>
            <p className="text-xs text-sv-secondary dark:text-sv-dark-secondary mt-0.5">
              {template.name}
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="w-7 h-7 rounded-[6px] flex items-center justify-center
                       text-sv-secondary dark:text-sv-dark-secondary
                       hover:bg-sv-border dark:hover:bg-sv-dark-border
                       transition-colors disabled:opacity-40"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Signer role inputs */}
        <div className="space-y-4">
          <p className="text-xs text-sv-secondary dark:text-sv-dark-secondary">
            Fill in the details for each signer. Fields will be pre-assigned to them automatically.
          </p>

          {template.signerRoles.map((role, index) => (
            <div key={index} className="space-y-2">
              <p className="text-xs font-semibold text-sv-text dark:text-sv-dark-text">
                {role.role}
              </p>
              <input
                type="text"
                value={signers[index]?.name ?? ''}
                onChange={(e) => updateSigner(index, 'name', e.target.value)}
                placeholder="Full name"
                className="w-full px-3 py-2 text-sm rounded-[var(--radius-input)]
                           bg-sv-bg dark:bg-sv-dark-bg
                           border border-sv-border dark:border-sv-dark-border
                           text-sv-text dark:text-sv-dark-text
                           placeholder:text-sv-secondary dark:placeholder:text-sv-dark-secondary
                           focus:outline-none focus:ring-2 focus:ring-sv-primary dark:focus:ring-sv-dark-primary"
              />
              <input
                type="email"
                value={signers[index]?.email ?? ''}
                onChange={(e) => updateSigner(index, 'email', e.target.value)}
                placeholder="email@example.com"
                className="w-full px-3 py-2 text-sm rounded-[var(--radius-input)]
                           bg-sv-bg dark:bg-sv-dark-bg
                           border border-sv-border dark:border-sv-dark-border
                           text-sv-text dark:text-sv-dark-text
                           placeholder:text-sv-secondary dark:placeholder:text-sv-dark-secondary
                           focus:outline-none focus:ring-2 focus:ring-sv-primary dark:focus:ring-sv-dark-primary"
              />
            </div>
          ))}

          {error && (
            <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
              {error}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 py-2.5 rounded-[var(--radius-input)] text-sm font-medium
                       border border-sv-border dark:border-sv-dark-border
                       text-sv-secondary dark:text-sv-dark-secondary
                       hover:bg-sv-bg dark:hover:bg-sv-dark-bg
                       transition-colors disabled:opacity-40"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="flex-1 py-2.5 rounded-[var(--radius-input)] text-sm font-medium
                       bg-sv-primary dark:bg-sv-dark-primary text-white
                       hover:opacity-90 transition-opacity
                       disabled:opacity-40 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Creating…
              </>
            ) : (
              'Use Template'
            )}
          </button>
        </div>
      </motion.div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export function TemplatesClient({ templates: initialTemplates, planLimit }: TemplatesClientProps) {
  const router = useRouter()
  const [templates, setTemplates] = useState(initialTemplates)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [usingTemplate, setUsingTemplate] = useState<Template | null>(null)

  // ── Delete a template ───────────────────────────────────────────────────
  async function handleDelete(id: string) {
    setDeletingId(id)
    try {
      const res = await fetch(`/api/templates/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Delete failed')
      setTemplates((prev) => prev.filter((t) => t.id !== id))
      toast.success('Template deleted.')
    } catch {
      toast.error('Could not delete template. Please try again.')
    } finally {
      setDeletingId(null)
      setConfirmDeleteId(null)
    }
  }

  // ── Use a template (create document from it) ────────────────────────────
  async function handleUse(template: Template, signers: { name: string; email: string }[]) {
    const res = await fetch(`/api/templates/${template.id}/use`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ signers }),
    })

    if (!res.ok) {
      const data = await res.json() as { error?: string }
      throw new Error(data.error ?? 'Failed to create document.')
    }

    const data = await res.json() as { documentId: string }
    toast.success('Document created from template!')
    router.push(`/documents/${data.documentId}/prepare`)
  }

  // ── Empty state ─────────────────────────────────────────────────────────
  if (templates.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 rounded-2xl bg-sv-primary/10 dark:bg-sv-dark-primary/20
                        flex items-center justify-center mb-4">
          <Copy className="w-7 h-7 text-sv-primary dark:text-sv-dark-primary" />
        </div>
        <h2 className="text-base font-semibold text-sv-text dark:text-sv-dark-text mb-2">
          No templates yet
        </h2>
        <p className="text-sm text-sv-secondary dark:text-sv-dark-secondary max-w-sm leading-relaxed">
          Open a document, go to the prepare step to place fields, then click{' '}
          <strong className="text-sv-text dark:text-sv-dark-text">&quot;Save as Template&quot;</strong>{' '}
          in the left toolbar.
        </p>
        <Link
          href="/documents/new"
          className="mt-6 inline-flex items-center gap-2 px-4 py-2.5 rounded-[var(--radius-button)]
                     bg-sv-primary dark:bg-sv-dark-primary text-white text-sm font-medium
                     hover:opacity-90 transition-opacity"
        >
          <FileText className="w-4 h-4" />
          Upload a Document
        </Link>
      </div>
    )
  }

  return (
    <>
      {/* ── Template grid ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence>
          {templates.map((template) => (
            <motion.div
              key={template.id}
              layout
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.15 }}
              className="relative flex flex-col
                         bg-sv-surface dark:bg-sv-dark-surface
                         border border-sv-border dark:border-sv-dark-border
                         rounded-[var(--radius-card)] p-5
                         hover:border-sv-primary/40 dark:hover:border-sv-dark-primary/40
                         transition-colors"
            >
              {/* Template icon + name */}
              <div className="flex items-start gap-3 mb-3">
                <div className="w-9 h-9 rounded-[8px] bg-sv-primary/10 dark:bg-sv-dark-primary/20
                                flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Copy className="w-4 h-4 text-sv-primary dark:text-sv-dark-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-sv-text dark:text-sv-dark-text truncate">
                    {template.name}
                  </h3>
                  {template.description && (
                    <p className="text-xs text-sv-secondary dark:text-sv-dark-secondary mt-0.5 line-clamp-2">
                      {template.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Meta: field count + signer count */}
              <div className="flex items-center gap-3 mb-4">
                <span className="flex items-center gap-1 text-xs text-sv-secondary dark:text-sv-dark-secondary">
                  <FileText className="w-3 h-3" />
                  {template.fieldCount} field{template.fieldCount !== 1 ? 's' : ''}
                </span>
                {template.signerRoles.length > 0 && (
                  <span className="flex items-center gap-1 text-xs text-sv-secondary dark:text-sv-dark-secondary">
                    <Users className="w-3 h-3" />
                    {template.signerRoles.map((r) => r.role).join(', ')}
                  </span>
                )}
              </div>

              {/* Creation date */}
              <p className="text-xs text-sv-secondary dark:text-sv-dark-secondary mb-4">
                Saved {new Date(template.createdAt).toLocaleDateString('en-GB', {
                  day: 'numeric', month: 'short', year: 'numeric',
                })}
              </p>

              {/* Actions */}
              <div className="mt-auto flex items-center gap-2">
                {/* Use button */}
                <button
                  onClick={() => {
                    if (template.signerRoles.length > 0) {
                      // Open modal to collect signer details
                      setUsingTemplate(template)
                    } else {
                      // Self-sign template — create document directly
                      handleUse(template, []).catch(() => {
                        toast.error('Could not create document. Please try again.')
                      })
                    }
                  }}
                  className="flex-1 flex items-center justify-center gap-2 py-2
                             rounded-[var(--radius-button)] text-xs font-medium
                             bg-sv-primary dark:bg-sv-dark-primary text-white
                             hover:opacity-90 transition-opacity"
                >
                  <Play className="w-3 h-3" />
                  Use Template
                </button>

                {/* Delete button — first click shows "Confirm?", second click deletes */}
                {confirmDeleteId === template.id ? (
                  <button
                    onClick={() => handleDelete(template.id)}
                    disabled={deletingId === template.id}
                    className="px-3 py-2 rounded-[var(--radius-button)] text-xs font-medium
                               bg-red-500 hover:bg-red-600 text-white
                               transition-colors disabled:opacity-50"
                  >
                    {deletingId === template.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      'Confirm?'
                    )}
                  </button>
                ) : (
                  <button
                    onClick={() => setConfirmDeleteId(template.id)}
                    className="w-8 h-8 flex items-center justify-center rounded-[var(--radius-button)]
                               border border-sv-border dark:border-sv-dark-border
                               text-sv-secondary dark:text-sv-dark-secondary
                               hover:border-red-400 hover:text-red-500 dark:hover:text-red-400
                               transition-colors"
                    aria-label="Delete template"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* ── Upgrade prompt for free users at limit ────────────────────────── */}
      {planLimit !== -1 && templates.length >= planLimit && (
        <div className="mt-6 p-4 rounded-[var(--radius-card)]
                        bg-amber-50 dark:bg-amber-900/20
                        border border-amber-200 dark:border-amber-800
                        flex items-center gap-3">
          <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
          <p className="text-xs text-amber-700 dark:text-amber-300 flex-1">
            You&apos;ve used all {planLimit} template slots on the Free plan.
          </p>
          <Link
            href="/pricing"
            className="flex-shrink-0 flex items-center gap-1 text-xs font-semibold
                       bg-amber-600 hover:bg-amber-700 text-white
                       px-3 py-1.5 rounded-[6px] transition-colors"
          >
            <Zap className="w-3 h-3" />
            Upgrade
          </Link>
        </div>
      )}

      {/* ── Use Template modal (for send-mode templates) ──────────────────── */}
      <AnimatePresence>
        {usingTemplate && (
          <UseTemplateModal
            template={usingTemplate}
            onClose={() => setUsingTemplate(null)}
            onUse={async (signers) => {
              await handleUse(usingTemplate, signers)
              setUsingTemplate(null)
            }}
          />
        )}
      </AnimatePresence>
    </>
  )
}
