'use client'

/**
 * providers.tsx
 *
 * Wraps the entire app in the context providers it needs:
 *
 *   1. ThemeProvider (from next-themes) — enables dark/light mode switching.
 *      It reads the user's OS preference and localStorage, and adds/removes
 *      `class="dark"` on the <html> element.
 *
 *   2. SessionProvider (from next-auth/react) — makes the current auth session
 *      available to all Client Components via the `useSession()` hook.
 *
 * We keep this in a separate file because both providers require 'use client',
 * but we want the root layout to remain a Server Component.
 */

import { ThemeProvider } from 'next-themes'
import { SessionProvider } from 'next-auth/react'
import { ToastContainer } from '@/components/ui/Toast'

// next-themes 0.4.x renders an inline <script> to prevent flash-of-wrong-theme
// during SSR. React 19 warns about <script> tags inside client component trees
// even though this usage is intentional and harmless (the script only needs to
// run server-side). The warning fires during render, so it must be suppressed at
// module evaluation time — before React reconciles anything.
// Remove this once next-themes ships a React 19 compatible release.
if (typeof window !== 'undefined') {
  const _orig = console.error.bind(console)
  console.error = (...args: unknown[]) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Encountered a script tag while rendering React component')
    ) return
    _orig(...args)
  }
}

interface ProvidersProps {
  children: React.ReactNode
}

export function Providers({ children }: ProvidersProps) {
  return (
    <SessionProvider>
      <ThemeProvider
        attribute="class"       // Adds class="dark" to <html>
        defaultTheme="system"   // Respects OS preference by default
        enableSystem={true}     // Detect system dark/light preference
        disableTransitionOnChange={false} // Allow CSS transitions on theme change
      >
        {children}
        {/*
         * ToastContainer lives here — outside all page content — so it
         * always renders on top of everything and is never unmounted
         * during navigation. It listens for "signvault:toast" window
         * events and stacks toast pills in the top-right corner.
         */}
        <ToastContainer />
      </ThemeProvider>
    </SessionProvider>
  )
}
