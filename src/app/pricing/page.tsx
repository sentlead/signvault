/**
 * /pricing — Pricing page (Server Component shell + Client Component for interactivity)
 *
 * Shows three plan cards (Free / Pro / Business) with a monthly/yearly toggle.
 * Authenticated users see their current plan highlighted and can upgrade via Stripe Checkout.
 * Paid users see a "Manage Subscription" button that opens the Stripe Customer Portal.
 */

import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { PricingCards } from '@/components/pricing/PricingCards'
import { PLANS } from '@/lib/plans'

export const metadata = {
  title: 'Pricing — SignVault',
  description: 'Simple, transparent pricing for individuals and teams.',
}

export default async function PricingPage() {
  const session = await auth()
  let currentPlan = 'free'
  if (session?.user?.id) {
    const dbUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { plan: true },
    })
    currentPlan = dbUser?.plan ?? 'free'
  }

  const plans = [PLANS.free, PLANS.pro, PLANS.business]

  return (
    <div className="min-h-screen bg-sv-bg dark:bg-sv-dark-bg flex flex-col">
      <Navbar />

      <main className="flex-1 px-4 py-16 md:py-24">
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-sv-text dark:text-sv-dark-text mb-4">
            Simple, transparent pricing
          </h1>
          <p className="text-lg text-sv-secondary dark:text-sv-dark-secondary max-w-xl mx-auto">
            Start free. Upgrade when you need more. Cancel any time.
          </p>
        </div>

        {/* ── Pricing cards with toggle — client component ───────────────── */}
        <PricingCards plans={plans} currentPlan={currentPlan} isSignedIn={!!session?.user} />

        {/* ── Feature comparison table ────────────────────────────────────── */}
        <div className="max-w-4xl mx-auto mt-20">
          <h2 className="text-2xl font-semibold text-sv-text dark:text-sv-dark-text text-center mb-8">
            Compare plans
          </h2>
          <div className="overflow-x-auto rounded-[12px] border border-sv-border dark:border-sv-dark-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-sv-surface dark:bg-sv-dark-surface border-b border-sv-border dark:border-sv-dark-border">
                  <th className="text-left px-6 py-4 font-semibold text-sv-text dark:text-sv-dark-text">Feature</th>
                  <th className="px-6 py-4 font-semibold text-sv-text dark:text-sv-dark-text text-center">Free</th>
                  <th className="px-6 py-4 font-semibold text-sv-primary dark:text-sv-dark-primary text-center">Pro</th>
                  <th className="px-6 py-4 font-semibold text-sv-text dark:text-sv-dark-text text-center">Business</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sv-border dark:divide-sv-dark-border">
                {COMPARISON_ROWS.map((row) => (
                  <tr key={row.feature} className="bg-sv-bg dark:bg-sv-dark-bg hover:bg-sv-surface dark:hover:bg-sv-dark-surface transition-colors">
                    <td className="px-6 py-4 text-sv-text dark:text-sv-dark-text">{row.feature}</td>
                    <td className="px-6 py-4 text-center text-sv-secondary dark:text-sv-dark-secondary">{row.free}</td>
                    <td className="px-6 py-4 text-center text-sv-secondary dark:text-sv-dark-secondary">{row.pro}</td>
                    <td className="px-6 py-4 text-center text-sv-secondary dark:text-sv-dark-secondary">{row.business}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

const CHECK = '✓'
const DASH = '—'

const COMPARISON_ROWS = [
  { feature: 'Documents per month',        free: '5',          pro: 'Unlimited',   business: 'Unlimited' },
  { feature: 'Max file size',              free: '10 MB',      pro: '50 MB',        business: '100 MB' },
  { feature: 'Signers per document',       free: 'Up to 3',    pro: 'Up to 10',     business: 'Up to 25' },
  { feature: 'Saved templates',           free: '3',          pro: 'Unlimited',   business: 'Unlimited' },
  { feature: 'Email notifications',        free: CHECK,        pro: CHECK,         business: CHECK },
  { feature: 'Audit trail',               free: CHECK,        pro: CHECK,         business: CHECK },
  { feature: 'Configurable expiry',        free: '7 days only', pro: '7–90 days',  business: '7–90 days' },
  { feature: 'Auto-reminders',             free: DASH,         pro: CHECK,         business: CHECK },
  { feature: 'Ad-free experience',         free: DASH,         pro: CHECK,         business: CHECK },
  { feature: 'Bulk send (CSV)',            free: DASH,         pro: DASH,          business: CHECK },
  { feature: 'Team accounts & roles',      free: DASH,         pro: DASH,          business: CHECK },
  { feature: 'Custom branding',            free: DASH,         pro: DASH,          business: CHECK },
  { feature: 'Saved contacts',             free: DASH,         pro: DASH,          business: CHECK },
]
