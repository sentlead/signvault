/**
 * POST /api/contact
 *
 * Accepts a contact form submission and sends it to the support inbox
 * via Resend. Falls back to console.log in dev if RESEND_API_KEY is not set.
 *
 * Body: { name, email, subject, message }
 */

import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const SUPPORT_EMAIL = 'hello@signvault.co' // TODO: confirm inbox address

export async function POST(req: NextRequest) {
  let body: { name?: string; email?: string; subject?: string; message?: string }
  try {
    body = (await req.json()) as typeof body
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { name, email, subject, message } = body

  if (!name?.trim() || !email?.trim() || !subject?.trim() || !message?.trim()) {
    return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
  }

  // Basic email format check
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })
  }

  const html = `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;">
      <h2 style="margin:0 0 16px;font-size:20px;color:#111827;">
        New contact form submission
      </h2>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <tr>
          <td style="padding:8px 12px;background:#f3f4f6;font-weight:600;width:100px;border-radius:4px 0 0 4px;">From</td>
          <td style="padding:8px 12px;border:1px solid #e5e7eb;">${name} &lt;${email}&gt;</td>
        </tr>
        <tr>
          <td style="padding:8px 12px;background:#f3f4f6;font-weight:600;">Subject</td>
          <td style="padding:8px 12px;border:1px solid #e5e7eb;">${subject}</td>
        </tr>
        <tr>
          <td style="padding:8px 12px;background:#f3f4f6;font-weight:600;vertical-align:top;">Message</td>
          <td style="padding:8px 12px;border:1px solid #e5e7eb;white-space:pre-wrap;">${message}</td>
        </tr>
      </table>
      <p style="margin-top:24px;font-size:12px;color:#9ca3af;">
        Sent via SignVault contact form · Reply directly to this email to respond.
      </p>
    </div>
  `

  if (!process.env.RESEND_API_KEY) {
    console.log('\n[SignVault Contact] New message')
    console.log('From:', `${name} <${email}>`)
    console.log('Subject:', subject)
    console.log('Message:', message)
    console.log('(Set RESEND_API_KEY to send real emails)\n')
    return NextResponse.json({ success: true })
  }

  const resend = new Resend(process.env.RESEND_API_KEY)

  const { error } = await resend.emails.send({
    from: 'SignVault <noreply@signvault.co>',
    to: SUPPORT_EMAIL,
    replyTo: email,
    subject: `[Contact] ${subject}`,
    html,
  })

  if (error) {
    console.error('[contact] Resend error:', error)
    return NextResponse.json({ error: 'Failed to send message. Please try again.' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
