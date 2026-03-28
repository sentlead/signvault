/**
 * GET /api/documents/[id]/certificate
 *
 * Generates and streams a "Certificate of Completion" PDF for a completed document.
 * Only the document owner can download it. Document must be status === 'completed'.
 *
 * The PDF contains:
 *   - Document name and completion date
 *   - Each signer's name, email, signed date, and IP address
 *   - A copy of the audit trail
 *   - A unique certificate ID
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'

// ── Colours (matches SignVault's indigo brand) ────────────────────────────────
const INDIGO  = rgb(0.388, 0.400, 0.945)   // #6366f1
const BLACK   = rgb(0.067, 0.067, 0.067)   // #111111
const GREY    = rgb(0.42, 0.45, 0.50)      // muted text
const LIGHT   = rgb(0.95, 0.95, 0.98)      // panel background
const WHITE   = rgb(1, 1, 1)
const EMERALD = rgb(0.063, 0.725, 0.506)   // #10b981

// ── Helper: draw a horizontal rule ───────────────────────────────────────────
function drawRule(
  page: ReturnType<PDFDocument['addPage']>,
  y: number,
  margin: number,
  width: number,
  color = GREY,
  thickness = 0.5
) {
  page.drawLine({
    start: { x: margin, y },
    end:   { x: width - margin, y },
    thickness,
    color,
    opacity: 0.25,
  })
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  // Load the document with all signers and audit logs
  const document = await prisma.document.findFirst({
    where: { id, ownerId: session.user.id },
    select: {
      id: true,
      name: true,
      status: true,
      createdAt: true,
      completedAt: true,
      owner: { select: { name: true, email: true } },
      signers: {
        select: { name: true, email: true, status: true, signedAt: true, signedIp: true },
        orderBy: { order: 'asc' },
      },
      auditLogs: {
        select: { action: true, actorEmail: true, timestamp: true, ipAddress: true },
        orderBy: { timestamp: 'asc' },
      },
    },
  })

  if (!document) {
    return NextResponse.json({ error: 'Document not found.' }, { status: 404 })
  }
  if (document.status !== 'completed') {
    return NextResponse.json(
      { error: 'Certificate is only available for completed documents.' },
      { status: 400 }
    )
  }

  // ── Build the PDF ────────────────────────────────────────────────────────

  const pdfDoc   = await PDFDocument.create()
  const helvetica      = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const helveticaBold  = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

  const PAGE_W = 595   // A4 width in points
  const PAGE_H = 842   // A4 height in points
  const MARGIN = 48

  const page = pdfDoc.addPage([PAGE_W, PAGE_H])

  // ── Top colour bar ───────────────────────────────────────────────────────
  page.drawRectangle({
    x: 0, y: PAGE_H - 80,
    width: PAGE_W, height: 80,
    color: INDIGO,
  })

  // Brand name in the header bar
  page.drawText('✦ SignVault', {
    x: MARGIN, y: PAGE_H - 50,
    size: 18, font: helveticaBold, color: WHITE,
  })
  page.drawText('Certificate of Completion', {
    x: MARGIN, y: PAGE_H - 68,
    size: 10, font: helvetica, color: rgb(0.8, 0.82, 1),
  })

  // Generation date (top-right of header)
  const genDate = new Intl.DateTimeFormat('en-US', { dateStyle: 'long' }).format(new Date())
  page.drawText(`Generated ${genDate}`, {
    x: PAGE_W - MARGIN - 150, y: PAGE_H - 55,
    size: 8, font: helvetica, color: rgb(0.8, 0.82, 1),
  })

  let cursorY = PAGE_H - 110

  // ── Document name block ──────────────────────────────────────────────────
  // Light background panel
  page.drawRectangle({
    x: MARGIN, y: cursorY - 56,
    width: PAGE_W - MARGIN * 2, height: 64,
    color: LIGHT,
  })

  page.drawText('Document', {
    x: MARGIN + 14, y: cursorY - 14,
    size: 8, font: helvetica, color: GREY,
  })
  // Truncate long document names
  const docNameDisplay = document.name.length > 70
    ? document.name.slice(0, 67) + '…'
    : document.name
  page.drawText(docNameDisplay, {
    x: MARGIN + 14, y: cursorY - 30,
    size: 13, font: helveticaBold, color: BLACK,
  })

  const completedStr = document.completedAt
    ? new Intl.DateTimeFormat('en-US', { dateStyle: 'long', timeStyle: 'short' })
        .format(new Date(document.completedAt))
    : '—'
  page.drawText(`Completed: ${completedStr}`, {
    x: MARGIN + 14, y: cursorY - 50,
    size: 8, font: helvetica, color: GREY,
  })

  // Green "Completed" badge
  page.drawRectangle({
    x: PAGE_W - MARGIN - 90, y: cursorY - 38,
    width: 82, height: 20,
    color: rgb(0.9, 1, 0.95),
  })
  page.drawText('✓  COMPLETED', {
    x: PAGE_W - MARGIN - 84, y: cursorY - 30,
    size: 7, font: helveticaBold, color: EMERALD,
  })

  cursorY -= 78

  // ── "Signed by" section ──────────────────────────────────────────────────
  page.drawText('SIGNED BY', {
    x: MARGIN, y: cursorY,
    size: 8, font: helveticaBold, color: GREY,
  })
  cursorY -= 10
  drawRule(page, cursorY, MARGIN, PAGE_W)
  cursorY -= 14

  for (const signer of document.signers) {
    if (cursorY < 120) break  // safety: don't overflow the page

    // Row background
    page.drawRectangle({
      x: MARGIN, y: cursorY - 40,
      width: PAGE_W - MARGIN * 2, height: 46,
      color: LIGHT,
    })

    // Name + email
    page.drawText(signer.name, {
      x: MARGIN + 12, y: cursorY - 14,
      size: 10, font: helveticaBold, color: BLACK,
    })
    page.drawText(signer.email, {
      x: MARGIN + 12, y: cursorY - 26,
      size: 8, font: helvetica, color: GREY,
    })

    // Signed date + IP
    const signedOn = signer.signedAt
      ? new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' })
          .format(new Date(signer.signedAt))
      : 'Not yet signed'
    page.drawText(`Signed: ${signedOn}`, {
      x: PAGE_W - MARGIN - 220, y: cursorY - 14,
      size: 8, font: helvetica, color: BLACK,
    })
    if (signer.signedIp) {
      page.drawText(`IP: ${signer.signedIp}`, {
        x: PAGE_W - MARGIN - 220, y: cursorY - 26,
        size: 8, font: helvetica, color: GREY,
      })
    }

    // Signed status dot
    page.drawCircle({
      x: PAGE_W - MARGIN - 14, y: cursorY - 20,
      size: 5,
      color: signer.status === 'signed' ? EMERALD : rgb(0.9, 0.5, 0.2),
    })

    cursorY -= 54
  }

  cursorY -= 8

  // ── Audit trail section ──────────────────────────────────────────────────
  page.drawText('AUDIT TRAIL', {
    x: MARGIN, y: cursorY,
    size: 8, font: helveticaBold, color: GREY,
  })
  cursorY -= 10
  drawRule(page, cursorY, MARGIN, PAGE_W)
  cursorY -= 14

  const actionLabels: Record<string, string> = {
    document_created:      'Document uploaded',
    document_prepared:     'Fields placed',
    document_sent:         'Sent for signatures',
    document_sent_bulk:    'Sent via Bulk Send',
    document_signed:       'Signed',
    document_completed:    'All parties signed — completed',
    document_voided:       'Document voided',
    reminder_sent:         'Reminder sent',
    document_viewed:       'Viewed',
  }

  for (const log of document.auditLogs) {
    if (cursorY < 80) break

    const label = actionLabels[log.action] ?? log.action.replace(/_/g, ' ')
    const ts = new Intl.DateTimeFormat('en-US', { dateStyle: 'short', timeStyle: 'short' })
      .format(new Date(log.timestamp))

    page.drawText(`• ${label}`, {
      x: MARGIN + 4, y: cursorY,
      size: 8, font: helveticaBold, color: BLACK,
    })
    page.drawText(`${log.actorEmail}${log.ipAddress ? `  ·  IP ${log.ipAddress}` : ''}`, {
      x: MARGIN + 4, y: cursorY - 10,
      size: 7, font: helvetica, color: GREY,
    })
    page.drawText(ts, {
      x: PAGE_W - MARGIN - 110, y: cursorY,
      size: 7, font: helvetica, color: GREY,
    })

    cursorY -= 22
  }

  // ── Footer ───────────────────────────────────────────────────────────────
  drawRule(page, 52, MARGIN, PAGE_W, GREY, 0.5)
  page.drawText(`Certificate ID: ${document.id}`, {
    x: MARGIN, y: 36,
    size: 7, font: helvetica, color: GREY,
  })
  page.drawText('Generated by SignVault · signvault.co', {
    x: PAGE_W - MARGIN - 180, y: 36,
    size: 7, font: helvetica, color: GREY,
  })

  // ── Serialise and return ─────────────────────────────────────────────────
  const pdfBytes = await pdfDoc.save()

  const safeName = document.name.replace(/[^a-z0-9]/gi, '-').toLowerCase().slice(0, 60)
  return new NextResponse(Buffer.from(pdfBytes), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="certificate-${safeName}.pdf"`,
      'Cache-Control': 'private, no-store',
    },
  })
}
