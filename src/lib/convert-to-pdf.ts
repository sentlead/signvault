/**
 * convert-to-pdf.ts
 *
 * Converts image files (JPG, PNG) and Word documents (.docx) to PDF buffers.
 * Called by the upload route when a non-PDF file is uploaded.
 *
 * - Images: embedded into an A4 PDF page using pdf-lib, scaled to fit.
 * - DOCX: text extracted via mammoth, laid out in an A4 PDF using pdf-lib.
 *         Formatting isn't preserved — this produces a plain-text PDF.
 *         Good enough for signing; users who need formatting should upload PDF directly.
 */

import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'

// A4 dimensions in points (72 points per inch)
const A4_WIDTH  = 595
const A4_HEIGHT = 842
const MARGIN    = 50

// ── Image → PDF ───────────────────────────────────────────────────────────────

export async function imageToPdf(imageBuffer: Buffer, mimeType: string): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create()
  const page = pdfDoc.addPage([A4_WIDTH, A4_HEIGHT])

  let image
  if (mimeType === 'image/png') {
    image = await pdfDoc.embedPng(new Uint8Array(imageBuffer))
  } else {
    // JPEG / JPG
    image = await pdfDoc.embedJpg(new Uint8Array(imageBuffer))
  }

  const { width: imgW, height: imgH } = image.size()
  const maxW = A4_WIDTH - MARGIN * 2
  const maxH = A4_HEIGHT - MARGIN * 2
  const scale = Math.min(maxW / imgW, maxH / imgH, 1) // never upscale

  const drawW = imgW * scale
  const drawH = imgH * scale

  page.drawImage(image, {
    x: (A4_WIDTH - drawW) / 2,
    y: (A4_HEIGHT - drawH) / 2,
    width: drawW,
    height: drawH,
  })

  return Buffer.from(await pdfDoc.save())
}

// ── DOCX → PDF ────────────────────────────────────────────────────────────────

export async function docxToPdf(docxBuffer: Buffer): Promise<Buffer> {
  // Extract plain text from the .docx file
  const mammoth = await import('mammoth')
  const { value: rawText } = await mammoth.extractRawText({ buffer: docxBuffer })

  const pdfDoc = await PDFDocument.create()
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const fontSize = 11
  const lineHeight = fontSize * 1.5
  const maxWidth = A4_WIDTH - MARGIN * 2

  // Split text into lines that fit within the page width
  const paragraphs = rawText.split(/\n+/).filter((p) => p.trim().length > 0)
  const lines: string[] = []

  for (const para of paragraphs) {
    const words = para.split(' ')
    let currentLine = ''

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word
      const lineWidth = font.widthOfTextAtSize(testLine, fontSize)

      if (lineWidth > maxWidth && currentLine) {
        lines.push(currentLine)
        currentLine = word
      } else {
        currentLine = testLine
      }
    }
    if (currentLine) lines.push(currentLine)
    lines.push('') // blank line between paragraphs
  }

  // Render lines onto pages
  let page = pdfDoc.addPage([A4_WIDTH, A4_HEIGHT])
  let y = A4_HEIGHT - MARGIN

  for (const line of lines) {
    if (y < MARGIN + lineHeight) {
      // Start a new page when we run out of vertical space
      page = pdfDoc.addPage([A4_WIDTH, A4_HEIGHT])
      y = A4_HEIGHT - MARGIN
    }

    if (line.trim()) {
      page.drawText(line, {
        x: MARGIN,
        y,
        size: fontSize,
        font,
        color: rgb(0, 0, 0),
      })
    }

    y -= lineHeight
  }

  return Buffer.from(await pdfDoc.save())
}
