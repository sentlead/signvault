'use client'

/**
 * app/login/page.tsx
 *
 * The combined Sign In / Create Account page.
 *
 * Features:
 *   - Centered card on the animated blob background
 *   - Tab switcher between "Sign In" and "Create Account"
 *   - Email magic link form (no password needed!)
 *   - Google OAuth button
 *   - Apple OAuth button
 *   - Full dark mode support
 *   - Framer Motion animations for card entrance and tab switching
 *
 * How magic links work:
 *   1. User enters their email and clicks "Send Magic Link"
 *   2. NextAuth sends them an email (via Resend) with a one-time link
 *   3. They click the link → they're signed in automatically
 *   4. Both new and existing users can use this flow (no separate signup needed)
 *
 * 'use client' is required because we use React state and the signIn() function.
 */

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mail, Loader2, CheckCircle2 } from 'lucide-react'
import { SignVaultLogo } from '@/components/ui/SignVaultLogo'
import { AnimatedBackground } from '@/components/AnimatedBackground'

// ─── Tab Configuration ────────────────────────────────────────────────────────
const tabs = [
  { id: 'signin', label: 'Sign In' },
  { id: 'signup', label: 'Create Account' },
] as const

type TabId = (typeof tabs)[number]['id']

// ─── Main Page Component ──────────────────────────────────────────────────────
export default function LoginPage() {
  // Which tab is active: "signin" or "signup"
  const [activeTab, setActiveTab] = useState<TabId>('signin')

  // The email the user typed in
  const [email, setEmail] = useState('')

  // Loading states for each button
  const [isEmailLoading, setIsEmailLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)


  // After magic link is sent, show a success message
  const [magicLinkSent, setMagicLinkSent] = useState(false)

  // Any error message to show to the user
  const [error, setError] = useState<string | null>(null)

  // ── Handlers ───────────────────────────────────────────────────────────────

  /**
   * Handle email form submission.
   * Calls NextAuth's signIn() with the "resend" provider (magic link).
   * NextAuth sends an email and redirects the user to a "check your email" state.
   */
  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return

    setIsEmailLoading(true)
    setError(null)

    try {
      // redirect: false means we handle the result ourselves instead of
      // NextAuth auto-redirecting to an error page
      const result = await signIn('resend', {
        email,
        callbackUrl: '/dashboard',
        redirect: false,
      })

      if (result?.error) {
        setError('Something went wrong. Please try again.')
      } else {
        // Magic link sent! Show the success state.
        setMagicLinkSent(true)
      }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setIsEmailLoading(false)
    }
  }

  /** Sign in with Google — redirects to Google's OAuth flow */
  async function handleGoogleSignIn() {
    setIsGoogleLoading(true)
    setError(null)
    try {
      await signIn('google', { callbackUrl: '/dashboard' })
    } catch {
      setError('Could not connect to Google. Please try again.')
      setIsGoogleLoading(false)
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    // Full-screen container with animated blob background
    <div className="relative min-h-screen flex items-center justify-center px-4 py-12
                    bg-sv-bg dark:bg-sv-dark-bg overflow-hidden">

      {/* Animated blobs sit behind everything */}
      <AnimatedBackground />

      {/* Card — sits above the blobs */}
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-md"
      >
        {/* ── Card Box ───────────────────────────────────────────────────── */}
        <div className="bg-sv-surface dark:bg-sv-dark-surface
                        border border-sv-border dark:border-sv-dark-border
                        rounded-[var(--radius-card)] shadow-2xl shadow-black/10 dark:shadow-black/40
                        px-8 py-8">

          {/* ── Logo ─────────────────────────────────────────────────────── */}
          <div className="flex items-center gap-2.5 justify-center mb-8">
            <SignVaultLogo size={36} />
            <span className="text-xl font-bold tracking-tight text-sv-text dark:text-sv-dark-text">
              Sign<span className="text-sv-primary dark:text-sv-dark-primary">Vault</span>
            </span>
          </div>

          {/* ── Tab Switcher ─────────────────────────────────────────────── */}
          <div className="relative flex mb-8 border-b border-sv-border dark:border-sv-dark-border">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id)
                  setMagicLinkSent(false)
                  setError(null)
                }}
                className={`flex-1 pb-3 text-sm font-medium transition-colors duration-200
                  ${activeTab === tab.id
                    ? 'text-sv-primary dark:text-sv-dark-primary'
                    : 'text-sv-secondary dark:text-sv-dark-secondary hover:text-sv-text dark:hover:text-sv-dark-text'
                  }`}
              >
                {tab.label}
              </button>
            ))}

            {/* Animated underline indicator that slides between tabs */}
            <motion.div
              className="absolute bottom-0 h-0.5 bg-sv-primary dark:bg-sv-dark-primary rounded-full"
              style={{ width: '50%' }}
              animate={{ x: activeTab === 'signin' ? 0 : '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            />
          </div>

          {/* ── Content (animated on tab switch) ─────────────────────────── */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: activeTab === 'signin' ? -12 : 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: activeTab === 'signin' ? 12 : -12 }}
              transition={{ duration: 0.2 }}
            >
              {/* Heading text changes based on active tab */}
              <h1 className="text-xl font-semibold text-sv-text dark:text-sv-dark-text mb-1">
                {activeTab === 'signin' ? 'Welcome back' : 'Create your account'}
              </h1>
              <p className="text-sm text-sv-secondary dark:text-sv-dark-secondary mb-6">
                {activeTab === 'signin'
                  ? 'Sign in to access your documents'
                  : 'Start signing documents for free'}
              </p>

              {/* ── Magic Link Sent State ─────────────────────────────────── */}
              {magicLinkSent ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-6"
                >
                  <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-3" />
                  <h2 className="text-base font-semibold text-sv-text dark:text-sv-dark-text mb-1">
                    Check your email
                  </h2>
                  <p className="text-sm text-sv-secondary dark:text-sv-dark-secondary">
                    We sent a magic sign-in link to{' '}
                    <span className="font-medium text-sv-text dark:text-sv-dark-text">{email}</span>.
                    Click the link in the email to continue.
                  </p>
                  <button
                    onClick={() => setMagicLinkSent(false)}
                    className="mt-4 text-sm text-sv-primary dark:text-sv-dark-primary hover:underline"
                  >
                    Use a different email
                  </button>
                </motion.div>

              ) : (
                <>
                  {/* ── Error Message ─────────────────────────────────────── */}
                  {error && (
                    <div className="mb-4 px-3 py-2.5 rounded-[8px] bg-red-50 dark:bg-red-950/30
                                    border border-red-200 dark:border-red-800">
                      <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                    </div>
                  )}

                  {/* ── Email Form ───────────────────────────────────────── */}
                  <form onSubmit={handleEmailSubmit} className="mb-5">
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium text-sv-text dark:text-sv-dark-text mb-1.5"
                    >
                      Email address
                    </label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4
                                         text-sv-secondary dark:text-sv-dark-secondary pointer-events-none" />
                        <input
                          id="email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="you@example.com"
                          required
                          className="w-full pl-9 pr-3 py-2.5 text-sm
                                     bg-sv-bg dark:bg-sv-dark-bg
                                     border border-sv-border dark:border-sv-dark-border
                                     rounded-[var(--radius-button)]
                                     text-sv-text dark:text-sv-dark-text
                                     placeholder:text-sv-secondary dark:placeholder:text-sv-dark-secondary
                                     focus:outline-none focus:ring-2
                                     focus:ring-sv-primary dark:focus:ring-sv-dark-primary
                                     focus:border-transparent
                                     transition-shadow duration-200"
                        />
                      </div>
                    </div>

                    {/* Send Magic Link button */}
                    <button
                      type="submit"
                      disabled={isEmailLoading || !email.trim()}
                      className="mt-3 w-full flex items-center justify-center gap-2
                                 py-2.5 px-4 text-sm font-semibold text-white rounded-[var(--radius-button)]
                                 bg-sv-primary hover:bg-sv-primary-hover
                                 dark:bg-sv-dark-primary dark:hover:bg-sv-dark-primary-hover
                                 disabled:opacity-50 disabled:cursor-not-allowed
                                 transition-colors duration-200 shadow-sm"
                    >
                      {isEmailLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Mail className="w-4 h-4" />
                      )}
                      {isEmailLoading ? 'Sending...' : 'Send Magic Link'}
                    </button>
                  </form>

                  {/* ── Divider ──────────────────────────────────────────── */}
                  <div className="relative flex items-center gap-3 mb-5">
                    <div className="flex-1 h-px bg-sv-border dark:bg-sv-dark-border" />
                    <span className="text-xs text-sv-secondary dark:text-sv-dark-secondary shrink-0">
                      or continue with
                    </span>
                    <div className="flex-1 h-px bg-sv-border dark:bg-sv-dark-border" />
                  </div>

                  {/* ── OAuth Buttons ─────────────────────────────────────── */}
                  <div className="flex flex-col gap-3">

                    {/* Google button */}
                    <button
                      onClick={handleGoogleSignIn}
                      disabled={isGoogleLoading}
                      className="w-full flex items-center justify-center gap-3
                                 py-2.5 px-4 text-sm font-medium rounded-[var(--radius-button)]
                                 bg-white dark:bg-sv-dark-bg
                                 border border-sv-border dark:border-sv-dark-border
                                 text-sv-text dark:text-sv-dark-text
                                 hover:bg-gray-50 dark:hover:bg-white/5
                                 disabled:opacity-50 disabled:cursor-not-allowed
                                 transition-colors duration-200 shadow-sm"
                    >
                      {isGoogleLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        /* Google's official G logo in SVG */
                        <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                          <path
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            fill="#4285F4"
                          />
                          <path
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            fill="#34A853"
                          />
                          <path
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                            fill="#FBBC05"
                          />
                          <path
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                            fill="#EA4335"
                          />
                        </svg>
                      )}
                      Continue with Google
                    </button>

                  </div>
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* ── Footer note ────────────────────────────────────────────────── */}
        <p className="text-center text-xs text-sv-secondary dark:text-sv-dark-secondary mt-5">
          By continuing, you agree to our{' '}
          <a href="/terms" className="underline hover:text-sv-text dark:hover:text-sv-dark-text transition-colors">
            Terms
          </a>{' '}
          and{' '}
          <a href="/privacy" className="underline hover:text-sv-text dark:hover:text-sv-dark-text transition-colors">
            Privacy Policy
          </a>
        </p>
      </motion.div>
    </div>
  )
}
