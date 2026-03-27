'use client'

/**
 * documents/new/page.tsx — Document Upload Page (Client Component)
 *
 * A two-step flow for uploading a document:
 *
 * Step 1 — File selection:
 *   - Drag-and-drop zone (react-dropzone)
 *   - Only accepts PDF files up to 10MB
 *   - Shows a file preview card after selection
 *   - Animated progress bar during upload
 *   - Error messages for wrong file type or size
 *
 * Step 2 — Upload:
 *   - POST the file to /api/documents/upload
 *   - On success, redirect to /documents/[id] (Phase 4 will build that)
 */

import { useCallback, useState } from 'react'
import { useDropzone, FileRejection } from 'react-dropzone'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  UploadCloud,
  FileText,
  X,
  AlertCircle,
  CheckCircle,
  ArrowLeft,
} from 'lucide-react'
import { toast } from '@/lib/toast'

// Max file size: 10 MB
const MAX_SIZE_BYTES = 10 * 1024 * 1024

// Format bytes into a human-readable string (e.g. "2.4 MB", "840 KB")
function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  return `${Math.round(bytes / 1024)} KB`
}

export default function NewDocumentPage() {
  const router = useRouter()

  // The selected file (null = nothing selected yet)
  const [file, setFile] = useState<File | null>(null)
  // Validation error message
  const [error, setError] = useState<string | null>(null)
  // Upload progress 0–100
  const [progress, setProgress] = useState(0)
  // Current state: idle | uploading | success | error
  const [uploadState, setUploadState] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle')

  // Called when the user drops or selects a file
  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
    setError(null)
    setFile(null)
    setProgress(0)
    setUploadState('idle')

    // Handle rejected files
    if (rejectedFiles.length > 0) {
      const firstError = rejectedFiles[0]?.errors[0]
      if (firstError?.code === 'file-too-large') {
        setError(`File is too large. Maximum size is 10 MB.`)
      } else if (firstError?.code === 'file-invalid-type') {
        setError(`Only PDF files are accepted. Please select a .pdf file.`)
      } else {
        setError(`File could not be added. Please try again.`)
      }
      return
    }

    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0])
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    maxSize: MAX_SIZE_BYTES,
    multiple: false,
  })

  // Handle the "Continue" button — upload the file
  async function handleUpload() {
    if (!file) return

    setUploadState('uploading')
    setProgress(0)
    setError(null)

    // Simulate progress ticking up while the upload happens
    // (gives visual feedback even before we hear back from the server)
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 85) {
          clearInterval(progressInterval)
          return prev
        }
        return prev + Math.random() * 12
      })
    }, 200)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData,
      })

      clearInterval(progressInterval)

      if (!res.ok) {
        const data = (await res.json()) as { error?: string }
        throw new Error(data.error ?? 'Upload failed')
      }

      const data = (await res.json()) as { documentId: string; name: string }

      // Jump progress to 100% then redirect
      setProgress(100)
      setUploadState('success')
      toast.success('Document uploaded!')

      // Short delay so user sees the 100% complete state
      setTimeout(() => {
        // Go straight to the prepare step so the user can place fields
        router.push(`/documents/${data.documentId}/prepare`)
      }, 600)
    } catch (err) {
      clearInterval(progressInterval)
      setUploadState('error')
      setProgress(0)
      const message = err instanceof Error ? err.message : 'Upload failed. Please try again.'
      setError(message)
      toast.error('Upload failed. Please try again.')
    }
  }

  // Border/bg colour for the dropzone based on state
  const dropzoneClasses = [
    'relative flex flex-col items-center justify-center gap-3',
    'rounded-[var(--radius-card)] border-2 border-dashed',
    'min-h-[220px] px-6 py-10 text-center transition-all duration-200 cursor-pointer',
    isDragReject
      ? 'border-red-400 bg-red-50 dark:bg-red-900/10'
      : isDragActive
      ? 'border-sv-primary dark:border-sv-dark-primary bg-sv-primary/5 dark:bg-sv-dark-primary/10 scale-[1.01]'
      : file
      ? 'border-emerald-400 dark:border-emerald-600 bg-emerald-50/50 dark:bg-emerald-900/10'
      : 'border-sv-border dark:border-sv-dark-border bg-sv-surface dark:bg-sv-dark-surface hover:border-sv-primary dark:hover:border-sv-dark-primary hover:bg-sv-primary/5 dark:hover:bg-sv-dark-primary/10',
  ].join(' ')

  const isUploading = uploadState === 'uploading'
  const canUpload = !!file && uploadState === 'idle'

  return (
    <div className="max-w-xl mx-auto py-8 px-4">

      {/* ── Back link ─────────────────────────────────────────────────────── */}
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm text-sv-secondary dark:text-sv-dark-secondary
                   hover:text-sv-text dark:hover:text-sv-dark-text transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Dashboard
      </Link>

      {/* ── Page title ────────────────────────────────────────────────────── */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-sv-text dark:text-sv-dark-text">
          Upload Document
        </h1>
        <p className="text-sm text-sv-secondary dark:text-sv-dark-secondary mt-1">
          Upload a PDF to sign or send for signature. Max 10 MB.
        </p>
      </div>

      {/* ── Dropzone ─────────────────────────────────────────────────────── */}
      <div {...getRootProps({ className: dropzoneClasses })}>
        <input {...getInputProps()} />

        {isDragReject ? (
          <>
            <AlertCircle className="w-10 h-10 text-red-400" />
            <p className="text-sm font-medium text-red-500">Only PDF files are accepted</p>
          </>
        ) : isDragActive ? (
          <>
            <UploadCloud className="w-10 h-10 text-sv-primary dark:text-sv-dark-primary animate-bounce" />
            <p className="text-sm font-medium text-sv-primary dark:text-sv-dark-primary">
              Drop your PDF here
            </p>
          </>
        ) : file ? (
          <>
            <CheckCircle className="w-10 h-10 text-emerald-500" />
            <p className="text-sm font-medium text-sv-text dark:text-sv-dark-text">
              File selected — ready to upload
            </p>
            <p className="text-xs text-sv-secondary dark:text-sv-dark-secondary">
              Click or drag to replace
            </p>
          </>
        ) : (
          <>
            <UploadCloud className="w-10 h-10 text-sv-secondary dark:text-sv-dark-secondary" />
            <div>
              <p className="text-sm font-medium text-sv-text dark:text-sv-dark-text">
                Drag & drop your PDF here
              </p>
              <p className="text-xs text-sv-secondary dark:text-sv-dark-secondary mt-1">
                or{' '}
                <span className="text-sv-primary dark:text-sv-dark-primary underline underline-offset-2">
                  browse files
                </span>
              </p>
            </div>
            <p className="text-xs text-sv-secondary dark:text-sv-dark-secondary">
              PDF only · max 10 MB
            </p>
          </>
        )}
      </div>

      {/* ── Validation error ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="mt-3 flex items-start gap-2 text-sm text-red-500 dark:text-red-400"
          >
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── File preview card ────────────────────────────────────────────── */}
      <AnimatePresence>
        {file && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="mt-4 flex items-center gap-3 p-4 rounded-[var(--radius-card)]
                       bg-sv-bg dark:bg-sv-dark-bg
                       border border-sv-border dark:border-sv-dark-border"
          >
            {/* File icon */}
            <div className="w-10 h-10 rounded-[8px] flex-shrink-0
                            bg-sv-primary/10 dark:bg-sv-dark-primary/20
                            flex items-center justify-center">
              <FileText className="w-5 h-5 text-sv-primary dark:text-sv-dark-primary" />
            </div>

            {/* File info */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sv-text dark:text-sv-dark-text truncate">
                {file.name}
              </p>
              <p className="text-xs text-sv-secondary dark:text-sv-dark-secondary">
                {formatBytes(file.size)}
              </p>
            </div>

            {/* Remove button (only when not uploading) */}
            {!isUploading && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setFile(null)
                  setError(null)
                  setProgress(0)
                  setUploadState('idle')
                }}
                className="w-8 h-8 rounded-[8px] flex items-center justify-center flex-shrink-0
                           text-sv-secondary dark:text-sv-dark-secondary
                           hover:bg-sv-border dark:hover:bg-sv-dark-border
                           hover:text-red-500 dark:hover:text-red-400
                           transition-colors"
                aria-label="Remove file"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Upload progress bar ──────────────────────────────────────────── */}
      <AnimatePresence>
        {isUploading && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 overflow-hidden"
          >
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-xs text-sv-secondary dark:text-sv-dark-secondary">
                Uploading…
              </span>
              <span className="text-xs font-medium text-sv-text dark:text-sv-dark-text">
                {Math.round(progress)}%
              </span>
            </div>
            <div className="w-full h-2 bg-sv-border dark:bg-sv-dark-border rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-sv-primary dark:bg-sv-dark-primary rounded-full"
                animate={{ width: `${progress}%` }}
                transition={{ ease: 'easeOut', duration: 0.3 }}
              />
            </div>
          </motion.div>
        )}

        {/* Success bar */}
        {uploadState === 'success' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-4"
          >
            <div className="w-full h-2 bg-sv-border dark:bg-sv-dark-border rounded-full overflow-hidden">
              <div className="h-full w-full bg-emerald-500 rounded-full" />
            </div>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1.5 text-center">
              Upload complete! Redirecting…
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Continue button ──────────────────────────────────────────────── */}
      <button
        onClick={handleUpload}
        disabled={!canUpload}
        className="mt-6 w-full py-3 px-6 rounded-[var(--radius-button)]
                   bg-sv-primary hover:bg-sv-primary-hover
                   dark:bg-sv-dark-primary dark:hover:bg-sv-dark-primary-hover
                   text-white text-sm font-semibold shadow-sm
                   transition-colors duration-200
                   disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {isUploading ? 'Uploading…' : uploadState === 'success' ? 'Done!' : 'Continue'}
      </button>
    </div>
  )
}
