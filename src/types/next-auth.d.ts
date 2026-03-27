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

declare module "next-auth" {
  interface Session {
    user: {
      /** The user's unique ID from the database */
      id: string
    } & DefaultSession["user"]
  }
}
