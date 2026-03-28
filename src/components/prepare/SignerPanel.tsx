'use client'

/**
 * SignerPanel.tsx
 *
 * Panel for managing the list of people who will sign this document.
 * Shown inside the PrepareEditor when "Send for Signatures" mode is active.
 *
 * Features:
 *   - "Add Signer" button that reveals an inline form (name + email)
 *   - Saved contacts picker — pick a contact to auto-fill name + email
 *   - "Save to Contacts" prompt after adding a signer who isn't saved yet
 *   - List of added signers, each with a color dot, name, email, remove button
 */

import { useState, useEffect, useRef } from 'react'
import { UserPlus, X, User, BookUser, Check } from 'lucide-react'

// ── Signer color palette ───────────────────────────────────────────────────────
// One color per signer slot. Cycles if there are more than 5 signers.

export const SIGNER_COLORS = [
  {
    name: 'indigo',
    dot: 'bg-indigo-500',
    badge: 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300',
    border: 'border-indigo-400',
  },
  {
    name: 'rose',
    dot: 'bg-rose-500',
    badge: 'bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300',
    border: 'border-rose-400',
  },
  {
    name: 'emerald',
    dot: 'bg-emerald-500',
    badge: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300',
    border: 'border-emerald-400',
  },
  {
    name: 'amber',
    dot: 'bg-amber-500',
    badge: 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300',
    border: 'border-amber-400',
  },
  {
    name: 'violet',
    dot: 'bg-violet-500',
    badge: 'bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300',
    border: 'border-violet-400',
  },
] as const

/** Gets the color config for a signer at a given index (wraps around if > 5) */
export function getSignerColor(index: number) {
  return SIGNER_COLORS[index % SIGNER_COLORS.length]
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface SignerData {
  /** Client-side ID, used as the signerId in fields before the record exists in DB */
  id: string
  name: string
  email: string
}

interface SavedContact {
  id: string
  name: string
  email: string
}

interface SignerPanelProps {
  signers: SignerData[]
  onAddSigner: (signer: SignerData) => void
  onRemoveSigner: (id: string) => void
}

// ── Component ─────────────────────────────────────────────────────────────────

export function SignerPanel({
  signers,
  onAddSigner,
  onRemoveSigner,
}: SignerPanelProps) {
  // Whether the inline "add signer" form is visible
  const [showForm, setShowForm] = useState(false)
  // Form field values
  const [nameInput, setNameInput] = useState('')
  const [emailInput, setEmailInput] = useState('')
  // Inline validation error
  const [formError, setFormError] = useState<string | null>(null)

  // Saved contacts state
  const [contacts, setContacts] = useState<SavedContact[]>([])
  const [showContactPicker, setShowContactPicker] = useState(false)
  const [contactFilter, setContactFilter] = useState('')
  // After adding a signer who isn't in contacts yet, prompt to save them
  const [savePrompt, setSavePrompt] = useState<{ name: string; email: string } | null>(null)
  const [savingContact, setSavingContact] = useState(false)
  const [savedConfirm, setSavedConfirm] = useState(false)
  const filterRef = useRef<HTMLInputElement>(null)

  // Load saved contacts once when the form opens
  useEffect(() => {
    if (!showForm) return
    fetch('/api/contacts')
      .then((r) => r.json())
      .then((data: { contacts?: SavedContact[] }) => {
        if (data.contacts) setContacts(data.contacts)
      })
      .catch(() => {/* silently ignore */})
  }, [showForm])

  // Focus the filter input when the picker opens
  useEffect(() => {
    if (showContactPicker) filterRef.current?.focus()
  }, [showContactPicker])

  function pickContact(contact: SavedContact) {
    setNameInput(contact.name)
    setEmailInput(contact.email)
    setFormError(null)
    setShowContactPicker(false)
    setContactFilter('')
  }

  function handleAdd() {
    const name = nameInput.trim()
    const email = emailInput.trim().toLowerCase()

    // Basic validation
    if (!name) {
      setFormError('Please enter a name.')
      return
    }
    if (!email || !email.includes('@')) {
      setFormError('Please enter a valid email address.')
      return
    }

    // Don't allow duplicate emails
    if (signers.some((s) => s.email.toLowerCase() === email)) {
      setFormError('A signer with that email is already added.')
      return
    }

    onAddSigner({
      id: crypto.randomUUID(),
      name,
      email,
    })

    // If this email isn't in contacts yet, offer to save it
    const alreadySaved = contacts.some((c) => c.email.toLowerCase() === email)
    if (!alreadySaved) {
      setSavePrompt({ name, email })
    }

    // Reset form
    setNameInput('')
    setEmailInput('')
    setFormError(null)
    setShowForm(false)
    setShowContactPicker(false)
    setContactFilter('')
  }

  function handleCancel() {
    setNameInput('')
    setEmailInput('')
    setFormError(null)
    setShowForm(false)
    setShowContactPicker(false)
    setContactFilter('')
  }

  async function handleSaveContact() {
    if (!savePrompt) return
    setSavingContact(true)
    try {
      const res = await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: savePrompt.name, email: savePrompt.email }),
      })
      if (res.ok) {
        // Add to local list so future sessions reflect it
        const data = await res.json() as { contact?: SavedContact }
        if (data.contact) setContacts((prev) => [...prev, data.contact!])
        setSavedConfirm(true)
        setTimeout(() => {
          setSavePrompt(null)
          setSavedConfirm(false)
        }, 1500)
      }
    } catch {/* ignore */}
    finally {
      setSavingContact(false)
    }
  }

  // Filter contacts by name or email
  const filteredContacts = contacts.filter((c) => {
    const q = contactFilter.toLowerCase()
    return !q || c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q)
  })

  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-wider
                     text-sv-secondary dark:text-sv-dark-secondary mb-3">
        Signers
      </h3>

      {/* ── Signer list ─────────────────────────────────────────────────── */}
      {signers.length > 0 ? (
        <>
          <ul className="space-y-2 mb-2">
            {signers.map((signer, index) => {
              const color = getSignerColor(index)
              return (
                <li
                  key={signer.id}
                  className="
                    flex items-center gap-2 px-3 py-2
                    rounded-[var(--radius-button)]
                    bg-sv-bg dark:bg-sv-dark-bg
                    border border-sv-border dark:border-sv-dark-border
                  "
                >
                  {/* Signing order badge — shows which turn this signer signs */}
                  <span className="w-5 h-5 flex-shrink-0 rounded-full bg-sv-border dark:bg-sv-dark-border
                                   text-xs font-bold text-sv-secondary dark:text-sv-dark-secondary
                                   flex items-center justify-center">
                    {index + 1}
                  </span>

                  {/* Color dot */}
                  <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${color.dot}`} />

                  {/* Name + email */}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-sv-text dark:text-sv-dark-text truncate leading-none mb-0.5">
                      {signer.name}
                    </p>
                    <p className="text-xs text-sv-secondary dark:text-sv-dark-secondary truncate leading-none">
                      {signer.email}
                    </p>
                  </div>

                  {/* Remove button */}
                  <button
                    onClick={() => onRemoveSigner(signer.id)}
                    className="
                      w-5 h-5 flex-shrink-0 flex items-center justify-center rounded-full
                      text-sv-secondary dark:text-sv-dark-secondary
                      hover:bg-red-100 dark:hover:bg-red-900/30
                      hover:text-red-600 dark:hover:text-red-400
                      transition-colors
                    "
                    aria-label={`Remove ${signer.name}`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </li>
              )
            })}
          </ul>

          {/* Sequential signing hint — only shown when there are 2+ signers */}
          {signers.length >= 2 && (
            <p className="text-xs text-sv-secondary dark:text-sv-dark-secondary mb-3 leading-relaxed">
              Signers will be emailed in order: 1st signer first, then 2nd after they sign, and so on.
            </p>
          )}
        </>
      ) : (
        // Empty state hint
        <div className="
          mb-3 px-3 py-3 rounded-[var(--radius-button)]
          bg-sv-bg dark:bg-sv-dark-bg
          border border-dashed border-sv-border dark:border-sv-dark-border
          flex items-center gap-2
        ">
          <User className="w-4 h-4 text-sv-secondary dark:text-sv-dark-secondary flex-shrink-0" />
          <p className="text-xs text-sv-secondary dark:text-sv-dark-secondary leading-relaxed">
            Add at least one signer to send the document.
          </p>
        </div>
      )}

      {/* ── "Save to contacts?" prompt ───────────────────────────────────── */}
      {savePrompt && (
        <div className="
          mb-2 px-3 py-2 rounded-[var(--radius-button)]
          bg-indigo-50 dark:bg-indigo-900/20
          border border-indigo-200 dark:border-indigo-800
          flex items-center gap-2
        ">
          {savedConfirm ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
              <span className="text-xs text-emerald-700 dark:text-emerald-300">
                Saved to contacts!
              </span>
            </>
          ) : (
            <>
              <BookUser className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400 flex-shrink-0" />
              <span className="text-xs text-sv-text dark:text-sv-dark-text flex-1 min-w-0 truncate">
                Save {savePrompt.name} to contacts?
              </span>
              <button
                onClick={handleSaveContact}
                disabled={savingContact}
                className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline disabled:opacity-50"
              >
                Save
              </button>
              <button
                onClick={() => setSavePrompt(null)}
                className="text-xs text-sv-secondary dark:text-sv-dark-secondary hover:underline"
              >
                Skip
              </button>
            </>
          )}
        </div>
      )}

      {/* ── Add signer form ──────────────────────────────────────────────── */}
      {showForm ? (
        <div className="space-y-2">

          {/* Contact picker toggle — only shown if there are saved contacts */}
          {contacts.length > 0 && (
            <div>
              <button
                type="button"
                onClick={() => setShowContactPicker((v) => !v)}
                className="
                  flex items-center gap-1.5 text-xs
                  text-sv-secondary dark:text-sv-dark-secondary
                  hover:text-sv-primary dark:hover:text-sv-dark-primary
                  transition-colors mb-1.5
                "
              >
                <BookUser className="w-3.5 h-3.5" />
                Pick from saved contacts
              </button>

              {/* Contacts dropdown */}
              {showContactPicker && (
                <div className="
                  mb-2 rounded-[var(--radius-button)] overflow-hidden
                  border border-sv-border dark:border-sv-dark-border
                  bg-sv-surface dark:bg-sv-dark-surface
                  shadow-sm
                ">
                  {/* Filter input */}
                  <div className="p-1.5 border-b border-sv-border dark:border-sv-dark-border">
                    <input
                      ref={filterRef}
                      type="text"
                      value={contactFilter}
                      onChange={(e) => setContactFilter(e.target.value)}
                      placeholder="Filter contacts…"
                      className="
                        w-full px-2 py-1 text-xs rounded
                        bg-sv-bg dark:bg-sv-dark-bg
                        text-sv-text dark:text-sv-dark-text
                        placeholder:text-sv-secondary dark:placeholder:text-sv-dark-secondary
                        border border-sv-border dark:border-sv-dark-border
                        focus:outline-none focus:ring-1 focus:ring-sv-primary/50
                      "
                    />
                  </div>

                  {/* Contact list */}
                  <ul className="max-h-36 overflow-y-auto">
                    {filteredContacts.length === 0 ? (
                      <li className="px-3 py-2 text-xs text-sv-secondary dark:text-sv-dark-secondary">
                        No contacts match.
                      </li>
                    ) : (
                      filteredContacts.map((c) => (
                        <li key={c.id}>
                          <button
                            type="button"
                            onClick={() => pickContact(c)}
                            className="
                              w-full text-left px-3 py-2 text-xs
                              hover:bg-sv-bg dark:hover:bg-sv-dark-bg
                              transition-colors
                            "
                          >
                            <span className="font-medium text-sv-text dark:text-sv-dark-text">
                              {c.name}
                            </span>
                            <span className="ml-1.5 text-sv-secondary dark:text-sv-dark-secondary">
                              {c.email}
                            </span>
                          </button>
                        </li>
                      ))
                    )}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Name input */}
          <input
            autoFocus={contacts.length === 0}
            type="text"
            value={nameInput}
            onChange={(e) => { setNameInput(e.target.value); setFormError(null) }}
            onKeyDown={(e) => { if (e.key === 'Enter') handleAdd() }}
            placeholder="Full name"
            className="
              w-full px-3 py-2 rounded-[var(--radius-button)]
              border border-sv-border dark:border-sv-dark-border
              bg-sv-surface dark:bg-sv-dark-surface
              text-sv-text dark:text-sv-dark-text
              text-xs placeholder:text-sv-secondary dark:placeholder:text-sv-dark-secondary
              focus:outline-none focus:ring-1 focus:ring-sv-primary dark:focus:ring-sv-dark-primary
            "
          />
          {/* Email input */}
          <input
            type="email"
            value={emailInput}
            onChange={(e) => { setEmailInput(e.target.value); setFormError(null) }}
            onKeyDown={(e) => { if (e.key === 'Enter') handleAdd() }}
            placeholder="email@example.com"
            className="
              w-full px-3 py-2 rounded-[var(--radius-button)]
              border border-sv-border dark:border-sv-dark-border
              bg-sv-surface dark:bg-sv-dark-surface
              text-sv-text dark:text-sv-dark-text
              text-xs placeholder:text-sv-secondary dark:placeholder:text-sv-dark-secondary
              focus:outline-none focus:ring-1 focus:ring-sv-primary dark:focus:ring-sv-dark-primary
            "
          />

          {/* Validation error */}
          {formError && (
            <p className="text-xs text-red-600 dark:text-red-400">{formError}</p>
          )}

          {/* Form action buttons */}
          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              className="
                flex-1 py-1.5 rounded-[var(--radius-button)]
                bg-sv-primary hover:bg-sv-primary-hover
                dark:bg-sv-dark-primary dark:hover:bg-sv-dark-primary-hover
                text-white text-xs font-medium
                transition-colors
              "
            >
              Add
            </button>
            <button
              onClick={handleCancel}
              className="
                flex-1 py-1.5 rounded-[var(--radius-button)]
                border border-sv-border dark:border-sv-dark-border
                text-sv-secondary dark:text-sv-dark-secondary
                text-xs hover:bg-sv-bg dark:hover:bg-sv-dark-bg
                transition-colors
              "
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        // Show the "Add Signer" button when the form is hidden
        <button
          onClick={() => setShowForm(true)}
          className="
            w-full flex items-center justify-center gap-2
            py-2 px-3 rounded-[var(--radius-button)]
            border border-dashed border-sv-border dark:border-sv-dark-border
            text-sv-secondary dark:text-sv-dark-secondary
            text-xs hover:border-sv-primary dark:hover:border-sv-dark-primary
            hover:text-sv-primary dark:hover:text-sv-dark-primary
            transition-colors
          "
        >
          <UserPlus className="w-3.5 h-3.5" />
          Add Signer
        </button>
      )}
    </div>
  )
}
