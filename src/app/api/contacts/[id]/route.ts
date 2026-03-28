/**
 * DELETE /api/contacts/[id] — remove a saved contact
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  const contact = await prisma.savedContact.findFirst({
    where: { id, ownerId: session.user.id },
  })
  if (!contact) return NextResponse.json({ error: 'Contact not found.' }, { status: 404 })

  await prisma.savedContact.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
