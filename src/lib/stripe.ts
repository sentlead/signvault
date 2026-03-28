import Stripe from 'stripe'

// Lazily initialize so the build doesn't fail when STRIPE_SECRET_KEY isn't set.
// At runtime (API routes), the key must be present — an error will be thrown then.
let _stripe: Stripe | null = null

export function getStripe(): Stripe {
  if (_stripe) return _stripe
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) throw new Error('STRIPE_SECRET_KEY environment variable is not set')
  _stripe = new Stripe(key, { apiVersion: '2026-03-25.dahlia', typescript: true })
  return _stripe
}

// Convenience alias — same as calling getStripe() but as a getter.
// Use `stripe` directly in route handlers; don't import at module top-level in pages.
export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    return (getStripe() as unknown as Record<string | symbol, unknown>)[prop]
  },
})
