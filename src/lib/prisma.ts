/**
 * lib/prisma.ts
 *
 * Creates a single shared instance of PrismaClient for the app.
 *
 * Supports two database backends:
 *   - Local dev:  DATABASE_URL="file:./dev.db"  (no auth token needed)
 *   - Production: DATABASE_URL="libsql://..."   + TURSO_AUTH_TOKEN set
 *
 * Why the global singleton pattern:
 * Next.js hot-reloads server code during development, which would create a new
 * PrismaClient (and open a new DB connection) on every file save. Storing the
 * instance on `globalThis` lets us reuse the same connection across reloads.
 * In production there is no hot-reload, so a new instance is fine.
 *
 * NOTE: This file is only for use in Node.js runtime (Server Components, API routes).
 * It must NOT be imported in Edge Runtime code (middleware, edge functions).
 */

import { PrismaClient } from "@prisma/client"
// PrismaLibSql accepts a Config object { url, authToken } directly
import { PrismaLibSql } from "@prisma/adapter-libsql"

// Extend globalThis to hold our Prisma instance across hot reloads
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

function createPrismaClient(): PrismaClient {
  const url = process.env.DATABASE_URL ?? "file:./dev.db"
  // authToken is only needed for Turso cloud (libsql:// URLs).
  // For local file: URLs, passing undefined is fine — the adapter ignores it.
  const authToken = process.env.TURSO_AUTH_TOKEN || undefined

  const adapter = new PrismaLibSql({ url, authToken })
  return new PrismaClient({ adapter })
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

// Only cache on globalThis in development (avoids hot-reload connection leaks)
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma
