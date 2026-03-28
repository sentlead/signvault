/**
 * Terms of Service page
 * TODO: Review all sections before going to production.
 */

import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms of Service — SignVault',
  description: 'The terms and conditions governing your use of SignVault.',
}

const LAST_UPDATED = 'March 28, 2026'
const CONTACT_EMAIL = 'legal@signvault.co' // TODO: confirm address

const sections = [
  {
    title: '1. Acceptance of Terms',
    body: `By accessing or using SignVault ("the Service"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the Service.

These terms apply to all users, including document owners and external signers who access the Service via a signing link without creating an account.`,
  },
  {
    title: '2. Description of Service',
    body: `SignVault is a free electronic document signing platform that allows users to:

• Upload PDF documents and place signature fields.
• Sign documents electronically.
• Send documents to third parties for electronic signature.
• Download completed, signed PDF documents.

We reserve the right to modify, suspend, or discontinue any part of the Service at any time without notice.`,
  },
  {
    title: '3. User Accounts',
    body: `To access the full Service, you must sign in using a supported authentication method (currently Google OAuth). You are responsible for maintaining the security of your account and for all activity that occurs under your account.

You agree to provide accurate information and to notify us immediately of any unauthorised use of your account.`,
  },
  {
    title: '4. Acceptable Use',
    body: `You agree not to use the Service to:

• Upload, transmit, or distribute illegal, fraudulent, or harmful content.
• Forge signatures or impersonate any person or entity.
• Interfere with or disrupt the Service or its infrastructure.
• Attempt to gain unauthorised access to any part of the Service.
• Use the Service for any commercial purpose that competes directly with SignVault without our prior written consent.
• Violate any applicable local, national, or international law or regulation.

We reserve the right to suspend or terminate accounts that violate these terms.`,
  },
  {
    title: '5. Electronic Signatures',
    body: `Electronic signatures created through SignVault are intended to be legally binding under applicable e-signature laws, including the EU eIDAS Regulation and the US Electronic Signatures in Global and National Commerce Act (ESIGN).

You are solely responsible for ensuring that your use of electronic signatures complies with applicable law in your jurisdiction. SignVault does not provide legal advice. For documents requiring a specific form of signature (e.g. qualified electronic signatures), you should consult a qualified legal professional.`,
  },
  {
    title: '6. Your Content',
    body: `You retain full ownership of any documents, signatures, and other content you upload to SignVault ("Your Content"). By using the Service, you grant SignVault a limited, non-exclusive licence to store, process, and transmit Your Content solely as necessary to provide the Service.

You represent and warrant that you have all rights necessary to upload Your Content and to grant the above licence, and that Your Content does not infringe any third-party rights.`,
  },
  {
    title: '7. Privacy',
    body: `Our collection and use of personal information is governed by our Privacy Policy, which is incorporated into these Terms by reference. By using the Service, you consent to the collection and use of your information as described in the Privacy Policy.`,
  },
  {
    title: '8. Intellectual Property',
    body: `The SignVault name, logo, and all software, design, and content created by SignVault are protected by copyright, trademark, and other intellectual property laws. You may not copy, modify, or distribute any part of the Service without our prior written permission.`,
  },
  {
    title: '9. Disclaimers',
    body: `THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.

We do not warrant that the Service will be uninterrupted, error-free, or free of viruses or other harmful components. We do not warrant the legal enforceability of any document signed through the Service in any particular jurisdiction.`,
  },
  {
    title: '10. Limitation of Liability',
    body: `TO THE FULLEST EXTENT PERMITTED BY LAW, SIGNVAULT AND ITS OPERATORS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING FROM YOUR USE OF THE SERVICE, EVEN IF WE HAVE BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.

OUR TOTAL LIABILITY TO YOU FOR ANY CLAIM ARISING FROM OR RELATED TO THE SERVICE SHALL NOT EXCEED THE AMOUNT YOU PAID US IN THE TWELVE MONTHS PRECEDING THE CLAIM (OR £10 IF YOU HAVE NOT MADE ANY PAYMENTS).`,
  },
  {
    title: '11. Termination',
    body: `You may stop using the Service at any time. We may suspend or terminate your access at any time, with or without notice, if we believe you have violated these Terms or for any other reason at our discretion.

Upon termination, your right to use the Service ceases immediately. Sections 6, 8, 9, 10, and 12 survive termination.`,
  },
  {
    title: '12. Governing Law',
    body: `These Terms shall be governed by and construed in accordance with the laws of England and Wales, without regard to conflict of law principles. Any disputes arising under these Terms shall be subject to the exclusive jurisdiction of the courts of England and Wales.

// TODO: Update governing law to match your actual jurisdiction before going live.`,
  },
  {
    title: '13. Changes to These Terms',
    body: `We may update these Terms from time to time. We will notify you of material changes by email or by posting a notice in the app at least 14 days before the changes take effect. Your continued use of the Service after the effective date constitutes acceptance of the updated Terms.`,
  },
  {
    title: '14. Contact',
    body: `If you have any questions about these Terms, please contact us at:\n\n**${CONTACT_EMAIL}**`,
  },
]

export default function TermsPage() {
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
              Terms of Service
            </h1>
            <p className="text-sm text-sv-secondary dark:text-sv-dark-secondary">
              Last updated: {LAST_UPDATED}
            </p>
            <p className="mt-4 text-sv-secondary dark:text-sv-dark-secondary leading-relaxed">
              Please read these Terms of Service carefully before using SignVault.
              They set out the rules for using our platform and the legal relationship between you and us.
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
