import { prisma } from '@/lib/prisma'
import { getPlan } from '@/lib/plans'

// Returns the current period string in "YYYY-MM" format
function currentPeriod(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

// Check if the user is allowed to create another document this month.
// Returns { allowed, used, limit } where limit -1 means unlimited.
export async function checkDocumentLimit(userId: string): Promise<{
  allowed: boolean
  used: number
  limit: number
}> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { plan: true },
  })

  const plan = getPlan(user?.plan ?? 'free')
  const limit = plan.limits.documentsPerMonth

  if (limit === -1) {
    return { allowed: true, used: 0, limit: -1 }
  }

  const period = currentPeriod()
  const record = await prisma.usageRecord.findUnique({
    where: { userId_period: { userId, period } },
    select: { documentsCreated: true },
  })

  const used = record?.documentsCreated ?? 0
  return { allowed: used < limit, used, limit }
}

// Check if the uploaded file size is within the user's plan limit.
export async function checkFileSizeLimit(userId: string, fileSizeBytes: number): Promise<{
  allowed: boolean
  fileSizeMB: number
  limitMB: number
}> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { plan: true },
  })

  const plan = getPlan(user?.plan ?? 'free')
  const limitMB = plan.limits.maxFileSizeMB
  const fileSizeMB = fileSizeBytes / (1024 * 1024)

  return { allowed: fileSizeMB <= limitMB, fileSizeMB, limitMB }
}

// Check if the number of signers is within the user's plan limit.
export function checkSignerLimit(planId: string, signerCount: number): {
  allowed: boolean
  limit: number
} {
  const plan = getPlan(planId)
  const limit = plan.limits.maxSignersPerDocument
  return { allowed: limit === -1 || signerCount <= limit, limit }
}

// Increment the documents-created counter for the user's current period.
// Creates the UsageRecord row if it doesn't exist yet.
export async function incrementUsage(userId: string): Promise<void> {
  const period = currentPeriod()
  await prisma.usageRecord.upsert({
    where: { userId_period: { userId, period } },
    create: { userId, period, documentsCreated: 1 },
    update: { documentsCreated: { increment: 1 } },
  })
}
