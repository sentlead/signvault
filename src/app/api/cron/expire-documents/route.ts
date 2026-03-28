/**
 * POST /api/cron/expire-documents
 *
 * Vercel Cron Job — runs daily at 00:05 AM UTC (see vercel.json)
 *
 * Finds all awaiting_signatures documents where expiresAt <= now,
 * marks them as 'expired', and notifies the document owner by email.
 *
 * Security: Vercel sends Authorization: Bearer <CRON_SECRET> header.
 * Requests missing or with wrong secret are rejected with 401.
 * If CRON_SECRET is not set (e.g. local dev), the check is skipped with a warning.
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendDocumentExpiredNotification } from '@/lib/emails'

export async function POST(req: NextRequest) {
  // ── 1. Verify CRON_SECRET ─────────────────────────────────────────────────
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret) {
    const authHeader = req.headers.get('authorization')
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  } else {
    console.warn('[cron/expire-documents] CRON_SECRET is not set — skipping auth check')
  }

  const now = new Date()

  // Base URL for the dashboard link in the notification email
  const baseUrl =
    process.env.NEXTAUTH_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')

  // ── 2. Find all documents that have passed their expiry date ──────────────
  // We only process documents that:
  //   - are still awaiting signatures (not already completed or expired)
  //   - have an explicit expiresAt set (null = never expires)
  //   - whose expiresAt is in the past
  const expiredDocuments = await prisma.document.findMany({
    where: {
      status: 'awaiting_signatures',
      expiresAt: {
        not: null,
        lte: now,  // expiresAt <= now means the window has closed
      },
    },
    select: {
      id: true,
      name: true,
      owner: {
        select: { name: true, email: true },
      },
    },
  })

  let expiredCount = 0

  // ── 3. Mark each document expired and notify the owner ───────────────────
  for (const doc of expiredDocuments) {
    // Update the document status to 'expired'
    await prisma.document.update({
      where: { id: doc.id },
      data: { status: 'expired' },
    })

    // Send an expiry notification email to the document owner
    if (doc.owner.email) {
      await sendDocumentExpiredNotification({
        to: doc.owner.email,
        ownerName: doc.owner.name ?? doc.owner.email,
        docName: doc.name,
        dashboardUrl: `${baseUrl}/dashboard`,
      })
    }

    expiredCount++
  }

  console.log(`[cron/expire-documents] expired=${expiredCount}`)

  return NextResponse.json({ expired: expiredCount })
}
