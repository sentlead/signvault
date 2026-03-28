/**
 * Privacy Policy page
 * TODO: Review all sections before going to production.
 */

import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy — SignVault',
  description: 'How SignVault collects, uses, and protects your personal information.',
}

const LAST_UPDATED = 'March 28, 2026'
const CONTACT_EMAIL = 'privacy@signvault.co' // TODO: confirm address

const sections = [
  {
    title: '1. Information We Collect',
    body: `We collect information you provide directly to us, including:

• **Account information** — your name and email address when you sign in with Google or a magic link.
• **Documents** — PDFs you upload to SignVault for signing. Files are stored securely and are only accessible to you and the recipients you designate.
• **Signature data** — drawn, typed, or uploaded signature images associated with signed documents.
• **Usage data** — pages visited, features used, and actions taken within the app, collected to improve the service.
• **IP addresses** — recorded in audit logs when external signers complete a signing action, for legal traceability.`,
  },
  {
    title: '2. How We Use Your Information',
    body: `We use the information we collect to:

• Provide, maintain, and improve the SignVault service.
• Authenticate you and keep your account secure.
• Deliver documents to recipients and send email notifications (signing requests, reminders, completion notices).
• Generate and store signed PDF documents on your behalf.
• Maintain audit trails for legally binding e-signature records.
• Respond to your support requests and communications.
• Detect, investigate, and prevent fraudulent or unauthorised activity.`,
  },
  {
    title: '3. How We Share Your Information',
    body: `We do not sell your personal data. We share information only in the following circumstances:

• **Recipients you designate** — when you send a document for signing, we share the document and your name with the specified signers via email.
• **Service providers** — we use third-party services to operate SignVault, including Vercel (hosting), Turso/LibSQL (database), Vercel Blob (file storage), Resend (email delivery), and Google (OAuth sign-in). Each provider processes data only as necessary to deliver their service.
• **Legal requirements** — we may disclose information if required by law, court order, or to protect the rights, property, or safety of SignVault, our users, or the public.`,
  },
  {
    title: '4. Data Retention',
    body: `We retain your account information and documents for as long as your account is active. If you delete your account, we will delete your personal data and documents within 30 days, except where we are required to retain it for legal or compliance purposes.

Signed documents and their associated audit logs may be retained for up to 7 years to support the legal validity of executed agreements. You may request deletion of specific documents at any time by contacting us.`,
  },
  {
    title: '5. Security',
    body: `We take reasonable technical and organisational measures to protect your information against unauthorised access, loss, or disclosure. Documents are stored in private, access-controlled cloud storage. Signing links are short-lived JWT tokens that expire after 7 days.

No method of transmission or storage is 100% secure. We encourage you to use a strong, unique password for your Google account and to report any suspected security incidents to us promptly.`,
  },
  {
    title: '6. Cookies',
    body: `SignVault uses session cookies to keep you signed in. We do not use advertising or tracking cookies. Third-party services we use (such as Google OAuth) may set their own cookies governed by their respective privacy policies.`,
  },
  {
    title: '7. Your Rights',
    body: `Depending on your location, you may have the right to:

• Access the personal data we hold about you.
• Request correction of inaccurate data.
• Request deletion of your data (subject to legal retention obligations).
• Object to or restrict certain processing activities.
• Export your data in a portable format.

To exercise any of these rights, please contact us at the address below.`,
  },
  {
    title: '8. Children\'s Privacy',
    body: `SignVault is not directed to children under 13. We do not knowingly collect personal information from children. If you believe we have inadvertently collected such information, please contact us and we will delete it promptly.`,
  },
  {
    title: '9. Changes to This Policy',
    body: `We may update this Privacy Policy from time to time. We will notify you of material changes by email or by posting a notice in the app. Your continued use of SignVault after the effective date of any changes constitutes acceptance of the updated policy.`,
  },
  {
    title: '10. Contact Us',
    body: `If you have any questions about this Privacy Policy or our data practices, please contact us at:\n\n**${CONTACT_EMAIL}**`,
  },
]

export default function PrivacyPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-sv-bg dark:bg-sv-dark-bg pt-24 pb-20 px-6">
        <div className="max-w-3xl mx-auto">

          {/* Header */}
          <div className="mb-10">
            <p className="text-xs uppercase tracking-widest text-sv-primary dark:text-sv-dark-primary font-semibold mb-2">
              Legal
            </p>
            <h1 className="text-4xl font-extrabold text-sv-text dark:text-sv-dark-text tracking-tight mb-3">
              Privacy Policy
            </h1>
            <p className="text-sm text-sv-secondary dark:text-sv-dark-secondary">
              Last updated: {LAST_UPDATED}
            </p>
            <p className="mt-4 text-sv-secondary dark:text-sv-dark-secondary leading-relaxed">
              SignVault (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) is committed to protecting your privacy.
              This policy explains how we collect, use, and safeguard information when you use our service.
            </p>
          </div>

          {/* Sections */}
          <div className="space-y-10">
            {sections.map((section) => (
              <section key={section.title}>
                <h2 className="text-lg font-bold text-sv-text dark:text-sv-dark-text mb-3">
                  {section.title}
                </h2>
                <div className="text-sv-secondary dark:text-sv-dark-secondary leading-relaxed space-y-2">
                  {section.body.split('\n').map((line, i) => {
                    if (!line.trim()) return null
                    // Render **bold** markers
                    const parts = line.split(/\*\*(.+?)\*\*/)
                    return (
                      <p key={i}>
                        {parts.map((part, j) =>
                          j % 2 === 1
                            ? <strong key={j} className="text-sv-text dark:text-sv-dark-text font-semibold">{part}</strong>
                            : part
                        )}
                      </p>
                    )
                  })}
                </div>
              </section>
            ))}
          </div>

          {/* Divider */}
          <div className="mt-14 pt-8 border-t border-sv-border dark:border-sv-dark-border">
            <p className="text-xs text-sv-secondary dark:text-sv-dark-secondary text-center">
              &copy; {new Date().getFullYear()} SignVault. All rights reserved.
            </p>
          </div>

        </div>
      </main>
      <Footer />
    </>
  )
}
