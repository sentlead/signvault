/**
 * /templates — Templates management page (Server Component)
 *
 * Shows all of the user's saved templates. Each template can be:
 *   - Used: creates a new document from the template and opens the prepare editor
 *   - Deleted: permanently removes the template
 *
 * Also shows the user's plan template limit (e.g. "2 / 3 used" for Free plan).
 */

import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getPlan } from '@/lib/plans'
import { TemplatesClient } from '@/components/templates/TemplatesClient'

export const metadata = { title: 'Templates — SignVault' }

export default async function TemplatesPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  // Load the user's templates (most recent first)
  const templates = await prisma.template.findMany({
    where: { ownerId: session.user.id },
    select: {
      id: true,
      name: true,
      description: true,
      fields: true,
      signerRoles: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  })

  // Get the user's plan to show limit info
  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { plan: true },
  })
  const plan = getPlan(dbUser?.plan ?? 'free')
  const limit = plan.limits.savedTemplates  // -1 = unlimited

  // Parse JSON fields into arrays so the client component gets typed data
  const parsedTemplates = templates.map((t) => ({
    ...t,
    fieldCount: (JSON.parse(t.fields) as unknown[]).length,
    signerRoles: JSON.parse(t.signerRoles) as { role: string }[],
    createdAt: t.createdAt.toISOString(),
  }))

  return (
    <div className="max-w-4xl mx-auto">
      {/* ── Page header ───────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-sv-text dark:text-sv-dark-text">
            Templates
          </h1>
          <p className="text-sm text-sv-secondary dark:text-sv-dark-secondary mt-1">
            Reusable document layouts — save field placements once, use them every time.
          </p>
        </div>

        {/* Plan limit badge */}
        {limit !== -1 && (
          <span className="flex-shrink-0 text-xs font-medium px-2.5 py-1 rounded-full
                           bg-sv-border dark:bg-sv-dark-border
                           text-sv-secondary dark:text-sv-dark-secondary">
            {templates.length} / {limit} used
          </span>
        )}
      </div>

      {/* ── How to create a template (info box) ──────────────────────────── */}
      <div className="mb-6 p-4 rounded-[var(--radius-card)]
                      bg-sv-primary/5 dark:bg-sv-dark-primary/10
                      border border-sv-primary/20 dark:border-sv-dark-primary/30">
        <p className="text-xs text-sv-text dark:text-sv-dark-text leading-relaxed">
          <span className="font-semibold">How to create a template:</span>{' '}
          Open any document, go to the prepare step (place fields), then click{' '}
          <span className="font-medium">&quot;Save as Template&quot;</span> in the left toolbar.
        </p>
      </div>

      {/* ── Template grid (client component handles delete + use actions) ── */}
      <TemplatesClient
        templates={parsedTemplates}
        planLimit={limit}
      />
    </div>
  )
}
