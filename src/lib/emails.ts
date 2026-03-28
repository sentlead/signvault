/**
 * lib/emails.ts
 *
 * Email sending functions using Resend.
 * If RESEND_API_KEY is not configured, emails are logged to the console
 * so the app works in development without an API key.
 *
 * Three email types:
 *   - sendSigningRequest   — sent to each signer when the owner sends a document
 *   - sendSigningReminder  — sent to a signer who hasn't signed yet
 *   - sendCompletionNotification — sent to the owner when all signers have signed
 */

import { Resend } from 'resend'

// Lazily initialised so missing API key doesn't crash the module
let resendClient: Resend | null = null

function getResend(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null
  if (!resendClient) resendClient = new Resend(process.env.RESEND_API_KEY)
  return resendClient
}

// The "from" address — adjust when you have a verified domain
const FROM_ADDRESS = 'SignVault <noreply@signvault.co>'

// ── HTML template helpers ─────────────────────────────────────────────────────

/**
 * Wraps email body content in a clean, inline-styled HTML shell.
 * All CSS is inline because most email clients ignore <style> blocks.
 */
function emailShell(subject: string, bodyHtml: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${subject}</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f5f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f5f7;padding:40px 20px;">
    <tr>
      <td align="center">
        <!-- Outer container -->
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">

          <!-- Logo header -->
          <tr>
            <td style="background-color:#6366f1;padding:24px 32px;">
              <p style="margin:0;font-size:22px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;">
                ✦ SignVault
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              ${bodyHtml}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#f9fafb;padding:20px 32px;border-top:1px solid #e5e7eb;">
              <p style="margin:0;font-size:12px;color:#9ca3af;line-height:1.6;">
                This email was sent by SignVault. If you did not expect this email, you can safely ignore it.
                <br/>Powered by <strong>SignVault</strong> — secure document signing.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

/** Renders a large CTA button with inline styles */
function ctaButton(text: string, href: string): string {
  return `
    <table cellpadding="0" cellspacing="0" style="margin:24px 0;">
      <tr>
        <td style="border-radius:8px;background-color:#6366f1;">
          <a href="${href}" style="
            display:inline-block;
            padding:14px 28px;
            font-size:15px;
            font-weight:600;
            color:#ffffff;
            text-decoration:none;
            border-radius:8px;
            letter-spacing:0.1px;
          ">${text}</a>
        </td>
      </tr>
    </table>
  `
}

// ── Exported email functions ──────────────────────────────────────────────────

/**
 * Send a signing request email to an external signer.
 * Called when the document owner sends the document for signing.
 *
 * @param to         Signer's email address
 * @param signerName Signer's name (used in the greeting)
 * @param senderName Name of the document owner
 * @param docName    Name of the document to sign
 * @param signingUrl The unique URL the signer should visit to sign
 */
export async function sendSigningRequest({
  to,
  signerName,
  senderName,
  docName,
  signingUrl,
}: {
  to: string
  signerName: string
  senderName: string
  docName: string
  signingUrl: string
}): Promise<void> {
  const subject = `${senderName} has requested your signature on "${docName}"`

  const bodyHtml = `
    <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#111827;">
      Signature Requested
    </h1>
    <p style="margin:0 0 20px;font-size:15px;color:#6b7280;line-height:1.6;">
      Hi ${signerName},
    </p>
    <p style="margin:0 0 20px;font-size:15px;color:#374151;line-height:1.6;">
      <strong>${senderName}</strong> has invited you to sign the document:
    </p>

    <!-- Document name box -->
    <div style="background-color:#f3f4f6;border-left:4px solid #6366f1;border-radius:6px;padding:14px 18px;margin:0 0 24px;">
      <p style="margin:0;font-size:15px;font-weight:600;color:#111827;">📄 ${docName}</p>
    </div>

    <p style="margin:0 0 8px;font-size:14px;color:#6b7280;">
      Click the button below to review and sign this document:
    </p>

    ${ctaButton('Sign Document →', signingUrl)}

    <p style="margin:16px 0 0;font-size:12px;color:#9ca3af;line-height:1.6;">
      This link expires in 7 days. No account is required — just click the button above.
      <br/>If you did not expect this, you can safely ignore this email.
    </p>

    <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0 16px;" />

    <p style="margin:0;font-size:13px;color:#9ca3af;">
      Having trouble? Copy and paste this URL into your browser:
      <br/><span style="word-break:break-all;color:#6366f1;">${signingUrl}</span>
    </p>
  `

  const html = emailShell(subject, bodyHtml)
  const resend = getResend()

  if (!resend) {
    // Log to console when Resend is not configured (development mode)
    console.log('\n[SignVault Email] SIGNING REQUEST')
    console.log('To:', to)
    console.log('Subject:', subject)
    console.log('Signing URL:', signingUrl)
    console.log('(Set RESEND_API_KEY to send real emails)\n')
    return
  }

  const { error } = await resend.emails.send({
    from: FROM_ADDRESS,
    to,
    subject,
    html,
  })

  if (error) {
    console.error('[emails] sendSigningRequest failed:', error)
  }
}

/**
 * Send a reminder email to a signer who hasn't signed yet.
 * Called from the remind API endpoint.
 *
 * @param to         Signer's email address
 * @param signerName Signer's name
 * @param senderName Name of the document owner
 * @param docName    Name of the document
 * @param signingUrl The signer's unique signing URL
 */
export async function sendSigningReminder({
  to,
  signerName,
  senderName,
  docName,
  signingUrl,
}: {
  to: string
  signerName: string
  senderName: string
  docName: string
  signingUrl: string
}): Promise<void> {
  const subject = `Reminder: Please sign "${docName}"`

  const bodyHtml = `
    <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#111827;">
      Friendly Reminder
    </h1>
    <p style="margin:0 0 20px;font-size:15px;color:#6b7280;line-height:1.6;">
      Hi ${signerName},
    </p>
    <p style="margin:0 0 20px;font-size:15px;color:#374151;line-height:1.6;">
      This is a friendly reminder from <strong>${senderName}</strong>. The following document is still awaiting your signature:
    </p>

    <!-- Document name box -->
    <div style="background-color:#fffbeb;border-left:4px solid #f59e0b;border-radius:6px;padding:14px 18px;margin:0 0 24px;">
      <p style="margin:0;font-size:15px;font-weight:600;color:#111827;">📄 ${docName}</p>
      <p style="margin:4px 0 0;font-size:13px;color:#92400e;">Action required — your signature is pending</p>
    </div>

    ${ctaButton('Sign Document Now →', signingUrl)}

    <p style="margin:16px 0 0;font-size:12px;color:#9ca3af;line-height:1.6;">
      This link expires in 7 days from when it was originally sent.
      If you have already signed, please disregard this reminder.
    </p>
  `

  const html = emailShell(subject, bodyHtml)
  const resend = getResend()

  if (!resend) {
    console.log('\n[SignVault Email] REMINDER')
    console.log('To:', to)
    console.log('Subject:', subject)
    console.log('Signing URL:', signingUrl)
    console.log('(Set RESEND_API_KEY to send real emails)\n')
    return
  }

  const { error } = await resend.emails.send({
    from: FROM_ADDRESS,
    to,
    subject,
    html,
  })

  if (error) {
    console.error('[emails] sendSigningReminder failed:', error)
  }
}

/**
 * Send a completion notification to the document owner.
 * Called when the last signer has signed and the document is complete.
 *
 * @param to          Owner's email address
 * @param ownerName   Owner's display name
 * @param docName     Name of the completed document
 * @param documentUrl URL to the document detail page (in the dashboard)
 * @param signerNames Names of all signers who signed
 */
export async function sendCompletionNotification({
  to,
  ownerName,
  docName,
  documentUrl,
  signerNames,
}: {
  to: string
  ownerName: string
  docName: string
  documentUrl: string
  signerNames: string[]
}): Promise<void> {
  const subject = `All parties have signed "${docName}" ✓`

  const signersListHtml = signerNames
    .map(
      (name) =>
        `<li style="margin:4px 0;font-size:14px;color:#374151;">✓ ${name}</li>`
    )
    .join('')

  const bodyHtml = `
    <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#111827;">
      Document Fully Signed! 🎉
    </h1>
    <p style="margin:0 0 20px;font-size:15px;color:#6b7280;line-height:1.6;">
      Hi ${ownerName},
    </p>
    <p style="margin:0 0 20px;font-size:15px;color:#374151;line-height:1.6;">
      Great news! All parties have signed your document:
    </p>

    <!-- Document name box -->
    <div style="background-color:#ecfdf5;border-left:4px solid #10b981;border-radius:6px;padding:14px 18px;margin:0 0 20px;">
      <p style="margin:0;font-size:15px;font-weight:600;color:#111827;">📄 ${docName}</p>
      <p style="margin:4px 0 0;font-size:13px;color:#065f46;">All signatures collected — document completed</p>
    </div>

    <p style="margin:0 0 8px;font-size:14px;font-weight:600;color:#374151;">Signed by:</p>
    <ul style="margin:0 0 24px;padding-left:20px;">
      ${signersListHtml}
    </ul>

    ${ctaButton('View & Download Document →', documentUrl)}

    <p style="margin:16px 0 0;font-size:12px;color:#9ca3af;line-height:1.6;">
      The signed PDF is ready for download from your SignVault dashboard.
    </p>
  `

  const html = emailShell(subject, bodyHtml)
  const resend = getResend()

  if (!resend) {
    console.log('\n[SignVault Email] COMPLETION NOTIFICATION')
    console.log('To:', to)
    console.log('Subject:', subject)
    console.log('Document URL:', documentUrl)
    console.log('(Set RESEND_API_KEY to send real emails)\n')
    return
  }

  const { error } = await resend.emails.send({
    from: FROM_ADDRESS,
    to,
    subject,
    html,
  })

  if (error) {
    console.error('[emails] sendCompletionNotification failed:', error)
  }
}

/**
 * Send an expiry notification to the document owner.
 * Called by the expire-documents cron job when a document's expiresAt
 * date has passed and not all signers have signed yet.
 *
 * @param to           Owner's email address
 * @param ownerName    Owner's display name
 * @param docName      Name of the expired document
 * @param dashboardUrl URL to the owner's dashboard so they can re-send if needed
 */
export async function sendDocumentExpiredNotification({
  to,
  ownerName,
  docName,
  dashboardUrl,
}: {
  to: string
  ownerName: string
  docName: string
  dashboardUrl: string
}): Promise<void> {
  const subject = `Your document "${docName}" has expired`

  const bodyHtml = `
    <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#111827;">
      Document Expired
    </h1>
    <p style="margin:0 0 20px;font-size:15px;color:#6b7280;line-height:1.6;">
      Hi ${ownerName},
    </p>
    <p style="margin:0 0 20px;font-size:15px;color:#374151;line-height:1.6;">
      Unfortunately, the following document expired before all signers completed their signatures:
    </p>

    <!-- Document name box -->
    <div style="background-color:#fef2f2;border-left:4px solid #ef4444;border-radius:6px;padding:14px 18px;margin:0 0 24px;">
      <p style="margin:0;font-size:15px;font-weight:600;color:#111827;">📄 ${docName}</p>
      <p style="margin:4px 0 0;font-size:13px;color:#991b1b;">Document closed — signing period has ended</p>
    </div>

    <p style="margin:0 0 20px;font-size:15px;color:#374151;line-height:1.6;">
      The document has been marked as <strong>expired</strong> and signers can no longer access the signing link.
      You can create a new signing request from your dashboard if you still need this document signed.
    </p>

    ${ctaButton('Go to Dashboard →', dashboardUrl)}

    <p style="margin:16px 0 0;font-size:12px;color:#9ca3af;line-height:1.6;">
      Upgrade to a higher plan to get longer expiry windows or no expiry at all.
    </p>
  `

  const html = emailShell(subject, bodyHtml)
  const resend = getResend()

  if (!resend) {
    // Log to console when Resend is not configured (development mode)
    console.log('\n[SignVault Email] DOCUMENT EXPIRED NOTIFICATION')
    console.log('To:', to)
    console.log('Subject:', subject)
    console.log('Dashboard URL:', dashboardUrl)
    console.log('(Set RESEND_API_KEY to send real emails)\n')
    return
  }

  const { error } = await resend.emails.send({
    from: FROM_ADDRESS,
    to,
    subject,
    html,
  })

  if (error) {
    console.error('[emails] sendDocumentExpiredNotification failed:', error)
  }
}
