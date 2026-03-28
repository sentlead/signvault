'use client'

/**
 * PlanGate.tsx
 *
 * Renders its children only when the user is on a paid plan (pro or business).
 * Useful for hiding ads and surfacing upgrade prompts.
 *
 * Usage:
 *   <PlanGate plan={session.user.plan} fallback={<AdSidebar />}>
 *     {null}  // paid users see nothing (or premium content)
 *   </PlanGate>
 */

import type { PlanId } from '@/lib/plans'
import { isPaidPlan } from '@/lib/plans'

interface PlanGateProps {
  plan: PlanId | string | undefined
  /** Rendered when the user is on the free plan (e.g. an ad component) */
  fallback?: React.ReactNode
  /** Rendered when the user is on a paid plan */
  children?: React.ReactNode
}

export function PlanGate({ plan, fallback, children }: PlanGateProps) {
  if (isPaidPlan(plan ?? 'free')) {
    return <>{children}</>
  }
  return <>{fallback}</>
}
