'use client'

/**
 * InviteAcceptClient.tsx
 *
 * Shown when a user visits an invitation link (/team/invite/[token]).
 * Handles four states:
 *   - not_found: invalid token
 *   - expired: invite link is past its expiry date
 *   - valid + not logged in: prompt to sign in first
 *   - valid + logged in: "Accept Invitation" button
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Users, CheckCircle, AlertCircle, Clock, Loader2, LogIn } from 'lucide-react'
import { SignVaultLogo } from '@/components/ui/SignVaultLogo'

interface InviteAcceptClientProps {
  token: string
  status: 'valid' | 'expired' | 'not_found'
  inviteEmail?: string
  teamName?: string
  ownerName?: string
  memberCount?: number
  expiresAt?: string
  currentUserEmail: string | null
}

export function InviteAcceptClient({
  token,
  status,
  inviteEmail,
  teamName,
  ownerName,
  currentUserEmail,
}: InviteAcceptClientProps) {
  const router = useRouter()
  const [accepting, setAccepting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [accepted, setAccepted] = useState(false)

  async function handleAccept() {
    setError(null)
    setAccepting(true)
    try {
      const res = await fetch(`/api/team/invite/${token}`, { method: 'POST' })
      const data = await res.json() as { success?: boolean; error?: string }
      if (!res.ok) {
        setError(data.error ?? 'Could not accept the invitation.')
        return
      }
      setAccepted(true)
      // Redirect to the team page after a short delay
      setTimeout(() => router.push('/team'), 1500)
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setAccepting(false)
    }
  }

  // ── Shared shell ───────────────────────────────────────────────────────────
  function Shell({ children }: { children: React.ReactNode }) {
    return (
      <div className="min-h-screen bg-sv-bg dark:bg-sv-dark-bg flex flex-col items-center justify-center p-6">
        <Link href="/" className="flex items-center gap-2.5 mb-10 hover:opacity-80 transition-opacity">
          <SignVaultLogo size={32} />
          <span className="text-xl font-bold tracking-tight text-sv-text dark:text-sv-dark-text">
            Sign<span className="text-sv-primary dark:text-sv-dark-primary">Vault</span>
          </span>
        </Link>
        <div className="w-full max-w-md bg-sv-surface dark:bg-sv-dark-surface
                        border border-sv-border dark:border-sv-dark-border
                        rounded-[var(--radius-card)] shadow-lg p-8">
          {children}
        </div>
      </div>
    )
  }

  // ── Invalid token ──────────────────────────────────────────────────────────
  if (status === 'not_found') {
    return (
      <Shell>
        <div className="text-center">
          <div className="w-14 h-14 rounded-full bg-red-100 dark:bg-red-900/30
                          flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-7 h-7 text-red-500" />
          </div>
          <h1 className="text-xl font-bold text-sv-text dark:text-sv-dark-text mb-2">
            Invitation Not Found
          </h1>
          <p className="text-sm text-sv-secondary dark:text-sv-dark-secondary mb-6 leading-relaxed">
            This invitation link is invalid or has already been used.
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-[var(--radius-button)]
                       bg-sv-primary dark:bg-sv-dark-primary text-white text-sm font-semibold
                       hover:opacity-90 transition-opacity"
          >
            Go to Dashboard
          </Link>
        </div>
      </Shell>
    )
  }

  // ── Expired ────────────────────────────────────────────────────────────────
  if (status === 'expired') {
    return (
      <Shell>
        <div className="text-center">
          <div className="w-14 h-14 rounded-full bg-amber-100 dark:bg-amber-900/30
                          flex items-center justify-center mx-auto mb-4">
            <Clock className="w-7 h-7 text-amber-500" />
          </div>
          <h1 className="text-xl font-bold text-sv-text dark:text-sv-dark-text mb-2">
            Invitation Expired
          </h1>
          <p className="text-sm text-sv-secondary dark:text-sv-dark-secondary mb-6 leading-relaxed">
            This invitation link has expired. Ask the team owner to send a new invite.
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-[var(--radius-button)]
                       bg-sv-primary dark:bg-sv-dark-primary text-white text-sm font-semibold
                       hover:opacity-90 transition-opacity"
          >
            Go to Dashboard
          </Link>
        </div>
      </Shell>
    )
  }

  // ── Accepted successfully ──────────────────────────────────────────────────
  if (accepted) {
    return (
      <Shell>
        <div className="text-center">
          <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-900/30
                          flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-7 h-7 text-emerald-500" />
          </div>
          <h1 className="text-xl font-bold text-sv-text dark:text-sv-dark-text mb-2">
            Welcome to the team!
          </h1>
          <p className="text-sm text-sv-secondary dark:text-sv-dark-secondary">
            Redirecting you to your team page…
          </p>
        </div>
      </Shell>
    )
  }

  // ── Valid invitation ───────────────────────────────────────────────────────
  const emailMismatch = currentUserEmail &&
    currentUserEmail.toLowerCase() !== (inviteEmail ?? '').toLowerCase()

  return (
    <Shell>
      {/* Team icon */}
      <div className="w-14 h-14 rounded-full bg-sv-primary/10 dark:bg-sv-dark-primary/20
                      flex items-center justify-center mx-auto mb-5">
        <Users className="w-7 h-7 text-sv-primary dark:text-sv-dark-primary" />
      </div>

      <h1 className="text-xl font-bold text-sv-text dark:text-sv-dark-text text-center mb-1">
        You&apos;re Invited!
      </h1>
      <p className="text-sm text-sv-secondary dark:text-sv-dark-secondary text-center mb-6">
        <strong className="text-sv-text dark:text-sv-dark-text">{ownerName}</strong> invited you to join
      </p>

      {/* Team name card */}
      <div className="bg-sv-primary/5 dark:bg-sv-dark-primary/10
                      border border-sv-primary/20 dark:border-sv-dark-primary/30
                      rounded-[var(--radius-card)] p-4 mb-6 text-center">
        <p className="text-base font-bold text-sv-text dark:text-sv-dark-text">👥 {teamName}</p>
        <p className="text-xs text-sv-secondary dark:text-sv-dark-secondary mt-1">
          Team workspace on SignVault
        </p>
      </div>

      {/* Email mismatch warning */}
      {emailMismatch && (
        <div className="flex items-start gap-2 p-3 rounded-[var(--radius-input)]
                        bg-amber-50 dark:bg-amber-900/20
                        border border-amber-200 dark:border-amber-800 mb-4">
          <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
            This invite was sent to <strong>{inviteEmail}</strong> but you&apos;re signed in as{' '}
            <strong>{currentUserEmail}</strong>. Please sign in with the correct account to accept.
          </p>
        </div>
      )}

      {/* Not logged in */}
      {!currentUserEmail ? (
        <div className="space-y-3">
          <p className="text-xs text-sv-secondary dark:text-sv-dark-secondary text-center leading-relaxed">
            Sign in to your SignVault account to accept this invitation.
          </p>
          <Link
            href={`/login?callbackUrl=${encodeURIComponent(`/team/invite/${token}`)}`}
            className="w-full flex items-center justify-center gap-2 py-3 px-4
                       rounded-[var(--radius-button)]
                       bg-sv-primary dark:bg-sv-dark-primary text-white text-sm font-semibold
                       hover:opacity-90 transition-opacity"
          >
            <LogIn className="w-4 h-4" />
            Sign In to Accept
          </Link>
        </div>
      ) : (
        /* Logged in — show accept button */
        <div className="space-y-3">
          {error && (
            <div className="flex items-start gap-2 p-3 rounded-[var(--radius-input)]
                            bg-red-50 dark:bg-red-900/20
                            border border-red-200 dark:border-red-800">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}
          <button
            onClick={handleAccept}
            disabled={accepting || !!emailMismatch}
            className="w-full flex items-center justify-center gap-2 py-3 px-4
                       rounded-[var(--radius-button)]
                       bg-sv-primary dark:bg-sv-dark-primary text-white text-sm font-semibold
                       hover:opacity-90 transition-opacity
                       disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {accepting ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Joining…</>
            ) : (
              <><CheckCircle className="w-4 h-4" /> Accept Invitation</>
            )}
          </button>
          <p className="text-xs text-sv-secondary dark:text-sv-dark-secondary text-center">
            Signed in as <span className="font-medium">{currentUserEmail}</span>
          </p>
        </div>
      )}
    </Shell>
  )
}
