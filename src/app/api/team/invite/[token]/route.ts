/**
 * /api/team/invite/[token]
 *
 * GET  — Returns invitation details (team name, inviter) for the accept page.
 *         Public — no auth required, just a valid non-expired token.
 *
 * POST — Accepts the invitation. The current user is added to the team.
 *         Requires auth. The user's email must match the invitation email.
 *
 * DELETE — Cancels the invitation (owner only).
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

type RouteParams = { params: Promise<{ token: string }> }

// ── GET: fetch invitation info ────────────────────────────────────────────────

export async function GET(_req: NextRequest, { params }: RouteParams) {
  const { token } = await params

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

  if (!invitation) {
    return NextResponse.json({ error: 'Invitation not found.' }, { status: 404 })
  }
  if (invitation.expiresAt < new Date()) {
    return NextResponse.json({ error: 'This invitation has expired.' }, { status: 410 })
  }

  return NextResponse.json({
    email: invitation.email,
    teamName: invitation.team.name,
    ownerName: invitation.team.owner.name ?? invitation.team.owner.email ?? 'Someone',
    memberCount: invitation.team._count.members,
    expiresAt: invitation.expiresAt.toISOString(),
  })
}

// ── POST: accept the invitation ───────────────────────────────────────────────

export async function POST(_req: NextRequest, { params }: RouteParams) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { token } = await params

  const invitation = await prisma.teamInvitation.findUnique({
    where: { token },
    select: {
      id: true,
      teamId: true,
      email: true,
      expiresAt: true,
    },
  })

  if (!invitation) {
    return NextResponse.json({ error: 'Invitation not found.' }, { status: 404 })
  }
  if (invitation.expiresAt < new Date()) {
    return NextResponse.json({ error: 'This invitation has expired.' }, { status: 410 })
  }

  // The logged-in user's email must match the invite (case-insensitive)
  const userEmail = session.user.email?.toLowerCase() ?? ''
  if (userEmail !== invitation.email.toLowerCase()) {
    return NextResponse.json(
      {
        error: `This invitation was sent to ${invitation.email}. Please sign in with that account to accept.`,
      },
      { status: 403 }
    )
  }

  // Check if already a member
  const alreadyMember = await prisma.teamMember.findUnique({
    where: { teamId_userId: { teamId: invitation.teamId, userId: session.user.id } },
  })
  if (alreadyMember) {
    // Already in the team — just clean up the invite and return success
    await prisma.teamInvitation.delete({ where: { id: invitation.id } })
    return NextResponse.json({ success: true, alreadyMember: true })
  }

  // Also make sure they aren't already in a different team
  const existingMembership = await prisma.teamMember.findFirst({
    where: { userId: session.user.id },
  })
  if (existingMembership) {
    return NextResponse.json(
      { error: 'You are already a member of another team. Leave that team first.' },
      { status: 409 }
    )
  }

  // Add to team + delete the invitation in a transaction
  await prisma.$transaction([
    prisma.teamMember.create({
      data: {
        teamId: invitation.teamId,
        userId: session.user.id,
        role: 'member',
      },
    }),
    prisma.teamInvitation.delete({ where: { id: invitation.id } }),
  ])

  return NextResponse.json({ success: true })
}

// ── DELETE: cancel an invitation ──────────────────────────────────────────────

export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { token } = await params

  const invitation = await prisma.teamInvitation.findUnique({
    where: { token },
    select: {
      id: true,
      team: { select: { ownerId: true } },
    },
  })

  if (!invitation) {
    return NextResponse.json({ error: 'Invitation not found.' }, { status: 404 })
  }

  // Only the team owner can cancel invitations
  if (invitation.team.ownerId !== session.user.id) {
    return NextResponse.json({ error: 'Only the team owner can cancel invitations.' }, { status: 403 })
  }

  await prisma.teamInvitation.delete({ where: { id: invitation.id } })
  return NextResponse.json({ success: true })
}
