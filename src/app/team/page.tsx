/**
 * /team — Team Management page (Server Component)
 *
 * Business plan only.
 *   - Non-business users: upgrade prompt
 *   - Business user with no team: "Create Your Team" form
 *   - Business user with a team: member list + invite form
 */

import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getPlan } from '@/lib/plans'
import { TeamClient } from '@/components/team/TeamClient'

export const metadata = { title: 'My Team — SignVault' }

export default async function TeamPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { plan: true },
  })
  const plan = getPlan(dbUser?.plan ?? 'free')
  const isBusinessPlan = plan.id === 'business'

  // Find the team this user belongs to (as owner or member)
  const membership = isBusinessPlan
    ? await prisma.teamMember.findFirst({
        where: { userId: session.user.id },
        select: {
          role: true,
          team: {
            select: {
              id: true,
              name: true,
              ownerId: true,
              createdAt: true,
              members: {
                select: {
                  id: true,
                  role: true,
                  joinedAt: true,
                  user: {
                    select: { id: true, name: true, email: true, image: true },
                  },
                },
                orderBy: { joinedAt: 'asc' },
              },
              invitations: {
                where: { expiresAt: { gt: new Date() } },
                select: {
                  id: true,
                  email: true,
                  token: true,
                  expiresAt: true,
                  createdAt: true,
                },
                orderBy: { createdAt: 'desc' },
              },
            },
          },
        },
      })
    : null

  // Serialize Date objects to strings for the client component
  const teamData = membership?.team
    ? {
        ...membership.team,
        createdAt: membership.team.createdAt.toISOString(),
        members: membership.team.members.map((m) => ({
          ...m,
          joinedAt: m.joinedAt.toISOString(),
        })),
        invitations: membership.team.invitations.map((i) => ({
          ...i,
          expiresAt: i.expiresAt.toISOString(),
          createdAt: i.createdAt.toISOString(),
        })),
      }
    : null

  return (
    <div className="max-w-3xl mx-auto">
      <TeamClient
        isBusinessPlan={isBusinessPlan}
        currentUserId={session.user.id}
        initialTeam={teamData}
        myRole={membership?.role ?? null}
      />
    </div>
  )
}
