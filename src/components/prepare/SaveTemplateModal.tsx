'use client'

/**
 * SaveTemplateModal.tsx
 *
 * A modal dialog that appears when the user clicks "Save as Template" in the
 * prepare editor. Collects a template name and optional description, then
 * calls onConfirm so the parent (PrepareEditor) can make the API call.
 */

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, BookmarkPlus, Loader2 } from 'lucide-react'

interface SaveTemplateModalProps {
  /** Called when the user clicks Save. The parent handles the actual API call. */
  onConfirm: (name: string, description: string) => Promise<void>
  /** Called when the user cancels or closes the modal. */
  onClose: () => void
}

export function SaveTemplateModal({ onConfirm, onClose }: SaveTemplateModalProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSave() {
    if (!name.trim()) {
      setError('Please enter a template name.')
      return
    }

    setSaving(true)
    setError(null)

    try {
      // onConfirm makes the API call and throws if it fails
      await onConfirm(name.trim(), description.trim())
      // Parent closes modal on success
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save template.')
      setSaving(false)
    }
  }

  return (
    // Backdrop — clicking it closes the modal
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4
                 bg-black/50 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget && !saving) onClose() }}
    >
      <AnimatePresence>
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
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-[8px] bg-sv-primary/10 dark:bg-sv-dark-primary/20
                            flex items-center justify-center flex-shrink-0">
              <BookmarkPlus className="w-4 h-4 text-sv-primary dark:text-sv-dark-primary" />
            </div>
            <div className="flex-1">
              <h2 className="text-sm font-semibold text-sv-text dark:text-sv-dark-text">
                Save as Template
              </h2>
              <p className="text-xs text-sv-secondary dark:text-sv-dark-secondary mt-0.5">
                Reuse this field layout on future documents.
              </p>
            </div>
            {/* Close button */}
            <button
              onClick={onClose}
              disabled={saving}
              className="w-7 h-7 rounded-[6px] flex items-center justify-center
                         text-sv-secondary dark:text-sv-dark-secondary
                         hover:bg-sv-border dark:hover:bg-sv-dark-border
                         transition-colors disabled:opacity-40"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Form */}
          <div className="space-y-4">
            {/* Template name */}
            <div>
              <label className="block text-xs font-medium text-sv-secondary dark:text-sv-dark-secondary mb-1.5">
                Template name <span className="text-red-500">*</span>
              </label>
              <input
                autoFocus
                type="text"
                value={name}
                onChange={(e) => { setName(e.target.value); setError(null) }}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSave() }}
                placeholder="e.g. NDA, Employment Contract…"
                maxLength={80}
                className="w-full px-3 py-2.5 text-sm rounded-[var(--radius-input)]
                           bg-sv-bg dark:bg-sv-dark-bg
                           border border-sv-border dark:border-sv-dark-border
                           text-sv-text dark:text-sv-dark-text
                           placeholder:text-sv-secondary dark:placeholder:text-sv-dark-secondary
                           focus:outline-none focus:ring-2 focus:ring-sv-primary dark:focus:ring-sv-dark-primary
                           transition"
              />
            </div>

            {/* Description (optional) */}
            <div>
              <label className="block text-xs font-medium text-sv-secondary dark:text-sv-dark-secondary mb-1.5">
                Description <span className="text-sv-secondary dark:text-sv-dark-secondary font-normal">(optional)</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What is this template used for?"
                maxLength={200}
                rows={2}
                className="w-full px-3 py-2.5 text-sm rounded-[var(--radius-input)] resize-none
                           bg-sv-bg dark:bg-sv-dark-bg
                           border border-sv-border dark:border-sv-dark-border
                           text-sv-text dark:text-sv-dark-text
                           placeholder:text-sv-secondary dark:placeholder:text-sv-dark-secondary
                           focus:outline-none focus:ring-2 focus:ring-sv-primary dark:focus:ring-sv-dark-primary
                           transition"
              />
            </div>

            {/* Error message */}
            {error && (
              <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 mt-6">
            <button
              onClick={onClose}
              disabled={saving}
              className="flex-1 py-2.5 rounded-[var(--radius-input)] text-sm font-medium
                         border border-sv-border dark:border-sv-dark-border
                         text-sv-secondary dark:text-sv-dark-secondary
                         hover:bg-sv-bg dark:hover:bg-sv-dark-bg
                         transition-colors disabled:opacity-40"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !name.trim()}
              className="flex-1 py-2.5 rounded-[var(--radius-input)] text-sm font-medium
                         bg-sv-primary dark:bg-sv-dark-primary text-white
                         hover:opacity-90 transition-opacity
                         disabled:opacity-40 flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Saving…
                </>
              ) : (
                'Save Template'
              )}
            </button>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
