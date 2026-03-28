/**
 * /api/contacts
 *
 * GET  — list the current user's saved contacts (alphabetical order)
 * POST — upsert a contact by email (create or update the name if already saved)
 *        Body: { name: string, email: string }
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const contacts = await prisma.savedContact.findMany({
    where: { ownerId: session.user.id },
    select: { id: true, name: true, email: true, createdAt: true },
    orderBy: { name: 'asc' },
  })

  return NextResponse.json({ contacts })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: { name?: string; email?: string }
  try { body = await req.json() as { name?: string; email?: string } }
  catch { return NextResponse.json({ error: 'Invalid body' }, { status: 400 }) }

  const name  = body.name?.trim()
  const email = body.email?.trim().toLowerCase()

  if (!name)                       return NextResponse.json({ error: 'Name is required.' }, { status: 400 })
  if (!email || !email.includes('@')) return NextResponse.json({ error: 'Valid email required.' }, { status: 400 })

  // Upsert: update the name if this email is already saved, otherwise create
  const contact = await prisma.savedContact.upsert({
    where: { ownerId_email: { ownerId: session.user.id, email } },
    update: { name },
    create: { ownerId: session.user.id, name, email },
    select: { id: true, name: true, email: true, createdAt: true },
  })

  return NextResponse.json({ contact })
}
