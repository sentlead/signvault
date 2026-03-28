/**
 * Footer.tsx
 *
 * The bottom footer of the landing page. Contains:
 *   - SignVault logo and tagline on the left
 *   - Navigation links (Privacy Policy, Terms, Contact) on the right
 *   - Copyright line at the bottom
 *
 * This is a Server Component (no 'use client') since it has no interactivity.
 */

import { SignVaultLogo } from '@/components/ui/SignVaultLogo'

const footerLinks = [
  { label: 'Privacy Policy', href: '/privacy' },
  { label: 'Terms of Service', href: '/terms' },
  { label: 'Contact', href: '/contact' },
]

const currentYear = new Date().getFullYear()

export function Footer() {
  return (
    <footer className="border-t border-sv-border dark:border-sv-dark-border
                       bg-sv-surface dark:bg-sv-dark-surface">

      {/* ── Main footer row ───────────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-6 py-10
                      flex flex-col md:flex-row items-center md:items-start
                      gap-6 md:gap-0 justify-between">

        {/* ── Logo + tagline ────────────────────────────────────────────── */}
        <div className="flex flex-col items-center md:items-start gap-2">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <SignVaultLogo size={28} />
            <span className="text-base font-bold text-sv-text dark:text-sv-dark-text">
              Sign<span className="text-sv-primary dark:text-sv-dark-primary">Vault</span>
            </span>
          </div>

          {/* Tagline */}
          <p className="text-sm text-sv-secondary dark:text-sv-dark-secondary text-center md:text-left max-w-[220px]">
            Sign documents for free. No tricks, no subscriptions.
          </p>
        </div>

        {/* ── Navigation links ──────────────────────────────────────────── */}
        <nav aria-label="Footer navigation">
          <ul className="flex flex-row flex-wrap items-center justify-center gap-6">
            {footerLinks.map((link) => (
              <li key={link.label}>
                <a
                  href={link.href}
                  className="text-sm text-sv-secondary dark:text-sv-dark-secondary
                             hover:text-sv-primary dark:hover:text-sv-dark-primary
                             transition-colors duration-200"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      {/* ── Copyright bar ─────────────────────────────────────────────────── */}
      <div className="border-t border-sv-border dark:border-sv-dark-border py-4 px-6">
        <p className="text-center text-xs text-sv-secondary dark:text-sv-dark-secondary">
          &copy; {currentYear} SignVault. All rights reserved.
        </p>
      </div>
    </footer>
  )
}
