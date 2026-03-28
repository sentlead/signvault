/**
 * DELETE /api/team/members/[memberId]
 *
 * Removes a member from the team.
 * - The team owner can remove any non-owner member.
 * - A member can remove themselves (leave the team).
 * - The owner cannot remove themselves (use DELETE /api/team to disband instead).
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

type RouteParams = { params: Promise<{ memberId: string }> }

export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { memberId } = await params

  // Load the membership record we want to delete
  const target = await prisma.teamMember.findUnique({
    where: { id: memberId },
    select: {
      id: true,
      userId: true,
      role: true,
      team: { select: { ownerId: true } },
    },
  })

  if (!target) {
    return NextResponse.json({ error: 'Member not found.' }, { status: 404 })
  }

  const isOwner      = target.team.ownerId === session.user.id
  const isSelf       = target.userId === session.user.id
  const targetIsOwner = target.role === 'owner'

  // Cannot remove the owner (they must disband the team instead)
  if (targetIsOwner) {
    return NextResponse.json(
      { error: 'The team owner cannot be removed. Disband the team instead.' },
      { status: 400 }
    )
  }

  // Only the team owner or the member themselves may remove a membership
  if (!isOwner && !isSelf) {
    return NextResponse.json({ error: 'Permission denied.' }, { status: 403 })
  }

  await prisma.teamMember.delete({ where: { id: memberId } })
  return NextResponse.json({ success: true })
}
