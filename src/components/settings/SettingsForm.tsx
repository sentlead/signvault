'use client'

import { useState } from 'react'
import { User, Mail, Calendar, Chrome } from 'lucide-react'
import { toast } from '@/lib/toast'

interface Props {
  user: {
    id: string
    name: string | null
    email: string | null
    image: string | null
    createdAt: Date
  }
}

export function SettingsForm({ user }: Props) {
  const [name, setName] = useState(user.name ?? '')
  const [saving, setSaving] = useState(false)

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch('/api/user', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      })
      if (!res.ok) throw new Error('Failed to save')
      toast.success('Profile updated!')
    } catch {
      toast.error('Could not save changes. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">

      {/* Profile card */}
      <div className="bg-sv-surface dark:bg-sv-dark-surface rounded-[var(--radius-card)]
                      border border-sv-border dark:border-sv-dark-border p-6">
        <h2 className="text-sm font-semibold text-sv-text dark:text-sv-dark-text mb-5">
          Profile
        </h2>

        {/* Avatar */}
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full overflow-hidden flex-shrink-0
                          bg-sv-primary dark:bg-sv-dark-primary
                          flex items-center justify-center text-white text-xl font-bold">
            {user.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.image} alt={user.name ?? 'Avatar'} className="w-full h-full object-cover" />
            ) : (
              (user.name?.[0] ?? user.email?.[0] ?? '?').toUpperCase()
            )}
          </div>
          <div>
            <p className="text-sm font-medium text-sv-text dark:text-sv-dark-text">
              {user.name ?? 'No name set'}
            </p>
            <p className="text-xs text-sv-secondary dark:text-sv-dark-secondary mt-0.5">
              Avatar synced from your sign-in provider
            </p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          {/* Display name */}
          <div>
            <label className="block text-xs font-medium text-sv-secondary dark:text-sv-dark-secondary mb-1.5">
              Display name
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4
                               text-sv-secondary dark:text-sv-dark-secondary pointer-events-none" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="w-full pl-9 pr-4 py-2.5 text-sm rounded-[var(--radius-input)]
                           bg-sv-bg dark:bg-sv-dark-bg
                           border border-sv-border dark:border-sv-dark-border
                           text-sv-text dark:text-sv-dark-text
                           placeholder:text-sv-secondary dark:placeholder:text-sv-dark-secondary
                           focus:outline-none focus:ring-2 focus:ring-sv-primary dark:focus:ring-sv-dark-primary
                           transition"
              />
            </div>
          </div>

          {/* Email (read-only) */}
          <div>
            <label className="block text-xs font-medium text-sv-secondary dark:text-sv-dark-secondary mb-1.5">
              Email address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4
                               text-sv-secondary dark:text-sv-dark-secondary pointer-events-none" />
              <input
                type="email"
                value={user.email ?? ''}
                readOnly
                className="w-full pl-9 pr-4 py-2.5 text-sm rounded-[var(--radius-input)]
                           bg-sv-border/30 dark:bg-sv-dark-border/30
                           border border-sv-border dark:border-sv-dark-border
                           text-sv-secondary dark:text-sv-dark-secondary
                           cursor-not-allowed"
              />
            </div>
            <p className="mt-1 text-xs text-sv-secondary dark:text-sv-dark-secondary">
              Email is managed by your sign-in provider and cannot be changed here.
            </p>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2.5 rounded-[var(--radius-input)] text-sm font-medium
                       bg-sv-primary dark:bg-sv-dark-primary text-white
                       hover:opacity-90 disabled:opacity-50
                       transition-opacity"
          >
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </form>
      </div>

      {/* Account info card */}
      <div className="bg-sv-surface dark:bg-sv-dark-surface rounded-[var(--radius-card)]
                      border border-sv-border dark:border-sv-dark-border p-6">
        <h2 className="text-sm font-semibold text-sv-text dark:text-sv-dark-text mb-5">
          Account
        </h2>
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Chrome className="w-4 h-4 text-sv-secondary dark:text-sv-dark-secondary flex-shrink-0" />
            <div>
              <p className="text-xs font-medium text-sv-text dark:text-sv-dark-text">Sign-in method</p>
              <p className="text-xs text-sv-secondary dark:text-sv-dark-secondary">Google OAuth</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Calendar className="w-4 h-4 text-sv-secondary dark:text-sv-dark-secondary flex-shrink-0" />
            <div>
              <p className="text-xs font-medium text-sv-text dark:text-sv-dark-text">Member since</p>
              <p className="text-xs text-sv-secondary dark:text-sv-dark-secondary">
                {new Date(user.createdAt).toLocaleDateString('en-GB', {
                  day: 'numeric', month: 'long', year: 'numeric',
                })}
              </p>
            </div>
          </div>
        </div>
      </div>

    </div>
  )
}
