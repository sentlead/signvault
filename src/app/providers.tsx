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
