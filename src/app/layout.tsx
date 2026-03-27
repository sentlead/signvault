/**
 * layout.tsx — Root Layout (Server Component)
 *
 * This is the outermost shell of the entire application.
 * It sets up:
 *   - The Inter font via next/font (fast, self-hosted, no external requests)
 *   - The ThemeProvider (dark/light mode) via Providers wrapper
 *   - HTML metadata (title, description)
 *
 * Note: This file does NOT have 'use client' — it stays a Server Component.
 * Interactive providers are wrapped in src/app/providers.tsx.
 */

import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Providers } from './providers'
import './globals.css'

// Load Inter font — subsets to Latin for performance
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',   // CSS variable used in globals.css @theme
  display: 'swap',            // Show fallback font while Inter loads
})

export const metadata: Metadata = {
  title: 'SignVault — Free Online Document Signing',
  description:
    'Sign documents for free. Upload PDFs, place signature fields, sign digitally, and send to others. No subscription required.',
  keywords: 'document signing, e-signature, free PDF signing, digital signature',
  openGraph: {
    title: 'SignVault — Free Online Document Signing',
    description: 'Sign documents for free. No subscription required.',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={inter.variable}
      suppressHydrationWarning // Required by next-themes to avoid SSR mismatch
    >
      <body className="min-h-screen antialiased bg-sv-bg dark:bg-sv-dark-bg text-sv-text dark:text-sv-dark-text">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
