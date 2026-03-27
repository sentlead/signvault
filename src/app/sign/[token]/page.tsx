/**
 * sign/[token]/page.tsx — External Signer Page (Server Component)
 *
 * This is where external signers land when they click the link in their email.
 * NO login is required — the JWT token proves their identity.
 *
 * Flow:
 *   1. Extract token from URL params
 *   2. Verify the JWT — if invalid/expired, show an error page
 *   3. Load the Signer and Document from the database
 *   4. If signer has already signed → show "already signed" page
 *   5. If document is completed → show "completed" page
 *   6. Otherwise → render SigningEditor scoped to this signer's fields
 */

import { verifySigningToken } from '@/lib/signing-token'
import { prisma } from '@/lib/prisma'
import { ExternalSigningEditor } from '@/components/sign/ExternalSigningEditor'
import { CheckCircle2, AlertCircle, Lock } from 'lucide-react'

interface PageProps {
  params: Promise<{ token: string }>
}

// ── Re-usable info page component ─────────────────────────────────────────────

function InfoPage({
  icon: Icon,
  title,
  message,
  iconColor,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  message: string
  iconColor: string
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
      <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-6 ${iconColor}`}>
        <Icon className="w-8 h-8" />
      </div>
      <h1 className="text-2xl font-bold text-sv-text dark:text-sv-dark-text mb-3">
        {title}
      </h1>
      <p className="text-sv-secondary dark:text-sv-dark-secondary text-base max-w-md leading-relaxed">
        {message}
      </p>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function SignTokenPage({ params }: PageProps) {
  const { token } = await params

  // ── 1. Verify JWT ──────────────────────────────────────────────────────────
  const tokenPayload = await verifySigningToken(token)

  if (!tokenPayload) {
    return (
      <InfoPage
        icon={AlertCircle}
        iconColor="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
        title="Link Expired or Invalid"
        message="This signing link has expired or is no longer valid. Please ask the document sender to resend the invitation."
      />
    )
  }

  const { signerId, documentId } = tokenPayload

  // ── 2. Load signer and document ────────────────────────────────────────────
  const signer = await prisma.signer.findFirst({
    where: { id: signerId, documentId },
    select: { id: true, name: true, email: true, status: true },
  })

  if (!signer) {
    return (
      <InfoPage
        icon={AlertCircle}
        iconColor="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
        title="Signer Not Found"
        message="We could not find your signing record. The document may have been cancelled or resent. Please check your email for a new invitation."
      />
    )
  }

  // ── 3. Already signed? ─────────────────────────────────────────────────────
  if (signer.status === 'signed') {
    return (
      <InfoPage
        icon={CheckCircle2}
        iconColor="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"
        title="Already Signed"
        message="You have already signed this document. Thank you! The document owner has been notified."
      />
    )
  }

  // ── 4. Load document ───────────────────────────────────────────────────────
  const document = await prisma.document.findUnique({
    where: { id: documentId },
    select: { id: true, name: true, status: true, fileUrl: true },
  })

  if (!document) {
    return (
      <InfoPage
        icon={AlertCircle}
        iconColor="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
        title="Document Not Found"
        message="This document no longer exists. Please contact the sender for assistance."
      />
    )
  }

  // ── 5. Document already completed? ────────────────────────────────────────
  if (document.status === 'completed') {
    return (
      <InfoPage
        icon={CheckCircle2}
        iconColor="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"
        title="Document Already Completed"
        message="All parties have already signed this document. No further action is needed."
      />
    )
  }

  // ── 6. Load this signer's fields ───────────────────────────────────────────
  const signerFields = await prisma.signatureField.findMany({
    where: { documentId, signerId },
    select: {
      id: true,
      type: true,
      pageNumber: true,
      x: true,
      y: true,
      width: true,
      height: true,
      value: true,
    },
    orderBy: { pageNumber: 'asc' },
  })

  if (signerFields.length === 0) {
    return (
      <InfoPage
        icon={Lock}
        iconColor="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
        title="No Fields Assigned"
        message="No signature fields have been assigned to you on this document. Please contact the sender."
      />
    )
  }

  // ── 7. Render the signing experience ──────────────────────────────────────
  return (
    <ExternalSigningEditor
      documentId={document.id}
      documentName={document.name}
      signerName={signer.name}
      signerEmail={signer.email}
      signerToken={token}
      initialFields={signerFields}
    />
  )
}
