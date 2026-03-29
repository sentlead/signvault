/**
 * auth.ts
 *
 * Central NextAuth v5 configuration for SignVault.
 *
 * This file sets up:
 *   - Prisma adapter (stores users, sessions, accounts in SQLite)
 *   - Resend magic link email provider (passwordless sign-in via email)
 *   - Google OAuth provider
 *
 * Exports:
 *   - handlers: GET/POST route handlers for /api/auth/[...nextauth]
 *   - auth: function to get the current session (use in Server Components)
 *   - signIn / signOut: functions to trigger auth actions (use in Client Components)
 */

import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import Google from "next-auth/providers/google"
import Resend from "next-auth/providers/resend"
import { prisma } from "@/lib/prisma"
import type { PlanId } from "@/lib/plans"

export const { handlers, auth, signIn, signOut } = NextAuth({
  // Use Prisma to persist users and accounts in our SQLite database
  adapter: PrismaAdapter(prisma),

  // Use JWT sessions so the proxy (Edge runtime) can verify auth
  // without hitting the database. The session is stored in a signed
  // cookie — no DB lookup needed on every request.
  session: { strategy: "jwt" },

  providers: [
    // Magic link emails via Resend — user enters email, gets a one-time sign-in link
    Resend({
      apiKey: process.env.RESEND_API_KEY!,
      // Using Resend's shared test address — no domain verification needed.
      // Swap this for "SignVault <noreply@signvault.co>" once signvault.co is owned and verified.
      from: "SignVault <onboarding@resend.dev>",
    }),

    // Google OAuth — users click "Continue with Google"
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
    }),

  ],

  // Custom pages — instead of NextAuth's default UI, use our own
  pages: {
    signIn: "/login",   // Redirect to /login instead of /api/auth/signin
    error: "/login",    // Show errors on the login page (e.g. "OAuthAccountNotLinked")
  },

  callbacks: {
    // When a JWT is created (on sign-in), embed the user's DB id and plan.
    // On subsequent requests, refresh the plan from the DB so it stays current.
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id
        // Fetch plan on first sign-in
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: { plan: true },
        })
        token.plan = (dbUser?.plan ?? 'free') as PlanId
      }
      // Re-fetch plan when session is explicitly updated (e.g. after upgrade)
      if (trigger === 'update' && token.id) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { plan: true },
        })
        if (dbUser) token.plan = dbUser.plan as PlanId
      }
      return token
    },
    // Add the user's database ID and plan to the session object from the JWT.
    session({ session, token }) {
      if (token.id) session.user.id = token.id as string
      if (token.plan) session.user.plan = token.plan as PlanId
      return session
    },
  },
})
