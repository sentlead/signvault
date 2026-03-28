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
import {
  Inter,
  Dancing_Script, Pacifico, Caveat, Sacramento,
  Great_Vibes, Satisfy, Kaushan_Script, Alex_Brush,
} from 'next/font/google'
import { Providers } from './providers'
import './globals.css'

// Load Inter font — subsets to Latin for performance
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

// Signature fonts — self-hosted via next/font, not preloaded (only needed in SignatureModal)
const dancingScript = Dancing_Script({
  subsets: ['latin'],
  weight: '700',
  variable: '--font-dancing-script',
  preload: false,
  display: 'swap',
})
const pacifico = Pacifico({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-pacifico',
  preload: false,
  display: 'swap',
})
const caveat = Caveat({
  subsets: ['latin'],
  weight: '700',
  variable: '--font-caveat',
  preload: false,
  display: 'swap',
})
const sacramento = Sacramento({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-sacramento',
  preload: false,
  display: 'swap',
})
const greatVibes = Great_Vibes({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-great-vibes',
  preload: false,
  display: 'swap',
})
const satisfy = Satisfy({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-satisfy',
  preload: false,
  display: 'swap',
})
const kaushanScript = Kaushan_Script({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-kaushan-script',
  preload: false,
  display: 'swap',
})
const alexBrush = Alex_Brush({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-alex-brush',
  preload: false,
  display: 'swap',
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
      className={`${inter.variable} ${dancingScript.variable} ${pacifico.variable} ${caveat.variable} ${sacramento.variable} ${greatVibes.variable} ${satisfy.variable} ${kaushanScript.variable} ${alexBrush.variable}`}
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
