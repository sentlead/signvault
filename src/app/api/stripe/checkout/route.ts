/**
 * POST /api/stripe/checkout
 *
 * Creates a Stripe Checkout Session for a plan upgrade.
 * Body: { planId: "pro" | "business", interval: "monthly" | "yearly" }
 * Returns: { url: string } — redirect the user to this URL
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { stripe } from '@/lib/stripe'
import { PLANS } from '@/lib/plans'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { planId, interval } = body as { planId: string; interval: 'monthly' | 'yearly' }

  const plan = PLANS[planId as keyof typeof PLANS]
  if (!plan || plan.id === 'free') {
    return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
  }

  const priceId = interval === 'yearly' ? plan.stripePriceIdYearly : plan.stripePriceIdMonthly
  if (!priceId) {
    return NextResponse.json(
      { error: 'Stripe price not configured. Set STRIPE_PRO/BUSINESS_MONTHLY/YEARLY_PRICE_ID env vars.' },
      { status: 500 }
    )
  }

  // Fetch or create the Stripe customer for this user
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { stripeCustomerId: true, email: true, name: true },
  })

  let customerId = user?.stripeCustomerId ?? null

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user?.email ?? undefined,
      name: user?.name ?? undefined,
      metadata: { userId: session.user.id },
    })
    customerId = customer.id
    await prisma.user.update({
      where: { id: session.user.id },
      data: { stripeCustomerId: customerId },
    })
  }

  const baseUrl =
    process.env.NEXTAUTH_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')

  const checkoutSession = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${baseUrl}/dashboard?upgraded=1`,
    cancel_url: `${baseUrl}/pricing`,
    metadata: { userId: session.user.id, planId, interval },
  })

  return NextResponse.json({ url: checkoutSession.url })
}
