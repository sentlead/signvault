/**
 * sign/[token]/layout.tsx
 *
 * Simple layout for the external signer experience.
 * No dashboard navigation — just the SignVault logo at top and a footer.
 * This page is intentionally minimal so signers are not confused by app chrome.
 */

import type { ReactNode } from 'react'

interface SignLayoutProps {
  children: ReactNode
}

export default function SignLayout({ children }: SignLayoutProps) {
  return (
    <div className="min-h-screen bg-sv-bg dark:bg-sv-dark-bg flex flex-col">

      {/* ── Top bar — just the logo ─────────────────────────────────────── */}
      <header className="
        flex-shrink-0 flex items-center px-6 h-14
        bg-sv-surface dark:bg-sv-dark-surface
        border-b border-sv-border dark:border-sv-dark-border
      ">
        <span className="
          text-lg font-bold tracking-tight
          text-sv-primary dark:text-sv-dark-primary
        ">
          ✦ SignVault
        </span>
      </header>

      {/* ── Page content ───────────────────────────────────────────────── */}
      <main className="flex-1">
        {children}
      </main>

      {/* ── Footer ─────────────────────────────────────────────────────── */}
      <footer className="
        flex-shrink-0 flex items-center justify-center px-6 py-4
        border-t border-sv-border dark:border-sv-dark-border
      ">
        <p className="text-xs text-sv-secondary dark:text-sv-dark-secondary">
          Powered by{' '}
          <span className="font-semibold text-sv-primary dark:text-sv-dark-primary">
            SignVault
          </span>{' '}
          — secure document signing
        </p>
      </footer>
    </div>
  )
}
