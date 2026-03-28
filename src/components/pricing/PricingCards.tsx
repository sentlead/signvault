'use client'

/**
 * PricingCards.tsx — Interactive pricing cards with monthly/yearly toggle.
 *
 * Handles:
 *   - Toggle between monthly and yearly billing (yearly shows ~33% discount)
 *   - "Get Started" / "Upgrade" calls /api/stripe/checkout and redirects
 *   - "Manage Subscription" calls /api/stripe/portal and redirects
 *   - Current plan badge
 *   - Loading states on buttons
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { PlanConfig } from '@/lib/plans'
import { Check } from 'lucide-react'

interface PricingCardsProps {
  plans: PlanConfig[]
  currentPlan: string
  isSignedIn: boolean
}

function formatPrice(cents: number): string {
  if (cents === 0) return '$0'
  return `$${cents / 100}`
}

export function PricingCards({ plans, currentPlan, isSignedIn }: PricingCardsProps) {
  const router = useRouter()
  const [interval, setInterval] = useState<'monthly' | 'yearly'>('monthly')
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null)

  async function handleUpgrade(planId: string) {
    if (!isSignedIn) {
      router.push('/login?callbackUrl=/pricing')
      return
    }

    setLoadingPlan(planId)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId, interval }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        alert(data.error ?? 'Something went wrong. Please try again.')
      }
    } catch {
      alert('Something went wrong. Please try again.')
    } finally {
      setLoadingPlan(null)
    }
  }

  async function handleManage() {
    setLoadingPlan('manage')
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      }
    } catch {
      alert('Something went wrong. Please try again.')
    } finally {
      setLoadingPlan(null)
    }
  }

  const isPaid = currentPlan === 'pro' || currentPlan === 'business'

  return (
    <div className="max-w-5xl mx-auto">
      {/* ── Monthly / Yearly toggle ──────────────────────────────────────── */}
      <div className="flex items-center justify-center gap-3 mb-10">
        <span className={`text-sm font-medium ${interval === 'monthly' ? 'text-sv-text dark:text-sv-dark-text' : 'text-sv-secondary dark:text-sv-dark-secondary'}`}>
          Monthly
        </span>
        <button
          onClick={() => setInterval(interval === 'monthly' ? 'yearly' : 'monthly')}
          className={`relative w-12 h-6 rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-sv-primary ${
            interval === 'yearly' ? 'bg-sv-primary' : 'bg-sv-border dark:bg-sv-dark-border'
          }`}
          aria-label="Toggle billing interval"
        >
          <span
            className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
              interval === 'yearly' ? 'translate-x-6' : 'translate-x-0'
            }`}
          />
        </button>
        <span className={`text-sm font-medium ${interval === 'yearly' ? 'text-sv-text dark:text-sv-dark-text' : 'text-sv-secondary dark:text-sv-dark-secondary'}`}>
          Yearly
          <span className="ml-1.5 text-xs bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 px-1.5 py-0.5 rounded-full font-semibold">
            Save ~33%
          </span>
        </span>
      </div>

      {/* ── Plan cards ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const isCurrent = plan.id === currentPlan
          const isPro = plan.id === 'pro'
          const price = interval === 'yearly' ? plan.yearlyPrice : plan.monthlyPrice
          const planRank = { free: 0, pro: 1, business: 2 } as Record<string, number>
          const isDowngrade = (planRank[plan.id] ?? 0) < (planRank[currentPlan] ?? 0)

          return (
            <div
              key={plan.id}
              className={`relative flex flex-col rounded-[12px] border p-6 transition-shadow ${
                isPro
                  ? 'border-sv-primary dark:border-sv-dark-primary shadow-lg shadow-sv-primary/10'
                  : 'border-sv-border dark:border-sv-dark-border'
              } bg-sv-surface dark:bg-sv-dark-surface`}
            >
              {/* Popular badge */}
              {isPro && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-sv-primary text-white text-xs font-semibold px-3 py-1 rounded-full">
                    Most Popular
                  </span>
                </div>
              )}

              {/* Current plan badge */}
              {isCurrent && (
                <div className="absolute top-4 right-4">
                  <span className="bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 text-xs font-semibold px-2 py-0.5 rounded-full">
                    Current Plan
                  </span>
                </div>
              )}

              {/* Plan name & description */}
              <h3 className="text-lg font-bold text-sv-text dark:text-sv-dark-text mb-1">{plan.name}</h3>
              <p className="text-sm text-sv-secondary dark:text-sv-dark-secondary mb-5">{plan.description}</p>

              {/* Price */}
              <div className="mb-6">
                <span className="text-4xl font-bold text-sv-text dark:text-sv-dark-text">
                  {formatPrice(price)}
                </span>
                {price > 0 && (
                  <span className="text-sv-secondary dark:text-sv-dark-secondary text-sm ml-1">
                    /mo{interval === 'yearly' ? ', billed yearly' : ''}
                  </span>
                )}
              </div>

              {/* CTA Button */}
              {plan.id === 'free' ? (
                isCurrent ? (
                  <button
                    disabled
                    className="w-full py-2.5 rounded-[8px] text-sm font-semibold border border-sv-border dark:border-sv-dark-border text-sv-secondary dark:text-sv-dark-secondary cursor-default mb-6"
                  >
                    Current Plan
                  </button>
                ) : (
                  <button
                    disabled
                    className="w-full py-2.5 rounded-[8px] text-sm font-semibold border border-sv-border dark:border-sv-dark-border text-sv-secondary dark:text-sv-dark-secondary cursor-default mb-6"
                  >
                    Free Forever
                  </button>
                )
              ) : isCurrent ? (
                <button
                  onClick={handleManage}
                  disabled={loadingPlan === 'manage'}
                  className="w-full py-2.5 rounded-[8px] text-sm font-semibold border border-sv-primary dark:border-sv-dark-primary text-sv-primary dark:text-sv-dark-primary hover:bg-sv-primary/5 transition-colors disabled:opacity-50 mb-6"
                >
                  {loadingPlan === 'manage' ? 'Loading…' : 'Manage Subscription'}
                </button>
              ) : isDowngrade ? (
                <button
                  disabled
                  className="w-full py-2.5 rounded-[8px] text-sm font-semibold border border-sv-border dark:border-sv-dark-border text-sv-secondary dark:text-sv-dark-secondary cursor-default mb-6"
                >
                  Included in your plan
                </button>
              ) : (
                <button
                  onClick={() => handleUpgrade(plan.id)}
                  disabled={!!loadingPlan}
                  className={`w-full py-2.5 rounded-[8px] text-sm font-semibold transition-colors disabled:opacity-50 mb-6 ${
                    isPro
                      ? 'bg-sv-primary hover:bg-sv-primary-hover text-white'
                      : 'bg-sv-text dark:bg-sv-dark-text text-white dark:text-sv-dark-bg hover:opacity-90'
                  }`}
                >
                  {loadingPlan === plan.id ? 'Loading…' : isSignedIn ? 'Upgrade' : 'Get Started'}
                </button>
              )}

              {/* Feature list */}
              <ul className="space-y-2.5 flex-1">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-sv-secondary dark:text-sv-dark-secondary">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          )
        })}
      </div>

      {/* ── Manage subscription link (for paid users) ─────────────────────── */}
      {isPaid && (
        <p className="text-center text-sm text-sv-secondary dark:text-sv-dark-secondary mt-8">
          Want to change or cancel your plan?{' '}
          <button
            onClick={handleManage}
            className="text-sv-primary dark:text-sv-dark-primary underline underline-offset-2 hover:no-underline"
          >
            Manage your subscription
          </button>
        </p>
      )}
    </div>
  )
}
