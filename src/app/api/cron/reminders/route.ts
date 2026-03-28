/**
 * POST /api/cron/reminders
 *
 * Vercel Cron Job — runs daily at 9:00 AM UTC (see vercel.json)
 *
 * Finds all awaiting_signatures documents with reminderEnabled = true
 * that are due for a reminder, and emails each pending signer.
 *
 * A reminder is due when:
 *   - lastReminderAt IS NULL and sentAt + reminderInterval days <= now
 *   - OR lastReminderAt + reminderInterval days <= now
 *
 * Security: Vercel sends Authorization: Bearer <CRON_SECRET> header.
 * Requests missing or with wrong secret are rejected with 401.
 * If CRON_SECRET is not set (e.g. local dev), the check is skipped with a warning.
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendSigningReminder } from '@/lib/emails'

export async function POST(req: NextRequest) {
  // ── 1. Verify CRON_SECRET ─────────────────────────────────────────────────
  // Vercel attaches Authorization: Bearer <CRON_SECRET> to every cron invocation.
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret) {
    const authHeader = req.headers.get('authorization')
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  } else {
    // No secret configured — warn but continue (useful in local development)
    console.warn('[cron/reminders] CRON_SECRET is not set — skipping auth check')
  }

  const now = new Date()

  // ── 2. Find all documents that are eligible for a reminder ────────────────
  // We fetch every awaiting_signatures doc with reminders enabled,
  // plus only the pending signers for each.
  const documents = await prisma.document.findMany({
    where: {
      status: 'awaiting_signatures',
      reminderEnabled: true,
      sentAt: { not: null },
      // Only documents that haven't expired yet (or have no expiry)
      OR: [
        { expiresAt: null },
        { expiresAt: { gt: now } },
      ],
    },
    select: {
      id: true,
      name: true,
      sentAt: true,
      reminderInterval: true,
      lastReminderAt: true,
      // Only include signers who haven't signed yet
      signers: {
        where: { status: 'pending' },
        select: { id: true, name: true, email: true, token: true },
      },
      // Owner info for the "sent by" line in the reminder email
      owner: {
        select: { name: true, email: true },
      },
    },
  })

  // Base URL for building signing links (same logic as the send route)
  const baseUrl =
    process.env.NEXTAUTH_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')

  let processedDocs = 0
  let totalReminders = 0

  // ── 3. For each document, check if a reminder is due ──────────────────────
  for (const doc of documents) {
    // sentAt is guaranteed non-null by the query filter above
    const sentAt = doc.sentAt!

    // Calculate when the next reminder should fire:
    //   - If we've never sent a reminder: sentAt + interval days
    //   - If we have: lastReminderAt + interval days
    const reminderDueAt = doc.lastReminderAt
      ? new Date(doc.lastReminderAt.getTime() + doc.reminderInterval * 86400000)
      : new Date(sentAt.getTime() + doc.reminderInterval * 86400000)

    // Skip if it's not time yet
    if (now < reminderDueAt) continue

    // Skip if there are no pending signers (shouldn't happen but be safe)
    if (doc.signers.length === 0) continue

    const senderName = doc.owner.name ?? doc.owner.email ?? 'Someone'

    // ── 4. Email each pending signer ──────────────────────────────────────
    await Promise.all(
      doc.signers.map((signer) =>
        sendSigningReminder({
          to: signer.email,
          signerName: signer.name,
          senderName,
          docName: doc.name,
          signingUrl: `${baseUrl}/sign/${signer.token}`,
        })
      )
    )

    totalReminders += doc.signers.length

    // ── 5. Update lastReminderAt so we don't send again until the next interval
    await prisma.document.update({
      where: { id: doc.id },
      data: { lastReminderAt: now },
    })

    processedDocs++
  }

  console.log(`[cron/reminders] processed=${processedDocs} reminders=${totalReminders}`)

  return NextResponse.json({ processed: processedDocs, reminders: totalReminders })
}
