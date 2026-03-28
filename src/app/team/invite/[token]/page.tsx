/**
 * /team/invite/[token] — Team Invitation Accept Page (Server Component)
 *
 * Anyone with the link can view this page. It shows the team name and inviter
 * then lets the user log in (if needed) and accept the invitation.
 *
 * This page sits outside the dashboard layout so unauthenticated users see it
 * without being redirected — they can sign in first then come back.
 */

import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { InviteAcceptClient } from '@/components/team/InviteAcceptClient'

export const metadata = { title: 'Team Invitation — SignVault' }

export default async function InviteAcceptPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params

  // Load invitation details (server-side so we can show them without JS)
  const invitation = await prisma.teamInvitation.findUnique({
    where: { token },
    select: {
      email: true,
      expiresAt: true,
      team: {
        select: {
          name: true,
          owner: { select: { name: true, email: true } },
          _count: { select: { members: true } },
        },
      },
    },
  })

  const session = await auth()

  if (!invitation) {
    return (
      <InviteAcceptClient
        token={token}
        status="not_found"
        currentUserEmail={session?.user?.email ?? null}
      />
    )
  }

  if (invitation.expiresAt < new Date()) {
    return (
      <InviteAcceptClient
        token={token}
        status="expired"
        currentUserEmail={session?.user?.email ?? null}
      />
    )
  }

  return (
    <InviteAcceptClient
      token={token}
      status="valid"
      inviteEmail={invitation.email}
      teamName={invitation.team.name}
      ownerName={invitation.team.owner.name ?? invitation.team.owner.email ?? 'Someone'}
      memberCount={invitation.team._count.members}
      expiresAt={invitation.expiresAt.toISOString()}
      currentUserEmail={session?.user?.email ?? null}
    />
  )
}
