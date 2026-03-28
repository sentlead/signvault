/**
 * POST /api/stripe/webhook
 *
 * Handles Stripe webhook events to keep the database in sync with subscription state.
 *
 * Events handled:
 *   checkout.session.completed   → activate subscription after successful payment
 *   customer.subscription.updated → sync plan, status, and period end
 *   customer.subscription.deleted → downgrade user back to free
 *   invoice.payment_failed        → mark subscription as past_due
 *
 * Set STRIPE_WEBHOOK_SECRET to your webhook signing secret from the Stripe dashboard.
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { stripe } from '@/lib/stripe'
import type Stripe from 'stripe'

// Map Stripe subscription status to our internal status string
function mapStatus(stripeStatus: Stripe.Subscription['status']): string {
  switch (stripeStatus) {
    case 'active':
    case 'trialing':
      return 'active'
    case 'past_due':
      return 'past_due'
    case 'canceled':
    case 'unpaid':
    case 'paused':
      return 'canceled'
    default:
      return 'inactive'
  }
}

// Determine plan from Stripe subscription (looks at price metadata or product name)
async function planFromSubscription(subscription: Stripe.Subscription): Promise<string> {
  try {
    const priceId = subscription.items.data[0]?.price?.id
    if (!priceId) return 'free'

    // Check against our configured price IDs
    if (
      priceId === process.env.STRIPE_PRO_MONTHLY_PRICE_ID ||
      priceId === process.env.STRIPE_PRO_YEARLY_PRICE_ID
    ) {
      return 'pro'
    }
    if (
      priceId === process.env.STRIPE_BUSINESS_MONTHLY_PRICE_ID ||
      priceId === process.env.STRIPE_BUSINESS_YEARLY_PRICE_ID
    ) {
      return 'business'
    }
  } catch {
    // Fall through to free
  }
  return 'free'
}

export async function POST(req: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 })
  }

  const body = await req.text()
  const signature = req.headers.get('stripe-signature')
  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret)
  } catch (err) {
    console.error('[webhook] Signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  try {
    switch (event.type) {
      // ── Checkout completed: first-time subscription activated ───────────────
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        if (session.mode !== 'subscription') break

        const userId = session.metadata?.userId
        const planId = session.metadata?.planId ?? 'free'
        const interval = session.metadata?.interval ?? 'monthly'
        const subscriptionId = session.subscription as string

        if (!userId) break

        // Fetch full subscription to get period end
        const subscription = await stripe.subscriptions.retrieve(subscriptionId)

        await prisma.user.update({
          where: { id: userId },
          data: {
            plan: planId,
            billingInterval: interval,
            stripeSubscriptionId: subscriptionId,
            subscriptionStatus: 'active',
            // current_period_end moved to subscription items in newer Stripe API versions
            currentPeriodEnd: subscription.items.data[0]?.current_period_end
              ? new Date(subscription.items.data[0].current_period_end * 1000)
              : null,
          },
        })
        break
      }

      // ── Subscription updated: plan change, renewal, or pause ────────────────
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string

        const user = await prisma.user.findFirst({
          where: { stripeCustomerId: customerId },
          select: { id: true },
        })
        if (!user) break

        const plan = await planFromSubscription(subscription)
        const interval =
          subscription.items.data[0]?.price?.recurring?.interval === 'year' ? 'yearly' : 'monthly'

        await prisma.user.update({
          where: { id: user.id },
          data: {
            plan,
            billingInterval: interval,
            stripeSubscriptionId: subscription.id,
            subscriptionStatus: mapStatus(subscription.status),
            currentPeriodEnd: subscription.items.data[0]?.current_period_end
              ? new Date(subscription.items.data[0].current_period_end * 1000)
              : null,
          },
        })
        break
      }

      // ── Subscription deleted: downgrade back to free ─────────────────────────
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string

        const user = await prisma.user.findFirst({
          where: { stripeCustomerId: customerId },
          select: { id: true },
        })
        if (!user) break

        await prisma.user.update({
          where: { id: user.id },
          data: {
            plan: 'free',
            billingInterval: null,
            stripeSubscriptionId: null,
            subscriptionStatus: 'canceled',
            currentPeriodEnd: null,
          },
        })
        break
      }

      // ── Payment failed: mark as past_due ────────────────────────────────────
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        const customerId = invoice.customer as string

        const user = await prisma.user.findFirst({
          where: { stripeCustomerId: customerId },
          select: { id: true },
        })
        if (!user) break

        await prisma.user.update({
          where: { id: user.id },
          data: { subscriptionStatus: 'past_due' },
        })
        break
      }

      default:
        // Ignore unhandled event types
        break
    }
  } catch (err) {
    console.error(`[webhook] Error handling event ${event.type}:`, err)
    return NextResponse.json({ error: 'Webhook handler error' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
