/**
 * sign/[token]/success/page.tsx — Signing Success Page
 *
 * Shown after an external signer successfully submits their signature.
 * No interaction needed — just a confirmation that everything went through.
 */

import { CheckCircle2 } from 'lucide-react'

export default function SignSuccessPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">

      {/* ── Success icon ─────────────────────────────────────────────── */}
      <div className="
        w-20 h-20 rounded-full flex items-center justify-center mb-6
        bg-emerald-100 dark:bg-emerald-900/30
      ">
        <CheckCircle2 className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />
      </div>

      {/* ── Heading ──────────────────────────────────────────────────── */}
      <h1 className="text-3xl font-bold text-sv-text dark:text-sv-dark-text mb-3">
        You&apos;ve Signed the Document!
      </h1>

      {/* ── Body text ────────────────────────────────────────────────── */}
      <p className="text-sv-secondary dark:text-sv-dark-secondary text-base max-w-md leading-relaxed mb-2">
        Your signature has been recorded successfully.
      </p>
      <p className="text-sv-secondary dark:text-sv-dark-secondary text-base max-w-md leading-relaxed">
        The document owner has been notified. You will receive a copy once all parties have signed.
      </p>

      {/* ── Divider ──────────────────────────────────────────────────── */}
      <div className="
        mt-10 px-6 py-4 rounded-[var(--radius-card)]
        bg-sv-surface dark:bg-sv-dark-surface
        border border-sv-border dark:border-sv-dark-border
        max-w-sm w-full
      ">
        <p className="text-sm text-sv-secondary dark:text-sv-dark-secondary">
          No further action is required. You can safely close this tab.
        </p>
      </div>

    </div>
  )
}
