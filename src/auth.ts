/**
 * auth.ts
 *
 * Central NextAuth v5 configuration for SignVault.
 *
 * This file sets up:
 *   - Prisma adapter (stores users, sessions, accounts in SQLite)
 *   - Google OAuth provider
 *   - Apple OAuth provider
 *   - Resend magic link email provider (passwordless sign-in)
 *
 * Exports:
 *   - handlers: GET/POST route handlers for /api/auth/[...nextauth]
 *   - auth: function to get the current session (use in Server Components)
 *   - signIn / signOut: functions to trigger auth actions (use in Client Components)
 */

import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import Google from "next-auth/providers/google"
import Apple from "next-auth/providers/apple"
import Resend from "next-auth/providers/resend"
import { prisma } from "@/lib/prisma"

export const { handlers, auth, signIn, signOut } = NextAuth({
  // Use Prisma to persist users and accounts in our SQLite database
  adapter: PrismaAdapter(prisma),

  // Use JWT sessions so the proxy (Edge runtime) can verify auth
  // without hitting the database. The session is stored in a signed
  // cookie — no DB lookup needed on every request.
  session: { strategy: "jwt" },

  providers: [
    // Google OAuth — users click "Continue with Google"
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
    }),

    // Apple OAuth — users click "Continue with Apple"
    Apple({
      clientId: process.env.AUTH_APPLE_ID!,
      clientSecret: process.env.AUTH_APPLE_SECRET!,
    }),

    // Resend magic link — users enter their email and get a sign-in link
    // No password required! The link expires after 24 hours.
    Resend({
      apiKey: process.env.RESEND_API_KEY,
      from: "SignVault <noreply@signvault.co>",
    }),
  ],

  // Custom pages — instead of NextAuth's default UI, use our own
  pages: {
    signIn: "/login",   // Redirect to /login instead of /api/auth/signin
    error: "/login",    // Show errors on the login page (e.g. "OAuthAccountNotLinked")
  },

  callbacks: {
    // When a JWT is created (on sign-in), embed the user's DB id into it
    jwt({ token, user }) {
      if (user) token.id = user.id
      return token
    },
    // Add the user's database ID to the session object from the JWT.
    // By default, session only includes name, email, image.
    // We need the ID to query the database for user-specific data.
    session({ session, token }) {
      if (token.id) session.user.id = token.id as string
      return session
    },
  },
})
