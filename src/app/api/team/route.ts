/**
 * /api/team
 *
 * GET  — Returns the current user's team (as owner or member), including members
 *         and pending invitations. Returns { team: null } if the user has no team.
 *
 * POST — Creates a new team. Business plan only. The caller becomes the owner
 *         and is automatically added as a member with role 'owner'.
 *         Body: { name: string }
 *
 * DELETE — Disbands the team (owner only). Deletes all members + invitations.
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { getPlan } from '@/lib/plans'

// ── GET ───────────────────────────────────────────────────────────────────────

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Find a team where the user is either the owner or a member
  const membership = await prisma.teamMember.findFirst({
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
                select: {
                  id: true,
                  name: true,
                  email: true,
                  image: true,
                },
              },
            },
            orderBy: { joinedAt: 'asc' },
          },
          invitations: {
            where: {
              expiresAt: { gt: new Date() },  // only show non-expired invites
            },
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

  if (!membership) {
    return NextResponse.json({ team: null })
  }

  return NextResponse.json({ team: membership.team, myRole: membership.role })
}

// ── POST ──────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Business plan only
  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { plan: true },
  })
  if (getPlan(dbUser?.plan ?? 'free').id !== 'business') {
    return NextResponse.json(
      { error: 'Team accounts are a Business plan feature.' },
      { status: 403 }
    )
  }

  // Check if user already owns or is in a team
  const existing = await prisma.teamMember.findFirst({
    where: { userId: session.user.id },
  })
  if (existing) {
    return NextResponse.json({ error: 'You are already in a team.' }, { status: 409 })
  }

  let body: { name?: string }
  try { body = (await req.json()) as { name?: string } }
  catch { return NextResponse.json({ error: 'Invalid body' }, { status: 400 }) }

  const name = body.name?.trim()
  if (!name) {
    return NextResponse.json({ error: 'Team name is required.' }, { status: 400 })
  }

  // Create the team + add the owner as a member in one transaction
  const team = await prisma.$transaction(async (tx) => {
    const t = await tx.team.create({
      data: { name, ownerId: session.user.id! },
    })
    await tx.teamMember.create({
      data: {
        teamId: t.id,
        userId: session.user.id!,
        role: 'owner',
      },
    })
    return t
  })

  return NextResponse.json({ team })
}

// ── DELETE ────────────────────────────────────────────────────────────────────

export async function DELETE() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Only the owner can disband the team
  const team = await prisma.team.findUnique({
    where: { ownerId: session.user.id },
  })
  if (!team) {
    return NextResponse.json({ error: 'Team not found or you are not the owner.' }, { status: 404 })
  }

  // Cascading delete handles members + invitations
  await prisma.team.delete({ where: { id: team.id } })

  return NextResponse.json({ success: true })
}
