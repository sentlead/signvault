/**
 * POST /api/documents/upload
 *
 * Accepts a multipart/form-data request with a "file" field containing a PDF.
 *
 * Steps:
 *   1. Check that the user is authenticated (401 if not)
 *   2. Parse the uploaded file from the form data
 *   3. Validate: must be a PDF, must be <= 10 MB
 *   4. Store the file — Vercel Blob in production, local /uploads/ in dev
 *   5. Create a Document record in the database
 *   6. Create an AuditLog entry for the upload
 *   7. Return { documentId, name }
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { v4 as uuidv4 } from 'uuid'

// Max file size: 10 MB
const MAX_SIZE_BYTES = 10 * 1024 * 1024

export async function POST(req: NextRequest) {
  // ── 1. Auth check ──────────────────────────────────────────────────────
  const session = await auth()
  if (!session?.user?.id || !session.user.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // ── 2. Parse the multipart form data ──────────────────────────────────
  let formData: FormData
  try {
    formData = await req.formData()
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 })
  }

  const fileEntry = formData.get('file')
  if (!fileEntry || !(fileEntry instanceof File)) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }

  const uploadedFile = fileEntry

  // ── 3. Validation ──────────────────────────────────────────────────────
  // Check MIME type
  if (uploadedFile.type !== 'application/pdf') {
    return NextResponse.json(
      { error: 'Only PDF files are accepted' },
      { status: 422 }
    )
  }

  // Check file size
  if (uploadedFile.size > MAX_SIZE_BYTES) {
    return NextResponse.json(
      { error: 'File exceeds the 10 MB limit' },
      { status: 422 }
    )
  }

  // ── 4. Store the file ──────────────────────────────────────────────────
  const uniqueFilename = `${uuidv4()}.pdf`
  const arrayBuffer = await uploadedFile.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  let fileUrl: string

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    // Production / Vercel preview: upload to Vercel Blob
    const { put } = await import('@vercel/blob')
    const blob = await put(uniqueFilename, buffer, {
      access: 'public',
      contentType: 'application/pdf',
    })
    fileUrl = blob.url
  } else {
    // Local dev fallback: write to /uploads/ directory
    const fs = await import('fs')
    const path = await import('path')
    // The comment below prevents Turbopack from tracing the entire project directory
    const uploadsDir = path.join(/*turbopackIgnore: true*/ process.cwd(), 'uploads')
    await fs.promises.mkdir(uploadsDir, { recursive: true })
    const filePath = path.join(uploadsDir, uniqueFilename)
    await fs.promises.writeFile(filePath, buffer)
    fileUrl = `uploads/${uniqueFilename}`
  }

  // ── 5. Create Document in database ────────────────────────────────────
  let document: Awaited<ReturnType<typeof prisma.document.create>>
  try {
    document = await prisma.document.create({
      data: {
        name: uploadedFile.name,
        ownerId: session.user.id,
        fileUrl,
        status: 'draft',
      },
    })
  } catch {
    return NextResponse.json({ error: 'Failed to save document' }, { status: 500 })
  }

  // ── 6. Create AuditLog entry ───────────────────────────────────────────
  try {
    await prisma.auditLog.create({
      data: {
        documentId: document.id,
        action: 'document_created',
        actorEmail: session.user.email,
        // IP address is not reliably available in Next.js App Router without middleware
      },
    })
  } catch {
    // Non-fatal: document was created, audit log failure shouldn't block the user
  }

  // ── 7. Return the new document's ID and name ───────────────────────────
  return NextResponse.json(
    { documentId: document.id, name: document.name },
    { status: 201 }
  )
}
