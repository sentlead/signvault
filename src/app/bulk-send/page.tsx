/**
 * /bulk-send — Bulk Send page (Server Component)
 *
 * Business plan only. Shows:
 *   - Past bulk-send batches with progress (X / Y completed)
 *   - A "New Bulk Send" button that opens the client-side form
 *
 * Free / Pro users see an upgrade prompt instead.
 */

import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getPlan } from '@/lib/plans'
import { BulkSendClient } from '@/components/bulk-send/BulkSendClient'

export const metadata = { title: 'Bulk Send — SignVault' }

export default async function BulkSendPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  // Check the user's plan
  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { plan: true },
  })
  const plan = getPlan(dbUser?.plan ?? 'free')
  const isBusinessPlan = plan.id === 'business'

  // Load past bulk sends (only for business users who have them)
  const rawBulkSends = isBusinessPlan
    ? await prisma.bulkSend.findMany({
        where: { ownerId: session.user.id },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          templateName: true,
          totalCount: true,
          createdAt: true,
          documents: {
            where: { status: 'completed' },
            select: { id: true },
          },
        },
      })
    : []

  const bulkSends = rawBulkSends.map((b) => ({
    id: b.id,
    name: b.name,
    templateName: b.templateName,
    totalCount: b.totalCount,
    completedCount: b.documents.length,
    createdAt: b.createdAt.toISOString(),
  }))

  // Load the user's templates for the new-bulk-send form
  const rawTemplates = isBusinessPlan
    ? await prisma.template.findMany({
        where: { ownerId: session.user.id },
        select: {
          id: true,
          name: true,
          signerRoles: true,
          fields: true,
        },
        orderBy: { createdAt: 'desc' },
      })
    : []

  // Parse JSON fields and filter out multi-signer templates
  // (Bulk Send only supports single-signer templates in Phase 5)
  const templates = rawTemplates
    .map((t) => ({
      id: t.id,
      name: t.name,
      signerRoleCount: (JSON.parse(t.signerRoles) as { role: string }[]).length,
      fieldCount: (JSON.parse(t.fields) as unknown[]).length,
    }))
    // Only single-signer (or self-sign) templates are supported
    .filter((t) => t.signerRoleCount <= 1)

  return (
    <div className="max-w-4xl mx-auto">
      <BulkSendClient
        isBusinessPlan={isBusinessPlan}
        bulkSends={bulkSends}
        templates={templates}
      />
    </div>
  )
}
