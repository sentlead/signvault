/**
 * types/next-auth.d.ts
 *
 * TypeScript "declaration merging" — this extends the built-in NextAuth types
 * to include our custom fields.
 *
 * By default, session.user only has: name, email, image.
 * We add: id (the user's database ID).
 *
 * This means TypeScript will know session.user.id exists and won't complain.
 */

import { DefaultSession } from "next-auth"
import type { PlanId } from "@/lib/plans"

declare module "next-auth" {
  interface Session {
    user: {
      /** The user's unique ID from the database */
      id: string
      /** The user's current subscription plan */
      plan: PlanId
    } & DefaultSession["user"]
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string
    plan?: PlanId
  }
}
