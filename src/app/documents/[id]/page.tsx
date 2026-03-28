/**
 * documents/[id]/page.tsx — Document Detail Page (Server Component)
 *
 * Shows the full details of a single document:
 *   - Document name, status badge, creation date
 *   - Green "Completed" banner when status === 'completed'
 *   - Action buttons: Prepare, Sign, Download Signed PDF
 *   - Signers list
 *   - Audit log (nicely formatted with human-readable action labels)
 */

import Link from 'next/link'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { redirect, notFound } from 'next/navigation'
import {
  ArrowLeft,
  FileText,
  PenLine,
  Download,
  Clock,
  CheckCircle2,
  AlertCircle,
  Users,
  Activity,
  PartyPopper,
  FilePen,
  Award,
} from 'lucide-react'
import { AuditTrail } from '@/components/document/AuditTrail'
import { VoidDocumentButton } from '@/components/document/VoidDocumentButton'

interface PageProps {
  params: Promise<{ id: string }>
}

// ── Status badge ───────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; classes: string }> = {
    draft: {
      label: 'Draft',
      classes: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300',
    },
    awaiting_signatures: {
      label: 'Awaiting Signatures',
      classes: 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300',
    },
    completed: {
      label: 'Completed',
      classes: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300',
    },
    void: {
      label: 'Voided',
      classes: 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300',
    },
  }

  const { label, classes } = map[status] ?? {
    label: status,
    classes: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300',
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${classes}`}>
      {label}
    </span>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default async function DocumentDetailPage({ params }: PageProps) {
  const { id } = await params
  const session = await auth()

  if (!session?.user?.id) redirect('/login')

  // Load the document with signers and audit logs
  const document = await prisma.document.findFirst({
    where: { id, ownerId: session.user.id },
    select: {
      id: true,
      name: true,
      status: true,
      createdAt: true,
      completedAt: true,
      fileUrl: true,
      signedFileUrl: true,
      signers: {
        select: {
          id: true,
          name: true,
          email: true,
          status: true,
          signedAt: true,
        },
        orderBy: { id: 'asc' },
      },
      auditLogs: {
        select: {
          id: true,
          action: true,
          actorEmail: true,
          timestamp: true,
          ipAddress: true,
        },
        orderBy: { timestamp: 'desc' },
        take: 20,
      },
      _count: {
        select: { signatureFields: true },
      },
    },
  })

  if (!document) notFound()

  const isCompleted    = document.status === 'completed'
  const isAwaiting     = document.status === 'awaiting_signatures'

  // Format dates
  const createdAt = new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(document.createdAt))

  const completedAt = document.completedAt
    ? new Intl.DateTimeFormat('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(new Date(document.completedAt))
    : null

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 space-y-6">

      {/* ── Back link ─────────────────────────────────────────────────────── */}
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm
                   text-sv-secondary dark:text-sv-dark-secondary
                   hover:text-sv-text dark:hover:text-sv-dark-text
                   transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Dashboard
      </Link>

      {/* ── Completed banner ──────────────────────────────────────────────── */}
      {isCompleted && (
        <div className="
          flex items-center gap-3 px-5 py-4
          rounded-[var(--radius-card)]
          bg-emerald-50 dark:bg-emerald-900/20
          border border-emerald-200 dark:border-emerald-800
        ">
          <PartyPopper className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">
              Document signed successfully!
            </p>
            {completedAt && (
              <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-0.5">
                Completed on {completedAt}
              </p>
            )}
          </div>
        </div>
      )}

      {/* ── Document header card ──────────────────────────────────────────── */}
      <div className="
        flex flex-col sm:flex-row sm:items-center gap-4 p-6
        bg-sv-surface dark:bg-sv-dark-surface
        border border-sv-border dark:border-sv-dark-border
        rounded-[var(--radius-card)]
      ">
        {/* File icon */}
        <div className="w-12 h-12 rounded-[10px] flex-shrink-0
                        bg-sv-primary/10 dark:bg-sv-dark-primary/20
                        flex items-center justify-center">
          <FileText className="w-6 h-6 text-sv-primary dark:text-sv-dark-primary" />
        </div>

        {/* Name + meta */}
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-sv-text dark:text-sv-dark-text truncate">
            {document.name}
          </h1>
          <div className="flex flex-wrap items-center gap-3 mt-1">
            <StatusBadge status={document.status} />
            <span className="text-xs text-sv-secondary dark:text-sv-dark-secondary flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {createdAt}
            </span>
            {document._count.signatureFields > 0 && (
              <span className="text-xs text-sv-secondary dark:text-sv-dark-secondary">
                {document._count.signatureFields} field{document._count.signatureFields !== 1 ? 's' : ''} placed
              </span>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap gap-2">

          {/* Prepare — always available */}
          <Link
            href={`/documents/${document.id}/prepare`}
            className="
              inline-flex items-center gap-1.5 px-4 py-2 rounded-[var(--radius-button)]
              border border-sv-border dark:border-sv-dark-border
              text-sv-text dark:text-sv-dark-text
              text-sm font-medium hover:bg-sv-bg dark:hover:bg-sv-dark-bg
              transition-colors
            "
          >
            <PenLine className="w-4 h-4" />
            Prepare
          </Link>

          {/* Sign — only when there are fields and document isn't completed */}
          {!isCompleted && document._count.signatureFields > 0 && (
            <Link
              href={`/documents/${document.id}/sign`}
              className="
                inline-flex items-center gap-1.5 px-4 py-2 rounded-[var(--radius-button)]
                bg-sv-primary hover:bg-sv-primary-hover
                dark:bg-sv-dark-primary dark:hover:bg-sv-dark-primary-hover
                text-white text-sm font-medium shadow-sm transition-colors
              "
            >
              <FilePen className="w-4 h-4" />
              Sign
            </Link>
          )}

          {/* Download Signed PDF — only when completed */}
          {isCompleted && document.signedFileUrl && (
            <a
              href={`/api/documents/${document.id}/signed-file`}
              download
              className="
                inline-flex items-center gap-1.5 px-4 py-2 rounded-[var(--radius-button)]
                bg-emerald-600 hover:bg-emerald-700
                dark:bg-emerald-500 dark:hover:bg-emerald-600
                text-white text-sm font-semibold shadow-sm transition-colors
              "
            >
              <Download className="w-4 h-4" />
              Download Signed PDF
            </a>
          )}

          {/* Certificate of Completion — only when completed */}
          {isCompleted && (
            <a
              href={`/api/documents/${document.id}/certificate`}
              download
              className="
                inline-flex items-center gap-1.5 px-4 py-2 rounded-[var(--radius-button)]
                border border-sv-border dark:border-sv-dark-border
                text-sv-secondary dark:text-sv-dark-secondary text-sm font-medium
                hover:border-emerald-300 dark:hover:border-emerald-700
                hover:text-emerald-600 dark:hover:text-emerald-400
                transition-colors
              "
            >
              <Award className="w-4 h-4" />
              Certificate
            </a>
          )}

          {/* Void — only when awaiting signatures */}
          {isAwaiting && (
            <VoidDocumentButton documentId={document.id} />
          )}
        </div>
      </div>

      {/* ── Signers card ──────────────────────────────────────────────────── */}
      <div className="
        p-6
        bg-sv-surface dark:bg-sv-dark-surface
        border border-sv-border dark:border-sv-dark-border
        rounded-[var(--radius-card)]
      ">
        <h2 className="text-base font-semibold text-sv-text dark:text-sv-dark-text mb-4 flex items-center gap-2">
          <Users className="w-4 h-4 text-sv-secondary dark:text-sv-dark-secondary" />
          Signers
        </h2>

        {document.signers.length === 0 ? (
          <p className="text-sm text-sv-secondary dark:text-sv-dark-secondary">
            No external signers added yet. You can add signers in Phase 6.
          </p>
        ) : (
          <ul className="space-y-3">
            {document.signers.map((signer) => (
              <li key={signer.id} className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-sv-text dark:text-sv-dark-text">
                    {signer.name}
                  </p>
                  <p className="text-xs text-sv-secondary dark:text-sv-dark-secondary">
                    {signer.email}
                  </p>
                </div>
                {signer.status === 'signed' ? (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Signed
                    {signer.signedAt && (
                      <span className="ml-1 text-sv-secondary dark:text-sv-dark-secondary">
                        ({new Intl.DateTimeFormat('en-US', { dateStyle: 'short' }).format(new Date(signer.signedAt))})
                      </span>
                    )}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 dark:text-amber-400">
                    <AlertCircle className="w-3.5 h-3.5" />
                    Pending
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* ── Audit log card ────────────────────────────────────────────────── */}
      <div className="
        p-6
        bg-sv-surface dark:bg-sv-dark-surface
        border border-sv-border dark:border-sv-dark-border
        rounded-[var(--radius-card)]
      ">
        <h2 className="text-base font-semibold text-sv-text dark:text-sv-dark-text mb-4 flex items-center gap-2">
          <Activity className="w-4 h-4 text-sv-secondary dark:text-sv-dark-secondary" />
          Activity Log
        </h2>

        {/* AuditTrail renders a timeline with icons, labels, and relative timestamps */}
        <AuditTrail
          entries={document.auditLogs.map((log) => ({
            id: log.id,
            action: log.action,
            actorEmail: log.actorEmail,
            timestamp: log.timestamp,
            ipAddress: log.ipAddress,
          }))}
        />
      </div>

    </div>
  )
}
