'use client'

/**
 * VoidDocumentButton — cancels a document that is awaiting signatures.
 * Shows a confirmation dialog before making the API call.
 * On success, hard-navigates to /documents so the list refreshes.
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Ban, Loader2 } from 'lucide-react'
import { toast } from '@/lib/toast'

export function VoidDocumentButton({ documentId }: { documentId: string }) {
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleVoid() {
    setLoading(true)
    try {
      const res = await fetch(`/api/documents/${documentId}/void`, { method: 'POST' })
      if (res.ok) {
        toast.success('Document voided.')
        router.refresh()
      } else {
        const data = await res.json() as { error?: string }
        toast.error(data.error ?? 'Could not void document.')
      }
    } catch {
      toast.error('Network error. Please try again.')
    } finally {
      setLoading(false)
      setConfirming(false)
    }
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-sv-secondary dark:text-sv-dark-secondary">Void this document?</span>
        <button
          onClick={handleVoid}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-button)]
                     bg-red-600 hover:bg-red-700 text-white text-xs font-semibold
                     transition-colors disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
          Yes, void it
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="text-xs text-sv-secondary dark:text-sv-dark-secondary hover:underline"
        >
          Cancel
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[var(--radius-button)]
                 border border-sv-border dark:border-sv-dark-border
                 text-sv-secondary dark:text-sv-dark-secondary text-sm font-medium
                 hover:border-red-300 dark:hover:border-red-700
                 hover:text-red-600 dark:hover:text-red-400
                 transition-colors"
    >
      <Ban className="w-4 h-4" />
      Void
    </button>
  )
}
