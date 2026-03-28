'use client'

/**
 * Contact page — client component for form interactivity.
 * Submits to POST /api/contact which sends the message via Resend.
 */

import { useState } from 'react'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { Send, CheckCircle2, AlertCircle, Mail, MessageSquare, User } from 'lucide-react'

type Status = 'idle' | 'sending' | 'success' | 'error'

export default function ContactPage() {
  const [name,    setName]    = useState('')
  const [email,   setEmail]   = useState('')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [status,  setStatus]  = useState<Status>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('sending')
    setErrorMsg('')

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, subject, message }),
      })

      if (!res.ok) {
        const data = (await res.json()) as { error?: string }
        throw new Error(data.error ?? 'Something went wrong')
      }

      setStatus('success')
      setName(''); setEmail(''); setSubject(''); setMessage('')
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to send message')
      setStatus('error')
    }
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-sv-bg dark:bg-sv-dark-bg pt-24 pb-20 px-6">
        <div className="max-w-2xl mx-auto">

          {/* Header */}
          <div className="mb-10 text-center">
            <p className="text-xs uppercase tracking-widest text-sv-primary dark:text-sv-dark-primary font-semibold mb-2">
              Get in touch
            </p>
            <h1 className="text-4xl font-extrabold text-sv-text dark:text-sv-dark-text tracking-tight mb-3">
              Contact Us
            </h1>
            <p className="text-sv-secondary dark:text-sv-dark-secondary leading-relaxed max-w-md mx-auto">
              Have a question, found a bug, or just want to say hi?
              We&apos;d love to hear from you. We typically respond within 1–2 business days.
            </p>
          </div>

          {/* Contact card */}
          <div className="bg-sv-surface dark:bg-sv-dark-surface
                          border border-sv-border dark:border-sv-dark-border
                          rounded-[var(--radius-card)] overflow-hidden shadow-sm">

            {/* Success state */}
            {status === 'success' ? (
              <div className="flex flex-col items-center justify-center gap-4 py-16 px-8 text-center">
                <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-900/30
                                flex items-center justify-center">
                  <CheckCircle2 className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h2 className="text-xl font-bold text-sv-text dark:text-sv-dark-text">
                  Message sent!
                </h2>
                <p className="text-sv-secondary dark:text-sv-dark-secondary max-w-xs">
                  Thanks for reaching out. We&apos;ll get back to you within 1–2 business days.
                </p>
                <button
                  onClick={() => setStatus('idle')}
                  className="mt-2 text-sm text-sv-primary dark:text-sv-dark-primary
                             hover:underline transition-colors"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="p-8 space-y-5">

                {/* Name + Email row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label htmlFor="name"
                      className="block text-sm font-medium text-sv-text dark:text-sv-dark-text mb-1.5">
                      <span className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5" />
                        Your name
                      </span>
                    </label>
                    <input
                      id="name"
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Jane Smith"
                      className="w-full px-3.5 py-2.5 rounded-[var(--radius-button)] text-sm
                                 border border-sv-border dark:border-sv-dark-border
                                 bg-sv-bg dark:bg-sv-dark-bg
                                 text-sv-text dark:text-sv-dark-text
                                 placeholder:text-sv-secondary dark:placeholder:text-sv-dark-secondary
                                 focus:outline-none focus:ring-2
                                 focus:ring-sv-primary dark:focus:ring-sv-dark-primary
                                 transition"
                    />
                  </div>
                  <div>
                    <label htmlFor="email"
                      className="block text-sm font-medium text-sv-text dark:text-sv-dark-text mb-1.5">
                      <span className="flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5" />
                        Email address
                      </span>
                    </label>
                    <input
                      id="email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="jane@example.com"
                      className="w-full px-3.5 py-2.5 rounded-[var(--radius-button)] text-sm
                                 border border-sv-border dark:border-sv-dark-border
                                 bg-sv-bg dark:bg-sv-dark-bg
                                 text-sv-text dark:text-sv-dark-text
                                 placeholder:text-sv-secondary dark:placeholder:text-sv-dark-secondary
                                 focus:outline-none focus:ring-2
                                 focus:ring-sv-primary dark:focus:ring-sv-dark-primary
                                 transition"
                    />
                  </div>
                </div>

                {/* Subject */}
                <div>
                  <label htmlFor="subject"
                    className="block text-sm font-medium text-sv-text dark:text-sv-dark-text mb-1.5">
                    Subject
                  </label>
                  <input
                    id="subject"
                    type="text"
                    required
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="How can we help?"
                    className="w-full px-3.5 py-2.5 rounded-[var(--radius-button)] text-sm
                               border border-sv-border dark:border-sv-dark-border
                               bg-sv-bg dark:bg-sv-dark-bg
                               text-sv-text dark:text-sv-dark-text
                               placeholder:text-sv-secondary dark:placeholder:text-sv-dark-secondary
                               focus:outline-none focus:ring-2
                               focus:ring-sv-primary dark:focus:ring-sv-dark-primary
                               transition"
                  />
                </div>

                {/* Message */}
                <div>
                  <label htmlFor="message"
                    className="block text-sm font-medium text-sv-text dark:text-sv-dark-text mb-1.5">
                    <span className="flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5" />
                      Message
                    </span>
                  </label>
                  <textarea
                    id="message"
                    required
                    rows={5}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Tell us what's on your mind..."
                    className="w-full px-3.5 py-2.5 rounded-[var(--radius-button)] text-sm
                               border border-sv-border dark:border-sv-dark-border
                               bg-sv-bg dark:bg-sv-dark-bg
                               text-sv-text dark:text-sv-dark-text
                               placeholder:text-sv-secondary dark:placeholder:text-sv-dark-secondary
                               focus:outline-none focus:ring-2
                               focus:ring-sv-primary dark:focus:ring-sv-dark-primary
                               resize-none transition"
                  />
                </div>

                {/* Error message */}
                {status === 'error' && (
                  <div className="flex items-center gap-2 px-4 py-3 rounded-[var(--radius-button)]
                                  bg-red-50 dark:bg-red-900/20
                                  border border-red-200 dark:border-red-800
                                  text-red-700 dark:text-red-400 text-sm">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    {errorMsg}
                  </div>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={status === 'sending'}
                  className="w-full flex items-center justify-center gap-2
                             px-6 py-3 rounded-[var(--radius-button)]
                             bg-sv-primary hover:bg-sv-primary-hover
                             dark:bg-sv-dark-primary dark:hover:bg-sv-dark-primary-hover
                             text-white font-semibold text-sm
                             shadow-sm transition-all
                             disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {status === 'sending' ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10"
                          stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor"
                          d="M4 12a8 8 0 018-8v8z" />
                      </svg>
                      Sending…
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Send Message
                    </>
                  )}
                </button>

              </form>
            )}
          </div>

          {/* Alternative contact */}
          <p className="mt-6 text-center text-sm text-sv-secondary dark:text-sv-dark-secondary">
            Prefer email?{' '}
            <a href="mailto:hello@signvault.co"
              className="text-sv-primary dark:text-sv-dark-primary hover:underline">
              hello@signvault.co
            </a>
          </p>

        </div>
      </main>
      <Footer />
    </>
  )
}
