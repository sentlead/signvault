'use client'

/**
 * documents/new/page.tsx — New Document Page (Client Component)
 *
 * Two ways to start a new document:
 *
 *   Tab 1 — Upload PDF:
 *     Drag-and-drop / file picker. Uploads to /api/documents/upload,
 *     then redirects to /documents/[id]/prepare.
 *
 *   Tab 2 — From Template:
 *     Shows the user's saved templates. Clicking one either:
 *       - (Self-sign template) immediately creates a document and goes to prepare.
 *       - (Send template) opens a modal to fill in signer names/emails first.
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
  Copy,
  Play,
  Users,
  Loader2,
} from 'lucide-react'
import { toast } from '@/lib/toast'

// Max size shown to the user — the server enforces the real per-plan limit.
// 50 MB gives room for large images/docx before conversion.
const MAX_SIZE_BYTES = 50 * 1024 * 1024

function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  return `${Math.round(bytes / 1024)} KB`
}

// ── Template types (matches what the API returns) ──────────────────────────

interface Template {
  id: string
  name: string
  description: string | null
  fieldCount: number
  signerRoles: { role: string }[]
  createdAt: string
}

// ── UseTemplateModal (inline, same as TemplatesClient) ─────────────────────

interface UseTemplateModalProps {
  template: Template
  onClose: () => void
  onUse: (signers: { name: string; email: string }[]) => Promise<void>
}

function UseTemplateModal({ template, onClose, onUse }: UseTemplateModalProps) {
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
        <div className="flex items-start justify-between mb-5">
          <div>
            <h2 className="text-sm font-semibold text-sv-text dark:text-sv-dark-text">
              Use Template
            </h2>
            <p className="text-xs text-sv-secondary dark:text-sv-dark-secondary mt-0.5">
              {template.name}
            </p>
          </div>
          <button onClick={onClose} disabled={loading}
            className="w-7 h-7 rounded-[6px] flex items-center justify-center
                       text-sv-secondary dark:text-sv-dark-secondary
                       hover:bg-sv-border dark:hover:bg-sv-dark-border
                       transition-colors disabled:opacity-40">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4">
          <p className="text-xs text-sv-secondary dark:text-sv-dark-secondary">
            Fill in the details for each signer. Fields will be pre-assigned automatically.
          </p>
          {template.signerRoles.map((role, index) => (
            <div key={index} className="space-y-2">
              <p className="text-xs font-semibold text-sv-text dark:text-sv-dark-text">
                {role.role}
              </p>
              <input type="text" value={signers[index]?.name ?? ''}
                onChange={(e) => updateSigner(index, 'name', e.target.value)}
                placeholder="Full name"
                className="w-full px-3 py-2 text-sm rounded-[var(--radius-input)]
                           bg-sv-bg dark:bg-sv-dark-bg border border-sv-border dark:border-sv-dark-border
                           text-sv-text dark:text-sv-dark-text
                           placeholder:text-sv-secondary dark:placeholder:text-sv-dark-secondary
                           focus:outline-none focus:ring-2 focus:ring-sv-primary dark:focus:ring-sv-dark-primary" />
              <input type="email" value={signers[index]?.email ?? ''}
                onChange={(e) => updateSigner(index, 'email', e.target.value)}
                placeholder="email@example.com"
                className="w-full px-3 py-2 text-sm rounded-[var(--radius-input)]
                           bg-sv-bg dark:bg-sv-dark-bg border border-sv-border dark:border-sv-dark-border
                           text-sv-text dark:text-sv-dark-text
                           placeholder:text-sv-secondary dark:placeholder:text-sv-dark-secondary
                           focus:outline-none focus:ring-2 focus:ring-sv-primary dark:focus:ring-sv-dark-primary" />
            </div>
          ))}
          {error && (
            <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
              {error}
            </p>
          )}
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} disabled={loading}
            className="flex-1 py-2.5 rounded-[var(--radius-input)] text-sm font-medium
                       border border-sv-border dark:border-sv-dark-border
                       text-sv-secondary dark:text-sv-dark-secondary
                       hover:bg-sv-bg dark:hover:bg-sv-dark-bg transition-colors disabled:opacity-40">
            Cancel
          </button>
          <button onClick={handleConfirm} disabled={loading}
            className="flex-1 py-2.5 rounded-[var(--radius-input)] text-sm font-medium
                       bg-sv-primary dark:bg-sv-dark-primary text-white
                       hover:opacity-90 transition-opacity disabled:opacity-40
                       flex items-center justify-center gap-2">
            {loading ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Creating…</> : 'Use Template'}
          </button>
        </div>
      </motion.div>
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────

export default function NewDocumentPage() {
  const router = useRouter()

  // ── Tab state ──────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<'upload' | 'template'>('upload')

  // ── Upload tab state ───────────────────────────────────────────────────
  const [file, setFile] = useState<File | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)
  const [uploadState, setUploadState] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle')

  // ── Template tab state ─────────────────────────────────────────────────
  const [templates, setTemplates] = useState<Template[] | null>(null)  // null = not loaded yet
  const [loadingTemplates, setLoadingTemplates] = useState(false)
  const [templateError, setTemplateError] = useState<string | null>(null)
  const [usingTemplate, setUsingTemplate] = useState<Template | null>(null)

  // ── Load templates when template tab is first opened ───────────────────
  async function loadTemplates() {
    if (templates !== null) return  // already loaded
    setLoadingTemplates(true)
    setTemplateError(null)
    try {
      const res = await fetch('/api/templates')
      const data = await res.json() as {
        templates: Array<{
          id: string
          name: string
          description: string | null
          fields: string
          signerRoles: string
          createdAt: string
        }>
      }
      // Parse the JSON strings from the API into arrays
      setTemplates(data.templates.map((t) => ({
        id: t.id,
        name: t.name,
        description: t.description,
        fieldCount: (JSON.parse(t.fields) as unknown[]).length,
        signerRoles: JSON.parse(t.signerRoles) as { role: string }[],
        createdAt: t.createdAt,
      })))
    } catch {
      setTemplateError('Could not load templates.')
    } finally {
      setLoadingTemplates(false)
    }
  }

  // ── Use a template ─────────────────────────────────────────────────────
  async function handleUseTemplate(template: Template, signers: { name: string; email: string }[]) {
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

  // ── Upload handlers ────────────────────────────────────────────────────
  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
    setUploadError(null)
    setFile(null)
    setProgress(0)
    setUploadState('idle')

    if (rejectedFiles.length > 0) {
      const firstError = rejectedFiles[0]?.errors[0]
      if (firstError?.code === 'file-too-large') {
        setUploadError('File is too large. Maximum size is 50 MB.')
      } else if (firstError?.code === 'file-invalid-type') {
        setUploadError('Accepted formats: PDF, JPG, PNG, or DOCX.')
      } else {
        setUploadError('File could not be added. Please try again.')
      }
      return
    }
    if (acceptedFiles.length > 0) setFile(acceptedFiles[0])
  }, [])

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    maxSize: MAX_SIZE_BYTES,
    multiple: false,
  })

  async function handleUpload() {
    if (!file) return
    setUploadState('uploading')
    setProgress(0)
    setUploadError(null)

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 85) { clearInterval(progressInterval); return prev }
        return prev + Math.random() * 12
      })
    }, 200)

    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/documents/upload', { method: 'POST', body: formData })
      clearInterval(progressInterval)

      if (!res.ok) {
        let message = 'Upload failed'
        try {
          const data = (await res.json()) as { error?: string }
          if (data.error) message = data.error
        } catch { /* empty response */ }
        throw new Error(message)
      }

      const data = (await res.json()) as { documentId: string }
      setProgress(100)
      setUploadState('success')
      toast.success('Document uploaded!')
      setTimeout(() => router.push(`/documents/${data.documentId}/prepare`), 600)
    } catch (err) {
      clearInterval(progressInterval)
      setUploadState('error')
      setProgress(0)
      const message = err instanceof Error ? err.message : 'Upload failed. Please try again.'
      setUploadError(message)
      toast.error('Upload failed. Please try again.')
    }
  }

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

      {/* ── Back link ───────────────────────────────────────────────────── */}
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm text-sv-secondary dark:text-sv-dark-secondary
                   hover:text-sv-text dark:hover:text-sv-dark-text transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Dashboard
      </Link>

      {/* ── Page title ──────────────────────────────────────────────────── */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-sv-text dark:text-sv-dark-text">
          New Document
        </h1>
        <p className="text-sm text-sv-secondary dark:text-sv-dark-secondary mt-1">
          Upload a PDF or start from one of your saved templates.
        </p>
      </div>

      {/* ── Tab switcher ────────────────────────────────────────────────── */}
      <div className="flex rounded-[var(--radius-button)] overflow-hidden border border-sv-border dark:border-sv-dark-border mb-6">
        <button
          onClick={() => setActiveTab('upload')}
          className={`flex-1 py-2.5 text-sm font-medium transition-colors flex items-center justify-center gap-2
            ${activeTab === 'upload'
              ? 'bg-sv-primary dark:bg-sv-dark-primary text-white'
              : 'text-sv-secondary dark:text-sv-dark-secondary hover:bg-sv-bg dark:hover:bg-sv-dark-bg'
            }`}
        >
          <UploadCloud className="w-4 h-4" />
          Upload PDF
        </button>
        <button
          onClick={() => {
            setActiveTab('template')
            loadTemplates()
          }}
          className={`flex-1 py-2.5 text-sm font-medium transition-colors border-l border-sv-border dark:border-sv-dark-border
                      flex items-center justify-center gap-2
            ${activeTab === 'template'
              ? 'bg-sv-primary dark:bg-sv-dark-primary text-white'
              : 'text-sv-secondary dark:text-sv-dark-secondary hover:bg-sv-bg dark:hover:bg-sv-dark-bg'
            }`}
        >
          <Copy className="w-4 h-4" />
          From Template
        </button>
      </div>

      {/* ── Upload tab ──────────────────────────────────────────────────── */}
      {activeTab === 'upload' && (
        <>
          {/* Dropzone */}
          <div {...getRootProps({ className: dropzoneClasses })}>
            <input {...getInputProps()} />
            {isDragReject ? (
              <>
                <AlertCircle className="w-10 h-10 text-red-400" />
                <p className="text-sm font-medium text-red-500">Accepted formats: PDF, JPG, PNG, or DOCX</p>
              </>
            ) : isDragActive ? (
              <>
                <UploadCloud className="w-10 h-10 text-sv-primary dark:text-sv-dark-primary animate-bounce" />
                <p className="text-sm font-medium text-sv-primary dark:text-sv-dark-primary">Drop your file here</p>
              </>
            ) : file ? (
              <>
                <CheckCircle className="w-10 h-10 text-emerald-500" />
                <p className="text-sm font-medium text-sv-text dark:text-sv-dark-text">File selected — ready to upload</p>
                <p className="text-xs text-sv-secondary dark:text-sv-dark-secondary">Click or drag to replace</p>
              </>
            ) : (
              <>
                <UploadCloud className="w-10 h-10 text-sv-secondary dark:text-sv-dark-secondary" />
                <div>
                  <p className="text-sm font-medium text-sv-text dark:text-sv-dark-text">Drag & drop your file here</p>
                  <p className="text-xs text-sv-secondary dark:text-sv-dark-secondary mt-1">
                    or <span className="text-sv-primary dark:text-sv-dark-primary underline underline-offset-2">browse files</span>
                  </p>
                </div>
                <p className="text-xs text-sv-secondary dark:text-sv-dark-secondary">PDF, JPG, PNG, or DOCX · max 50 MB</p>
                <p className="text-xs text-sv-secondary dark:text-sv-dark-secondary">Images and Word documents are converted to PDF automatically.</p>
              </>
            )}
          </div>

          {/* Validation error */}
          <AnimatePresence>
            {uploadError && (
              <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                className="mt-3 flex items-start gap-2 text-sm text-red-500 dark:text-red-400">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>{uploadError}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* File preview card */}
          <AnimatePresence>
            {file && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
                className="mt-4 flex items-center gap-3 p-4 rounded-[var(--radius-card)]
                           bg-sv-bg dark:bg-sv-dark-bg border border-sv-border dark:border-sv-dark-border">
                <div className="w-10 h-10 rounded-[8px] flex-shrink-0 bg-sv-primary/10 dark:bg-sv-dark-primary/20
                                flex items-center justify-center">
                  <FileText className="w-5 h-5 text-sv-primary dark:text-sv-dark-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-sv-text dark:text-sv-dark-text truncate">{file.name}</p>
                  <p className="text-xs text-sv-secondary dark:text-sv-dark-secondary">{formatBytes(file.size)}</p>
                </div>
                {!isUploading && (
                  <button
                    onClick={(e) => { e.stopPropagation(); setFile(null); setUploadError(null); setProgress(0); setUploadState('idle') }}
                    className="w-8 h-8 rounded-[8px] flex items-center justify-center flex-shrink-0
                               text-sv-secondary dark:text-sv-dark-secondary
                               hover:bg-sv-border dark:hover:bg-sv-dark-border
                               hover:text-red-500 dark:hover:text-red-400 transition-colors"
                    aria-label="Remove file"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Progress bar */}
          <AnimatePresence>
            {isUploading && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }} className="mt-4 overflow-hidden">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-xs text-sv-secondary dark:text-sv-dark-secondary">Uploading…</span>
                  <span className="text-xs font-medium text-sv-text dark:text-sv-dark-text">{Math.round(progress)}%</span>
                </div>
                <div className="w-full h-2 bg-sv-border dark:bg-sv-dark-border rounded-full overflow-hidden">
                  <motion.div className="h-full bg-sv-primary dark:bg-sv-dark-primary rounded-full"
                    animate={{ width: `${progress}%` }} transition={{ ease: 'easeOut', duration: 0.3 }} />
                </div>
              </motion.div>
            )}
            {uploadState === 'success' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4">
                <div className="w-full h-2 bg-sv-border dark:bg-sv-dark-border rounded-full overflow-hidden">
                  <div className="h-full w-full bg-emerald-500 rounded-full" />
                </div>
                <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1.5 text-center">Upload complete! Redirecting…</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Continue button */}
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
        </>
      )}

      {/* ── Template tab ────────────────────────────────────────────────── */}
      {activeTab === 'template' && (
        <div>
          {loadingTemplates && (
            <div className="flex items-center justify-center py-16 gap-2 text-sv-secondary dark:text-sv-dark-secondary">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Loading templates…</span>
            </div>
          )}

          {templateError && (
            <div className="flex items-center gap-2 text-sm text-red-500 dark:text-red-400 py-8 justify-center">
              <AlertCircle className="w-4 h-4" />
              {templateError}
            </div>
          )}

          {templates !== null && templates.length === 0 && (
            <div className="text-center py-16">
              <Copy className="w-10 h-10 text-sv-secondary dark:text-sv-dark-secondary mx-auto mb-3" />
              <p className="text-sm font-medium text-sv-text dark:text-sv-dark-text mb-1">No templates saved yet</p>
              <p className="text-xs text-sv-secondary dark:text-sv-dark-secondary mb-5">
                Go to the prepare step on any document, place your fields, then click &quot;Save as Template&quot;.
              </p>
              <button
                onClick={() => setActiveTab('upload')}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-[var(--radius-button)]
                           bg-sv-primary dark:bg-sv-dark-primary text-white text-sm font-medium
                           hover:opacity-90 transition-opacity"
              >
                <UploadCloud className="w-4 h-4" />
                Upload a PDF instead
              </button>
            </div>
          )}

          {templates !== null && templates.length > 0 && (
            <div className="space-y-3">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className="flex items-center gap-4 p-4 rounded-[var(--radius-card)]
                             bg-sv-surface dark:bg-sv-dark-surface
                             border border-sv-border dark:border-sv-dark-border
                             hover:border-sv-primary/40 dark:hover:border-sv-dark-primary/40
                             transition-colors"
                >
                  {/* Icon */}
                  <div className="w-9 h-9 rounded-[8px] bg-sv-primary/10 dark:bg-sv-dark-primary/20
                                  flex items-center justify-center flex-shrink-0">
                    <Copy className="w-4 h-4 text-sv-primary dark:text-sv-dark-primary" />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-sv-text dark:text-sv-dark-text truncate">
                      {template.name}
                    </p>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-xs text-sv-secondary dark:text-sv-dark-secondary">
                        {template.fieldCount} field{template.fieldCount !== 1 ? 's' : ''}
                      </span>
                      {template.signerRoles.length > 0 && (
                        <span className="flex items-center gap-1 text-xs text-sv-secondary dark:text-sv-dark-secondary">
                          <Users className="w-3 h-3" />
                          {template.signerRoles.map((r) => r.role).join(', ')}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Use button */}
                  <button
                    onClick={() => {
                      if (template.signerRoles.length > 0) {
                        setUsingTemplate(template)
                      } else {
                        handleUseTemplate(template, []).catch(() => {
                          toast.error('Could not create document. Please try again.')
                        })
                      }
                    }}
                    className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2
                               rounded-[var(--radius-button)] text-xs font-medium
                               bg-sv-primary dark:bg-sv-dark-primary text-white
                               hover:opacity-90 transition-opacity"
                  >
                    <Play className="w-3 h-3" />
                    Use
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── UseTemplateModal ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {usingTemplate && (
          <UseTemplateModal
            template={usingTemplate}
            onClose={() => setUsingTemplate(null)}
            onUse={async (signers) => {
              await handleUseTemplate(usingTemplate, signers)
              setUsingTemplate(null)
            }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
