'use client'

/**
 * DocumentList.tsx — Document List with Status Filters (Client Component)
 *
 * Accepts a list of documents from the server and renders:
 *   - Status filter tabs: All, Drafts, Awaiting, Completed
 *   - Document rows (table-like on desktop, cards on mobile)
 *   - Color-coded status badges
 *   - Action buttons: View and Delete
 *   - Skeleton loading state
 *   - EmptyState when filtered list is empty
 *
 * Props:
 *   documents — array of Document records from Prisma
 *   loading   — optional, shows skeleton rows while fetching
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { FileText, Eye, Trash2 } from 'lucide-react'
import { EmptyState } from './EmptyState'
import { toast } from '@/lib/toast'

// Type that matches the Prisma Document model fields we need
export interface DocumentItem {
  id: string
  name: string
  status: string
  createdAt: Date
}

interface DocumentListProps {
  documents: DocumentItem[]
  loading?: boolean
}

// Status filter tab definitions
const TABS = [
  { key: 'all', label: 'All' },
  { key: 'draft', label: 'Drafts' },
  { key: 'awaiting_signatures', label: 'Awaiting' },
  { key: 'completed', label: 'Completed' },
] as const

type TabKey = (typeof TABS)[number]['key']

// Returns Tailwind classes for the status badge based on status string
function statusBadgeClasses(status: string): string {
  switch (status) {
    case 'draft':
      return 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
    case 'awaiting_signatures':
      return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
    case 'completed':
      return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
    default:
      return 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
  }
}

// Human-readable label for each status
function statusLabel(status: string): string {
  switch (status) {
    case 'draft': return 'Draft'
    case 'awaiting_signatures': return 'Awaiting'
    case 'completed': return 'Completed'
    default: return status
  }
}

// Format a date as "Mar 24, 2026"
function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

// Skeleton row shown while data is loading
function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 p-4 animate-pulse">
      <div className="w-8 h-8 rounded-[8px] bg-sv-border dark:bg-sv-dark-border flex-shrink-0" />
      <div className="flex-1 space-y-1.5">
        <div className="h-3.5 w-48 bg-sv-border dark:bg-sv-dark-border rounded" />
        <div className="h-3 w-24 bg-sv-border dark:bg-sv-dark-border rounded" />
      </div>
      <div className="hidden md:block h-5 w-16 bg-sv-border dark:bg-sv-dark-border rounded-full" />
      <div className="hidden md:block h-3 w-20 bg-sv-border dark:bg-sv-dark-border rounded" />
      <div className="flex gap-2">
        <div className="w-8 h-8 rounded-[8px] bg-sv-border dark:bg-sv-dark-border" />
        <div className="w-8 h-8 rounded-[8px] bg-sv-border dark:bg-sv-dark-border" />
      </div>
    </div>
  )
}

export function DocumentList({ documents, loading = false }: DocumentListProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<TabKey>('all')
  // Track which document is being deleted (shows a loading state on that row)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Filter documents based on active tab
  const filtered = documents.filter((doc) => {
    if (activeTab === 'all') return true
    return doc.status === activeTab
  })

  // Handle document deletion
  async function handleDelete(id: string) {
    if (!confirm('Delete this document? This cannot be undone.')) return
    setDeletingId(id)
    try {
      const res = await fetch(`/api/documents/${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Document deleted.')
        // Refresh the page to reflect the deletion
        router.refresh()
      } else {
        toast.error('Could not delete document.')
      }
    } catch {
      toast.error('Could not delete document.')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="bg-sv-surface dark:bg-sv-dark-surface
                    border border-sv-border dark:border-sv-dark-border
                    rounded-[var(--radius-card)] overflow-hidden">

      {/* ── Filter tabs ──────────────────────────────────────────────────── */}
      <div className="flex items-center border-b border-sv-border dark:border-sv-dark-border
                      overflow-x-auto scrollbar-none">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`relative flex-shrink-0 px-4 py-3 text-sm font-medium transition-colors
              ${activeTab === tab.key
                ? 'text-sv-primary dark:text-sv-dark-primary'
                : 'text-sv-secondary dark:text-sv-dark-secondary hover:text-sv-text dark:hover:text-sv-dark-text'
              }`}
          >
            {tab.label}
            {/* Animated underline indicator for active tab */}
            {activeTab === tab.key && (
              <motion.div
                layoutId="tab-underline"
                className="absolute bottom-0 left-0 right-0 h-0.5
                           bg-sv-primary dark:bg-sv-dark-primary"
              />
            )}
          </button>
        ))}
      </div>

      {/* ── Document rows ────────────────────────────────────────────────── */}
      {loading ? (
        // Show 3 skeleton rows while loading
        <div className="divide-y divide-sv-border dark:divide-sv-dark-border">
          <SkeletonRow />
          <SkeletonRow />
          <SkeletonRow />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="divide-y divide-sv-border dark:divide-sv-dark-border">
          <AnimatePresence mode="popLayout">
            {filtered.map((doc) => (
              <motion.div
                key={doc.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className={`flex items-center gap-4 p-4 group
                  hover:bg-sv-bg dark:hover:bg-sv-dark-bg transition-colors
                  ${deletingId === doc.id ? 'opacity-50 pointer-events-none' : ''}`}
              >
                {/* Document icon */}
                <div className="w-9 h-9 rounded-[8px] flex-shrink-0
                                bg-sv-primary/10 dark:bg-sv-dark-primary/20
                                flex items-center justify-center">
                  <FileText className="w-4 h-4 text-sv-primary dark:text-sv-dark-primary" />
                </div>

                {/* Name (and date on mobile) */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-sv-text dark:text-sv-dark-text truncate">
                    {doc.name}
                  </p>
                  {/* Show date inline on mobile */}
                  <p className="text-xs text-sv-secondary dark:text-sv-dark-secondary md:hidden">
                    {formatDate(doc.createdAt)}
                  </p>
                </div>

                {/* Status badge (hidden on mobile, shown inline above) */}
                <span className={`hidden md:inline-flex items-center px-2.5 py-0.5
                                  rounded-full text-xs font-medium
                                  ${statusBadgeClasses(doc.status)}`}>
                  {statusLabel(doc.status)}
                </span>

                {/* Date (desktop only) */}
                <span className="hidden md:block text-xs text-sv-secondary dark:text-sv-dark-secondary
                                 whitespace-nowrap min-w-[90px]">
                  {formatDate(doc.createdAt)}
                </span>

                {/* Action buttons — fade in on row hover via group-hover */}
                <div className="flex items-center gap-1.5
                                opacity-0 group-hover:opacity-100
                                transition-opacity duration-150">
                  {/* View button */}
                  <Link
                    href={`/documents/${doc.id}`}
                    className="w-8 h-8 rounded-[8px] flex items-center justify-center
                               text-sv-secondary dark:text-sv-dark-secondary
                               hover:bg-sv-border dark:hover:bg-sv-dark-border
                               hover:text-sv-text dark:hover:text-sv-dark-text
                               transition-colors focus-visible:ring-2 focus-visible:ring-sv-primary"
                    aria-label={`View ${doc.name}`}
                  >
                    <Eye className="w-4 h-4" />
                  </Link>

                  {/* Delete button */}
                  <button
                    onClick={() => handleDelete(doc.id)}
                    className="w-8 h-8 rounded-[8px] flex items-center justify-center
                               text-sv-secondary dark:text-sv-dark-secondary
                               hover:bg-red-50 dark:hover:bg-red-900/20
                               hover:text-red-500 dark:hover:text-red-400
                               transition-colors focus-visible:ring-2 focus-visible:ring-red-400"
                    aria-label={`Delete ${doc.name}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
