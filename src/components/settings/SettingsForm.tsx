'use client'

import { useState } from 'react'
import { User, Mail, Calendar, Globe, CreditCard, Zap, CheckCircle2, AlertCircle, XCircle } from 'lucide-react'
import { toast } from '@/lib/toast'
import { PLANS } from '@/lib/plans'
import Link from 'next/link'

interface Props {
  user: {
    id: string
    name: string | null
    email: string | null
    image: string | null
    createdAt: Date
    plan: string
    billingInterval: string | null
    subscriptionStatus: string | null
    currentPeriodEnd: Date | null
    stripeCustomerId: string | null
  }
}

function PlanBadge({ plan }: { plan: string }) {
  if (plan === 'business') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400">
        Business
      </span>
    )
  }
  if (plan === 'pro') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-sv-primary/10 dark:bg-sv-dark-primary/20 text-sv-primary dark:text-sv-dark-primary">
        Pro
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-sv-border dark:bg-sv-dark-border text-sv-secondary dark:text-sv-dark-secondary">
      Free
    </span>
  )
}

function StatusBadge({ status }: { status: string | null }) {
  if (status === 'active') {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600 dark:text-green-400">
        <CheckCircle2 className="w-3.5 h-3.5" /> Active
      </span>
    )
  }
  if (status === 'past_due') {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 dark:text-amber-400">
        <AlertCircle className="w-3.5 h-3.5" /> Payment past due
      </span>
    )
  }
  if (status === 'canceled') {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-red-500 dark:text-red-400">
        <XCircle className="w-3.5 h-3.5" /> Canceled
      </span>
    )
  }
  return null
}

export function SettingsForm({ user }: Props) {
  const [name, setName] = useState(user.name ?? '')
  const [saving, setSaving] = useState(false)
  const [managingBilling, setManagingBilling] = useState(false)

  const plan = PLANS[user.plan as keyof typeof PLANS] ?? PLANS.free
  const isPaid = user.plan === 'pro' || user.plan === 'business'

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch('/api/user', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      })
      if (!res.ok) throw new Error('Failed to save')
      toast.success('Profile updated!')
    } catch {
      toast.error('Could not save changes. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  async function handleManageBilling() {
    setManagingBilling(true)
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' })
      const data = await res.json()
      if (data.url) window.location.href = data.url
    } catch {
      toast.error('Could not open billing portal. Please try again.')
    } finally {
      setManagingBilling(false)
    }
  }

  return (
    <div className="space-y-6">

      {/* ── Profile card ─────────────────────────────────────────────────── */}
      <div className="bg-sv-surface dark:bg-sv-dark-surface rounded-[var(--radius-card)]
                      border border-sv-border dark:border-sv-dark-border p-6">
        <h2 className="text-sm font-semibold text-sv-text dark:text-sv-dark-text mb-5">
          Profile
        </h2>

        {/* Avatar */}
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full overflow-hidden flex-shrink-0
                          bg-sv-primary dark:bg-sv-dark-primary
                          flex items-center justify-center text-white text-xl font-bold">
            {user.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.image} alt={user.name ?? 'Avatar'} className="w-full h-full object-cover" />
            ) : (
              (user.name?.[0] ?? user.email?.[0] ?? '?').toUpperCase()
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-sv-text dark:text-sv-dark-text">
                {user.name ?? 'No name set'}
              </p>
              <PlanBadge plan={user.plan} />
            </div>
            <p className="text-xs text-sv-secondary dark:text-sv-dark-secondary mt-0.5">
              {user.email}
            </p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          {/* Display name */}
          <div>
            <label className="block text-xs font-medium text-sv-secondary dark:text-sv-dark-secondary mb-1.5">
              Display name
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4
                               text-sv-secondary dark:text-sv-dark-secondary pointer-events-none" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="w-full pl-9 pr-4 py-2.5 text-sm rounded-[var(--radius-input)]
                           bg-sv-bg dark:bg-sv-dark-bg
                           border border-sv-border dark:border-sv-dark-border
                           text-sv-text dark:text-sv-dark-text
                           placeholder:text-sv-secondary dark:placeholder:text-sv-dark-secondary
                           focus:outline-none focus:ring-2 focus:ring-sv-primary dark:focus:ring-sv-dark-primary
                           transition"
              />
            </div>
          </div>

          {/* Email (read-only) */}
          <div>
            <label className="block text-xs font-medium text-sv-secondary dark:text-sv-dark-secondary mb-1.5">
              Email address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4
                               text-sv-secondary dark:text-sv-dark-secondary pointer-events-none" />
              <input
                type="email"
                value={user.email ?? ''}
                readOnly
                className="w-full pl-9 pr-4 py-2.5 text-sm rounded-[var(--radius-input)]
                           bg-sv-border/30 dark:bg-sv-dark-border/30
                           border border-sv-border dark:border-sv-dark-border
                           text-sv-secondary dark:text-sv-dark-secondary
                           cursor-not-allowed"
              />
            </div>
            <p className="mt-1 text-xs text-sv-secondary dark:text-sv-dark-secondary">
              Email is managed by your sign-in provider and cannot be changed here.
            </p>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2.5 rounded-[var(--radius-input)] text-sm font-medium
                       bg-sv-primary dark:bg-sv-dark-primary text-white
                       hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </form>
      </div>

      {/* ── Subscription card ─────────────────────────────────────────────── */}
      <div className="bg-sv-surface dark:bg-sv-dark-surface rounded-[var(--radius-card)]
                      border border-sv-border dark:border-sv-dark-border p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-sm font-semibold text-sv-text dark:text-sv-dark-text">
            Subscription
          </h2>
          <CreditCard className="w-4 h-4 text-sv-secondary dark:text-sv-dark-secondary" />
        </div>

        {/* Current plan row */}
        <div className="flex items-center justify-between py-3 border-b border-sv-border dark:border-sv-dark-border">
          <div>
            <p className="text-xs font-medium text-sv-text dark:text-sv-dark-text">Current plan</p>
            <div className="flex items-center gap-2 mt-1">
              <PlanBadge plan={user.plan} />
              {isPaid && <StatusBadge status={user.subscriptionStatus} />}
            </div>
          </div>
          {isPaid ? (
            <button
              onClick={handleManageBilling}
              disabled={managingBilling}
              className="text-xs font-medium text-sv-primary dark:text-sv-dark-primary
                         hover:underline disabled:opacity-50 transition-opacity"
            >
              {managingBilling ? 'Loading…' : 'Manage billing'}
            </button>
          ) : (
            <Link
              href="/pricing"
              className="inline-flex items-center gap-1 text-xs font-semibold
                         bg-sv-primary dark:bg-sv-dark-primary text-white
                         px-3 py-1.5 rounded-[6px] hover:opacity-90 transition-opacity"
            >
              <Zap className="w-3 h-3" /> Upgrade
            </Link>
          )}
        </div>

        {/* Billing interval */}
        {isPaid && user.billingInterval && (
          <div className="flex items-center justify-between py-3 border-b border-sv-border dark:border-sv-dark-border">
            <p className="text-xs font-medium text-sv-text dark:text-sv-dark-text">Billing</p>
            <p className="text-xs text-sv-secondary dark:text-sv-dark-secondary capitalize">
              {user.billingInterval === 'yearly'
                ? `$${plan.yearlyPrice / 100}/mo · billed yearly`
                : `$${plan.monthlyPrice / 100}/mo · billed monthly`}
            </p>
          </div>
        )}

        {/* Next renewal */}
        {isPaid && user.currentPeriodEnd && user.subscriptionStatus === 'active' && (
          <div className="flex items-center justify-between py-3 border-b border-sv-border dark:border-sv-dark-border">
            <p className="text-xs font-medium text-sv-text dark:text-sv-dark-text">Next renewal</p>
            <p className="text-xs text-sv-secondary dark:text-sv-dark-secondary">
              {new Date(user.currentPeriodEnd).toLocaleDateString('en-GB', {
                day: 'numeric', month: 'long', year: 'numeric',
              })}
            </p>
          </div>
        )}

        {/* Plan features summary */}
        <div className="pt-3 space-y-1.5">
          {plan.features.slice(0, 4).map((f) => (
            <div key={f} className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
              <p className="text-xs text-sv-secondary dark:text-sv-dark-secondary">{f}</p>
            </div>
          ))}
          {!isPaid && (
            <p className="text-xs text-sv-secondary dark:text-sv-dark-secondary pt-1">
              <Link href="/pricing" className="text-sv-primary dark:text-sv-dark-primary underline underline-offset-2">
                View all plans
              </Link>{' '}to unlock more features.
            </p>
          )}
        </div>
      </div>

      {/* ── Account info card ─────────────────────────────────────────────── */}
      <div className="bg-sv-surface dark:bg-sv-dark-surface rounded-[var(--radius-card)]
                      border border-sv-border dark:border-sv-dark-border p-6">
        <h2 className="text-sm font-semibold text-sv-text dark:text-sv-dark-text mb-5">
          Account
        </h2>
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Globe className="w-4 h-4 text-sv-secondary dark:text-sv-dark-secondary flex-shrink-0" />
            <div>
              <p className="text-xs font-medium text-sv-text dark:text-sv-dark-text">Sign-in method</p>
              <p className="text-xs text-sv-secondary dark:text-sv-dark-secondary">Google OAuth</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Calendar className="w-4 h-4 text-sv-secondary dark:text-sv-dark-secondary flex-shrink-0" />
            <div>
              <p className="text-xs font-medium text-sv-text dark:text-sv-dark-text">Member since</p>
              <p className="text-xs text-sv-secondary dark:text-sv-dark-secondary">
                {new Date(user.createdAt).toLocaleDateString('en-GB', {
                  day: 'numeric', month: 'long', year: 'numeric',
                })}
              </p>
            </div>
          </div>
        </div>
      </div>

    </div>
  )
}
