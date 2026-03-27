/**
 * GET /api/documents/[id]/signed-file
 *
 * Serves the completed signed PDF as a file download.
 *
 * Security:
 *   - Requires an active session
 *   - The session user must be the document owner
 *   - Returns 404 if the document hasn't been signed yet (no signedFileUrl)
 *
 * Returns the file with Content-Disposition: attachment so the browser
 * shows a "Save As" dialog rather than trying to display it inline.
 *
 * If signedFileUrl is a Vercel Blob https:// URL the file is fetched and
 * streamed back so the browser receives the correct Content-Disposition
 * header (a bare redirect would lose that header).
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // ── Auth check ────────────────────────────────────────────────────────────
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  // ── Verify ownership + check signed file exists ───────────────────────────
  const document = await prisma.document.findFirst({
    where: { id, ownerId: session.user.id },
    select: { signedFileUrl: true, name: true },
  })

  if (!document) {
    return NextResponse.json({ error: 'Document not found' }, { status: 404 })
  }

  if (!document.signedFileUrl) {
    return NextResponse.json({ error: 'Document has not been signed yet' }, { status: 404 })
  }

  // Build a friendly download filename from the document name
  const downloadName = `${document.name.replace(/[^a-z0-9_\-. ]/gi, '_')}-signed.pdf`

  // ── Serve the signed PDF ──────────────────────────────────────────────────
  if (document.signedFileUrl.startsWith('https://')) {
    // Vercel Blob URL: fetch and stream so we control Content-Disposition
    let blobResponse: globalThis.Response
    try {
      blobResponse = await fetch(document.signedFileUrl)
    } catch (err) {
      console.error('[signed-file] Failed to fetch from blob:', err)
      return NextResponse.json({ error: 'Could not retrieve signed file' }, { status: 500 })
    }
    if (!blobResponse.ok) {
      return NextResponse.json({ error: 'Signed file not found in storage' }, { status: 404 })
    }
    const buffer = await blobResponse.arrayBuffer()
    return new Response(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${downloadName}"`,
        'Cache-Control': 'no-store',
      },
    })
  }

  // ── Legacy local dev path: read from /uploads/ on disk ───────────────────
  const fs = await import('fs')
  const path = await import('path')
  const filename = path.basename(document.signedFileUrl)
  const filePath = path.join(process.cwd(), 'uploads', filename)

  let fileBuffer: Buffer
  try {
    fileBuffer = await fs.promises.readFile(filePath)
  } catch (err) {
    const fsErr = err as NodeJS.ErrnoException
    if (fsErr.code === 'ENOENT') {
      return NextResponse.json({ error: 'Signed file not found on disk' }, { status: 404 })
    }
    console.error('[signed-file] Failed to read file:', fsErr)
    return NextResponse.json({ error: 'Could not read signed file' }, { status: 500 })
  }

  return new Response(new Uint8Array(fileBuffer), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      // "attachment" tells the browser to save the file rather than display it
      'Content-Disposition': `attachment; filename="${downloadName}"`,
      'Cache-Control': 'no-store',
    },
  })
}
