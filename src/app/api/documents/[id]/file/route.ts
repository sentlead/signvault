/**
 * GET /api/documents/[id]/file
 *
 * Serves the raw PDF file to either:
 *   A) The authenticated document owner (session-based)
 *   B) An external signer with a valid signing token (?token=<jwt>)
 *
 * If the fileUrl is a full https:// URL (Vercel Blob), the request is
 * redirected to the blob URL directly.  If it is a legacy relative path
 * (local dev), the file is read from disk and streamed.
 *
 * Security:
 *  - Requires either an active session (owner) OR a valid signing JWT
 *  - Only the filename stored in the DB is used — no path traversal possible
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { verifySigningToken } from '@/lib/signing-token'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  // ── Check for signing token (external signer path) ────────────────────
  const tokenFromQuery = req.nextUrl.searchParams.get('token')

  if (tokenFromQuery) {
    // External signer: verify the JWT token
    const tokenPayload = await verifySigningToken(tokenFromQuery)
    if (!tokenPayload || tokenPayload.documentId !== id) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 })
    }

    // Verify the signer exists for this document
    const signer = await prisma.signer.findFirst({
      where: { id: tokenPayload.signerId, documentId: id },
      select: { id: true },
    })
    if (!signer) {
      return NextResponse.json({ error: 'Signer not found' }, { status: 404 })
    }

    // Load document fileUrl
    const document = await prisma.document.findUnique({
      where: { id },
      select: { fileUrl: true },
    })
    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    return serveFile(document.fileUrl)
  }

  // ── Owner path: require session ───────────────────────────────────────
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // ── Verify ownership ──────────────────────────────────────────────────
  const document = await prisma.document.findFirst({
    where: { id, ownerId: session.user.id },
    select: { fileUrl: true },
  })

  if (!document) {
    return NextResponse.json({ error: 'Document not found' }, { status: 404 })
  }

  return serveFile(document.fileUrl)
}

/** Serves a PDF — redirects to Vercel Blob URL or streams from local disk */
async function serveFile(fileUrl: string): Promise<Response> {
  if (fileUrl.startsWith('https://')) {
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      // Private store: generate a signed download URL via head()
      const { head } = await import('@vercel/blob')
      const meta = await head(fileUrl)
      return Response.redirect(meta.downloadUrl, 302)
    }
    // Public store fallback: redirect directly
    return Response.redirect(fileUrl, 302)
  }

  // Legacy local dev path: read from /uploads/ on disk
  const fs = await import('fs')
  const path = await import('path')
  const filename = path.basename(fileUrl)
  const filePath = path.join(process.cwd(), 'uploads', filename)

  let fileBuffer: Buffer
  try {
    fileBuffer = await fs.promises.readFile(filePath)
  } catch (err) {
    const fsErr = err as NodeJS.ErrnoException
    if (fsErr.code === 'ENOENT') {
      return NextResponse.json({ error: 'File not found on disk' }, { status: 404 })
    }
    console.error('[file-route] Failed to read file:', fsErr)
    return NextResponse.json({ error: 'Could not read file' }, { status: 500 })
  }

  // Convert Node.js Buffer → Uint8Array so the Web Response constructor accepts it
  return new Response(new Uint8Array(fileBuffer), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      // Allow the browser to display inline (needed for react-pdf)
      'Content-Disposition': `inline; filename="${filename}"`,
      // Don't cache — we may update the file in the future
      'Cache-Control': 'no-store',
    },
  })
}
