'use client'

/**
 * DashboardNavbar.tsx — Top Navbar for Dashboard Pages (Client Component)
 *
 * Contains:
 *   - Hamburger button (mobile only) — fires a custom event to toggle the sidebar
 *   - Search bar (UI only, not functional yet)
 *   - Dark/light mode toggle
 *   - User avatar with dropdown (name, email, Settings link, Sign out)
 *
 * Stays sticky at the top of the right-hand content column.
 */

import Link from 'next/link'
import { useTheme } from 'next-themes'
import { signOut } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, Search, Sun, Moon, Settings, LogOut } from 'lucide-react'

interface SessionUser {
  id?: string
  name?: string | null
  email?: string | null
  image?: string | null
  plan?: string
}

interface DashboardNavbarProps {
  user: SessionUser
}

function getInitials(name?: string | null, email?: string | null): string {
  if (name) {
    const parts = name.trim().split(' ')
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    return name[0].toUpperCase()
  }
  if (email) return email[0].toUpperCase()
  return '?'
}

export function DashboardNavbar({ user }: DashboardNavbarProps) {
  const [mounted, setMounted] = useState(false)
  const { theme, setTheme } = useTheme()
  const [showDropdown, setShowDropdown] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Fire a custom window event so the Sidebar component can open/close its drawer
  function toggleSidebar() {
    window.dispatchEvent(new Event('toggle-sidebar'))
  }

  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark')

  return (
    <header className="sticky top-0 z-20 h-14 flex items-center gap-3 px-4 md:px-6
                       bg-sv-surface/80 dark:bg-sv-dark-surface/80 backdrop-blur-md
                       border-b border-sv-border dark:border-sv-dark-border">

      {/* ── Hamburger (mobile only) ───────────────────────────────────────── */}
      <button
        onClick={toggleSidebar}
        aria-label="Open sidebar"
        className="lg:hidden w-9 h-9 rounded-[8px] flex items-center justify-center
                   text-sv-secondary dark:text-sv-dark-secondary
                   hover:bg-sv-border dark:hover:bg-sv-dark-border
                   transition-colors"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* ── Search bar (UI only) ─────────────────────────────────────────── */}
      <div className="flex-1 max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4
                             text-sv-secondary dark:text-sv-dark-secondary pointer-events-none" />
          <input
            type="search"
            placeholder="Search documents..."
            className="w-full h-9 pl-9 pr-4 rounded-[8px] text-sm
                       bg-sv-bg dark:bg-sv-dark-bg
                       border border-sv-border dark:border-sv-dark-border
                       text-sv-text dark:text-sv-dark-text
                       placeholder:text-sv-secondary dark:placeholder:text-sv-dark-secondary
                       focus:outline-none focus:border-sv-primary dark:focus:border-sv-dark-primary
                       transition-colors"
          />
        </div>
      </div>

      {/* ── Spacer ───────────────────────────────────────────────────────── */}
      <div className="flex-1" />

      {/* ── Right: theme toggle + avatar ─────────────────────────────────── */}
      <div className="flex items-center gap-2">

        {/* Dark/light toggle */}
        {mounted && (
          <button
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            className="w-9 h-9 rounded-[8px] flex items-center justify-center
                       border border-sv-border dark:border-sv-dark-border
                       text-sv-secondary dark:text-sv-dark-secondary
                       hover:text-sv-primary dark:hover:text-sv-dark-primary
                       hover:border-sv-primary dark:hover:border-sv-dark-primary
                       transition-colors duration-200"
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

        {/* User avatar + dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowDropdown((v) => !v)}
            aria-label="User menu"
            className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center
                       bg-sv-primary dark:bg-sv-dark-primary text-white text-xs font-bold
                       hover:ring-2 hover:ring-sv-primary/40 dark:hover:ring-sv-dark-primary/40
                       transition-all focus:outline-none"
          >
            {user.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.image} alt={user.name ?? 'User'} className="w-full h-full object-cover" />
            ) : (
              getInitials(user.name, user.email)
            )}
          </button>

          <AnimatePresence>
            {showDropdown && (
              <>
                {/* Click outside to close */}
                <div className="fixed inset-0 z-10" onClick={() => setShowDropdown(false)} />
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -4 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-10 z-20 w-56
                             bg-sv-surface dark:bg-sv-dark-surface
                             border border-sv-border dark:border-sv-dark-border
                             rounded-[var(--radius-card)] shadow-lg py-1 overflow-hidden"
                >
                  {/* Name + email + plan */}
                  <div className="px-3 py-2.5 border-b border-sv-border dark:border-sv-dark-border">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <p className="text-xs font-semibold text-sv-text dark:text-sv-dark-text truncate">
                        {user.name ?? 'My Account'}
                      </p>
                      {user.plan && user.plan !== 'free' && (
                        <span className={`flex-shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wide ${
                          user.plan === 'business'
                            ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400'
                            : 'bg-sv-primary/10 dark:bg-sv-dark-primary/20 text-sv-primary dark:text-sv-dark-primary'
                        }`}>
                          {user.plan}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-sv-secondary dark:text-sv-dark-secondary truncate">
                      {user.email}
                    </p>
                  </div>

                  {/* Settings link */}
                  <Link
                    href="/settings"
                    onClick={() => setShowDropdown(false)}
                    className="flex items-center gap-2.5 px-3 py-2 text-sm
                               text-sv-secondary dark:text-sv-dark-secondary
                               hover:bg-sv-bg dark:hover:bg-sv-dark-bg
                               hover:text-sv-text dark:hover:text-sv-dark-text
                               transition-colors"
                  >
                    <Settings className="w-4 h-4" />
                    Settings
                  </Link>

                  {/* Sign out */}
                  <button
                    onClick={() => {
                      setShowDropdown(false)
                      signOut({ callbackUrl: '/' })
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm
                               text-sv-secondary dark:text-sv-dark-secondary
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
      </div>
    </header>
  )
}
