'use client'

/**
 * Navbar.tsx
 *
 * The top navigation bar. Contains:
 *   - SignVault logo on the left
 *   - Auth-aware buttons on the right:
 *       • Not logged in: "Sign In" text link + "Get Started" button
 *       • Logged in: "Dashboard" link + user avatar (or initials circle)
 *   - Dark/light mode toggle button
 *
 * Uses `useSession` from next-auth/react to read the current auth state.
 * 'use client' is required because we use hooks (useTheme, useSession).
 */

import Link from 'next/link'
import { useTheme } from 'next-themes'
import { useSession, signOut } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sun, Moon, Vault, LayoutDashboard, LogOut } from 'lucide-react'

export function Navbar() {
  // next-themes: wait until mounted to avoid hydration mismatch
  const [mounted, setMounted] = useState(false)
  const { theme, setTheme } = useTheme()

  // next-auth: get the current session (null if not logged in)
  // status can be: "loading" | "authenticated" | "unauthenticated"
  const { data: session, status } = useSession()

  // Show/hide user dropdown menu
  const [showDropdown, setShowDropdown] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }

  // Get user initials for the avatar fallback (e.g. "John Doe" → "JD")
  function getInitials(name: string | null | undefined, email: string | null | undefined): string {
    if (name) {
      const parts = name.trim().split(' ')
      if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      }
      return name[0].toUpperCase()
    }
    if (email) {
      return email[0].toUpperCase()
    }
    return '?'
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 h-16 flex items-center px-6 md:px-12
                    bg-sv-bg/80 dark:bg-sv-dark-bg/80 backdrop-blur-md
                    border-b border-sv-border dark:border-sv-dark-border">

      {/* ── Logo ─────────────────────────────────────────────────────────── */}
      <Link href="/" className="flex items-center gap-2 select-none">
        <div className="w-8 h-8 rounded-[8px] bg-sv-primary dark:bg-sv-dark-primary
                        flex items-center justify-center shadow-sm">
          <Vault className="w-4 h-4 text-white" strokeWidth={2.5} />
        </div>
        <span className="text-lg font-bold tracking-tight text-sv-text dark:text-sv-dark-text">
          Sign<span className="text-sv-primary dark:text-sv-dark-primary">Vault</span>
        </span>
      </Link>

      {/* ── Spacer ───────────────────────────────────────────────────────── */}
      <div className="flex-1" />

      {/* ── Right side: Auth buttons + Theme toggle ──────────────────────── */}
      <div className="flex items-center gap-3">

        {/* Only render auth buttons after mount to prevent hydration mismatch */}
        {mounted && (
          <>
            {/* ── Loading state: show subtle skeleton ───────────────── */}
            {status === 'loading' && (
              <div className="w-20 h-8 rounded-[8px] bg-sv-border dark:bg-sv-dark-border animate-pulse" />
            )}

            {/* ── Not logged in: Sign In + Get Started ──────────────── */}
            {status === 'unauthenticated' && (
              <>
                <Link
                  href="/login"
                  className="text-sm font-medium text-sv-secondary dark:text-sv-dark-secondary
                             hover:text-sv-text dark:hover:text-sv-dark-text transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/login"
                  className="text-sm font-semibold text-white px-4 py-2
                             rounded-[var(--radius-button)]
                             bg-sv-primary hover:bg-sv-primary-hover
                             dark:bg-sv-dark-primary dark:hover:bg-sv-dark-primary-hover
                             transition-colors shadow-sm"
                >
                  Get Started
                </Link>
              </>
            )}

            {/* ── Logged in: Dashboard link + User avatar ────────────── */}
            {status === 'authenticated' && session && (
              <>
                {/* Dashboard link */}
                <Link
                  href="/dashboard"
                  className="flex items-center gap-1.5 text-sm font-medium
                             text-sv-secondary dark:text-sv-dark-secondary
                             hover:text-sv-text dark:hover:text-sv-dark-text transition-colors"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Dashboard
                </Link>

                {/* User avatar / initials — clicking opens dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setShowDropdown((v) => !v)}
                    aria-label="User menu"
                    className="w-8 h-8 rounded-full overflow-hidden
                               flex items-center justify-center
                               bg-sv-primary dark:bg-sv-dark-primary
                               text-white text-xs font-bold
                               hover:ring-2 hover:ring-sv-primary/50
                               dark:hover:ring-sv-dark-primary/50
                               transition-all focus:outline-none"
                  >
                    {session.user?.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={session.user.image}
                        alt={session.user.name ?? 'User avatar'}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      getInitials(session.user?.name, session.user?.email)
                    )}
                  </button>

                  {/* Dropdown menu */}
                  <AnimatePresence>
                    {showDropdown && (
                      <>
                        {/* Invisible backdrop to close dropdown on outside click */}
                        <div
                          className="fixed inset-0 z-10"
                          onClick={() => setShowDropdown(false)}
                        />
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95, y: -4 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95, y: -4 }}
                          transition={{ duration: 0.15 }}
                          className="absolute right-0 top-10 z-20 w-52
                                     bg-sv-surface dark:bg-sv-dark-surface
                                     border border-sv-border dark:border-sv-dark-border
                                     rounded-[var(--radius-card)] shadow-lg
                                     py-1 overflow-hidden"
                        >
                          {/* User info */}
                          <div className="px-3 py-2 border-b border-sv-border dark:border-sv-dark-border">
                            <p className="text-xs font-semibold text-sv-text dark:text-sv-dark-text truncate">
                              {session.user?.name ?? 'My Account'}
                            </p>
                            <p className="text-xs text-sv-secondary dark:text-sv-dark-secondary truncate">
                              {session.user?.email}
                            </p>
                          </div>

                          {/* Sign out */}
                          <button
                            onClick={() => {
                              setShowDropdown(false)
                              signOut({ callbackUrl: '/' })
                            }}
                            className="w-full flex items-center gap-2.5 px-3 py-2
                                       text-sm text-sv-secondary dark:text-sv-dark-secondary
                                       hover:bg-sv-bg dark:hover:bg-sv-dark-bg
                                       hover:text-sv-text dark:hover:text-sv-dark-text
                                       transition-colors"
                          >
                            <LogOut className="w-4 h-4" />
                            Sign out
                          </button>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>
              </>
            )}
          </>
        )}

        {/* ── Dark/Light Mode Toggle ───────────────────────────────────────── */}
        {mounted && (
          <button
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            className="w-9 h-9 rounded-[8px] flex items-center justify-center
                       bg-sv-surface dark:bg-sv-dark-surface
                       border border-sv-border dark:border-sv-dark-border
                       text-sv-secondary dark:text-sv-dark-secondary
                       hover:text-sv-primary dark:hover:text-sv-dark-primary
                       hover:border-sv-primary dark:hover:border-sv-dark-primary
                       shadow-sm transition-colors duration-200"
          >
            <AnimatePresence mode="wait" initial={false}>
              {theme === 'dark' ? (
                <motion.span
                  key="sun"
                  initial={{ opacity: 0, rotate: -90, scale: 0.5 }}
                  animate={{ opacity: 1, rotate: 0, scale: 1 }}
                  exit={{ opacity: 0, rotate: 90, scale: 0.5 }}
                  transition={{ duration: 0.2 }}
                >
                  <Sun className="w-4 h-4" />
                </motion.span>
              ) : (
                <motion.span
                  key="moon"
                  initial={{ opacity: 0, rotate: 90, scale: 0.5 }}
                  animate={{ opacity: 1, rotate: 0, scale: 1 }}
                  exit={{ opacity: 0, rotate: -90, scale: 0.5 }}
                  transition={{ duration: 0.2 }}
                >
                  <Moon className="w-4 h-4" />
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        )}
      </div>
    </nav>
  )
}
