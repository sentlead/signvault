'use client'

/**
 * Sidebar.tsx — Dashboard Sidebar (Client Component)
 *
 * Shows:
 *   - SignVault logo with "beta" badge at the top
 *   - Navigation links with icons (active link highlighted)
 *   - User info + sign out button at the bottom
 *
 * On mobile: this sidebar is hidden by default and slides in as a drawer
 * when the hamburger button in DashboardNavbar is tapped. The open/close
 * state is communicated via a custom event so the two components stay decoupled.
 *
 * On desktop (lg+): always visible as a fixed left column.
 */

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { useEffect, useState, useCallback, startTransition } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  FileText,
  Send,
  Copy,
  Settings,
  LogOut,
  X,
  CreditCard,
  SendHorizonal,
} from 'lucide-react'
import { SignVaultLogo } from '@/components/ui/SignVaultLogo'

// Type for the session user passed from the server layout
interface SessionUser {
  id?: string
  name?: string | null
  email?: string | null
  image?: string | null
  plan?: string
}

interface SidebarProps {
  user: SessionUser
}

// Each nav item has a label, href, icon, and optional badge
const navItems = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    badge: null,
  },
  {
    label: 'My Documents',
    href: '/documents',
    icon: FileText,
    badge: null,
  },
  {
    label: 'Sent for Signing',
    href: '/documents?filter=sent',
    icon: Send,
    badge: null,
  },
  {
    label: 'Templates',
    href: '/templates',
    icon: Copy,
    badge: null,
  },
  {
    label: 'Bulk Send',
    href: '/bulk-send',
    icon: SendHorizonal,
    badge: null,
  },
  {
    label: 'Pricing & Plans',
    href: '/pricing',
    icon: CreditCard,
    badge: null,
  },
  {
    label: 'Settings',
    href: '/settings',
    icon: Settings,
    badge: null,
  },
]

// Build user initials from name or email for the avatar fallback
function getInitials(name?: string | null, email?: string | null): string {
  if (name) {
    const parts = name.trim().split(' ')
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    }
    return name[0].toUpperCase()
  }
  if (email) return email[0].toUpperCase()
  return '?'
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  // Mobile drawer open/close state
  const [mobileOpen, setMobileOpen] = useState(false)

  // Listen for the custom "toggle-sidebar" event fired by DashboardNavbar
  const handleToggle = useCallback(() => {
    setMobileOpen((v) => !v)
  }, [])

  useEffect(() => {
    window.addEventListener('toggle-sidebar', handleToggle)
    return () => window.removeEventListener('toggle-sidebar', handleToggle)
  }, [handleToggle])

  // Close drawer on route change (user tapped a link)
  useEffect(() => {
    startTransition(() => setMobileOpen(false))
  }, [pathname, searchParams])

  // Determine if a nav link is currently active
  function isActive(href: string): boolean {
    if (href === '/dashboard') return pathname === '/dashboard'
    if (href.includes('?')) {
      const [base, query] = href.split('?')
      const [key, val] = query.split('=')
      return pathname.startsWith(base) && searchParams.get(key) === val
    }
    return pathname.startsWith(href)
  }

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* ── Logo ───────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2.5 px-4 py-5 border-b border-sv-border dark:border-sv-dark-border">
        <Link href="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
          <SignVaultLogo size={32} />
          <span className="text-base font-bold tracking-tight text-sv-text dark:text-sv-dark-text">
            Sign<span className="text-sv-primary dark:text-sv-dark-primary">Vault</span>
          </span>
        </Link>
        {/* Beta badge */}
        <span className="ml-auto text-[10px] font-semibold uppercase tracking-widest
                         bg-sv-primary/10 dark:bg-sv-dark-primary/20
                         text-sv-primary dark:text-sv-dark-primary
                         px-1.5 py-0.5 rounded-full">
          beta
        </span>
      </div>

      {/* ── Navigation links ──────────────────────────────────────────────── */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map(({ label, href, icon: Icon, badge }) => {
          const active = isActive(href)
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-[8px] text-sm font-medium
                          transition-all duration-150 group
                          ${active
                            ? 'bg-sv-primary/10 dark:bg-sv-dark-primary/20 text-sv-primary dark:text-sv-dark-primary'
                            : 'text-sv-secondary dark:text-sv-dark-secondary hover:bg-sv-border/50 dark:hover:bg-sv-dark-border hover:text-sv-text dark:hover:text-sv-dark-text'
                          }`}
            >
              <Icon
                className={`w-4 h-4 flex-shrink-0 transition-colors
                  ${active ? 'text-sv-primary dark:text-sv-dark-primary' : 'group-hover:text-sv-text dark:group-hover:text-sv-dark-text'}`}
              />
              <span className="flex-1">{label}</span>
              {/* "Coming Soon" badge for future features */}
              {badge && (
                <span className="text-[10px] font-semibold uppercase tracking-widest
                                 bg-amber-100 dark:bg-amber-900/30
                                 text-amber-600 dark:text-amber-400
                                 px-1.5 py-0.5 rounded-full">
                  {badge}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* ── User info + Sign out ───────────────────────────────────────────── */}
      <div className="px-3 py-4 border-t border-sv-border dark:border-sv-dark-border">
        <div className="flex items-center gap-3 px-3 py-2 rounded-[8px]">
          {/* Avatar */}
          <div className="w-8 h-8 rounded-full flex-shrink-0 overflow-hidden
                          flex items-center justify-center
                          bg-sv-primary dark:bg-sv-dark-primary
                          text-white text-xs font-bold">
            {user.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.image} alt={user.name ?? 'Avatar'} className="w-full h-full object-cover" />
            ) : (
              getInitials(user.name, user.email)
            )}
          </div>
          {/* Name, plan badge, and email */}
          <div className="flex-1 min-w-0">
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
            <p className="text-[11px] text-sv-secondary dark:text-sv-dark-secondary truncate">
              {user.email}
            </p>
          </div>
        </div>
        {/* Sign out button */}
        <button
          onClick={() => signOut({ callbackUrl: '/' })}
          className="w-full mt-1 flex items-center gap-3 px-3 py-2.5 rounded-[8px] text-sm
                     text-sv-secondary dark:text-sv-dark-secondary
                     hover:bg-sv-border/50 dark:hover:bg-sv-dark-border
                     hover:text-sv-text dark:hover:text-sv-dark-text
                     transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* ── Desktop sidebar: fixed, always visible on lg+ ────────────────── */}
      <aside className="hidden lg:flex fixed top-0 left-0 h-full w-64 flex-col
                        bg-sv-surface dark:bg-sv-dark-surface
                        border-r border-sv-border dark:border-sv-dark-border
                        z-30">
        {sidebarContent}
      </aside>

      {/* ── Mobile drawer ────────────────────────────────────────────────── */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Backdrop overlay */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-black/50 lg:hidden"
              onClick={() => setMobileOpen(false)}
            />
            {/* Sliding drawer */}
            <motion.aside
              key="drawer"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed top-0 left-0 h-full w-64 z-50 flex flex-col
                         bg-sv-surface dark:bg-sv-dark-surface
                         border-r border-sv-border dark:border-sv-dark-border
                         lg:hidden"
            >
              {/* Close button inside drawer */}
              <button
                onClick={() => setMobileOpen(false)}
                className="absolute top-4 right-4 w-8 h-8 rounded-[8px]
                           flex items-center justify-center
                           text-sv-secondary dark:text-sv-dark-secondary
                           hover:bg-sv-border dark:hover:bg-sv-dark-border
                           transition-colors"
                aria-label="Close sidebar"
              >
                <X className="w-4 h-4" />
              </button>
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
