// Plan configuration for SignVault subscription tiers

export type PlanId = 'free' | 'pro' | 'business'

export interface PlanConfig {
  id: PlanId
  name: string
  description: string
  monthlyPrice: number  // USD cents
  yearlyPrice: number   // USD cents per month (billed annually)
  stripePriceIdMonthly: string | null
  stripePriceIdYearly: string | null
  limits: {
    documentsPerMonth: number  // -1 = unlimited
    maxFileSizeMB: number
    maxSignersPerDocument: number
    savedTemplates: number     // -1 = unlimited
    expiryDays: number         // days until document expires; -1 = never expires
  }
  features: string[]
}

export const PLANS: Record<PlanId, PlanConfig> = {
  free: {
    id: 'free',
    name: 'Free',
    description: 'Perfect for individuals with occasional signing needs',
    monthlyPrice: 0,
    yearlyPrice: 0,
    stripePriceIdMonthly: null,
    stripePriceIdYearly: null,
    limits: {
      documentsPerMonth: 5,
      maxFileSizeMB: 10,
      maxSignersPerDocument: 3,
      savedTemplates: 3,
      expiryDays: 7,           // free plan: forced 7-day expiry, non-configurable
    },
    features: [
      '5 documents per month',
      'Up to 3 signers per document',
      '10 MB file size limit',
      '3 saved templates',
      'Email notifications',
      'Audit trail',
    ],
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    description: 'For professionals who sign frequently',
    monthlyPrice: 1500,   // $15/mo
    yearlyPrice: 1000,    // $10/mo billed yearly
    stripePriceIdMonthly: process.env.STRIPE_PRO_MONTHLY_PRICE_ID ?? null,
    stripePriceIdYearly: process.env.STRIPE_PRO_YEARLY_PRICE_ID ?? null,
    limits: {
      documentsPerMonth: -1,
      maxFileSizeMB: 50,
      maxSignersPerDocument: 10,
      savedTemplates: -1,
      expiryDays: 90,          // pro plan: default 30 days, configurable up to 90
    },
    features: [
      'Unlimited documents',
      'Up to 10 signers per document',
      '50 MB file size limit',
      'Unlimited templates',
      'Configurable expiry (7–90 days)',
      'Auto-reminders',
      'No ads',
      'Priority support',
    ],
  },
  business: {
    id: 'business',
    name: 'Business',
    description: 'For teams that need advanced collaboration',
    monthlyPrice: 3500,   // $35/mo
    yearlyPrice: 2500,    // $25/mo billed yearly
    stripePriceIdMonthly: process.env.STRIPE_BUSINESS_MONTHLY_PRICE_ID ?? null,
    stripePriceIdYearly: process.env.STRIPE_BUSINESS_YEARLY_PRICE_ID ?? null,
    limits: {
      documentsPerMonth: -1,
      maxFileSizeMB: 100,
      maxSignersPerDocument: 25,
      savedTemplates: -1,
      expiryDays: -1,          // business plan: no forced expiry
    },
    features: [
      'Everything in Pro',
      'Up to 25 signers per document',
      '100 MB file size limit',
      'Bulk send (CSV import)',
      'Team accounts & roles',
      'Custom branding',
      'Saved contacts',
      'Dedicated support',
    ],
  },
}

export function getPlan(planId: string): PlanConfig {
  return PLANS[planId as PlanId] ?? PLANS.free
}

export function isPaidPlan(planId: string): boolean {
  return planId === 'pro' || planId === 'business'
}
