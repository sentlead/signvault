/**
 * app/api/auth/[...nextauth]/route.ts
 *
 * This file connects NextAuth to Next.js's App Router API system.
 *
 * The [...nextauth] "catch-all" segment means this file handles ALL
 * requests to /api/auth/*, including:
 *   - /api/auth/signin
 *   - /api/auth/callback/google
 *   - /api/auth/callback/apple
 *   - /api/auth/session
 *   - /api/auth/signout
 *   - etc.
 *
 * We simply export the GET and POST handlers from our auth config.
 */

import { handlers } from "@/auth"

export const { GET, POST } = handlers
