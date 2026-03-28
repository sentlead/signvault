/**
 * POST /api/team/invite
 *
 * Sends an invitation email to a new team member.
 * Only the team owner can invite people.
 *
 * Body: { email: string }
 *
 * Creates a TeamInvitation record with a unique token (expires in 7 days)
 * then sends an invitation email with the accept link.
 * If the email already has a pending invite for this team, the old one is
 * replaced so the recipient gets a fresh link.
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { sendTeamInvitation } from '@/lib/emails'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Only the team owner can invite
  const team = await prisma.team.findUnique({
    where: { ownerId: session.user.id },
    select: { id: true, name: true },
  })
  if (!team) {
    return NextResponse.json(
      { error: 'You must own a team to invite members.' },
      { status: 403 }
    )
  }

  let body: { email?: string }
  try { body = (await req.json()) as { email?: string } }
  catch { return NextResponse.json({ error: 'Invalid body' }, { status: 400 }) }

  const email = body.email?.trim().toLowerCase()
  if (!email || !email.includes('@')) {
    return NextResponse.json({ error: 'A valid email address is required.' }, { status: 400 })
  }

  // Don't invite someone who is already a member
  const existingMember = await prisma.teamMember.findFirst({
    where: {
      teamId: team.id,
      user: { email },
    },
  })
  if (existingMember) {
    return NextResponse.json({ error: 'This person is already a member of your team.' }, { status: 409 })
  }

  // Upsert: replace any existing invite for this email + team
  const expiresAt = new Date(Date.now() + 7 * 86400000)  // 7 days from now

  // Delete old invites for this email in this team (if any)
  await prisma.teamInvitation.deleteMany({
    where: { teamId: team.id, email },
  })

  // Create the fresh invitation
  const invitation = await prisma.teamInvitation.create({
    data: {
      teamId: team.id,
      email,
      expiresAt,
    },
    select: { token: true },
  })

  // Send the invitation email
  const ownerName = session.user.name ?? session.user.email ?? 'Someone'
  const baseUrl =
    process.env.NEXTAUTH_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')

  await sendTeamInvitation({
    to: email,
    ownerName,
    teamName: team.name,
    acceptUrl: `${baseUrl}/team/invite/${invitation.token}`,
  })

  return NextResponse.json({ success: true })
}
