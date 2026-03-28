'use client'

/**
 * TeamClient.tsx — Team management UI
 *
 * Rendered on /team. Four states:
 *   1. Non-business user → upgrade prompt
 *   2. Business user, no team → "Create Your Team" form
 *   3. Team owner → full management view (invite, remove members, disband)
 *   4. Team member → read-only view with "Leave Team" option
 */

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users,
  Plus,
  Send,
  Trash2,
  LogOut,
  Crown,
  AlertCircle,
  Loader2,
  ArrowRight,
  Lock,
  MailOpen,
  X,
  CheckCircle,
  UserMinus,
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from '@/lib/toast'

// ── Types ──────────────────────────────────────────────────────────────────────

interface TeamMemberItem {
  id: string
  role: string
  joinedAt: string
  user: { id: string; name: string | null; email: string | null; image: string | null }
}

interface TeamInvitationItem {
  id: string
  email: string
  token: string
  expiresAt: string
  createdAt: string
}

interface TeamData {
  id: string
  name: string
  ownerId: string
  createdAt: string
  members: TeamMemberItem[]
  invitations: TeamInvitationItem[]
}

interface TeamClientProps {
  isBusinessPlan: boolean
  currentUserId: string
  initialTeam: TeamData | null
  myRole: string | null
}

// ── Helpers ────────────────────────────────────────────────────────────────────

/** Initials avatar from name or email */
function Avatar({ name, email, image }: { name: string | null; email: string | null; image: string | null }) {
  if (image) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={image} alt={name ?? email ?? 'User'} className="w-9 h-9 rounded-full object-cover" />
    )
  }
  const initials = (name ?? email ?? '?').slice(0, 2).toUpperCase()
  return (
    <div className="w-9 h-9 rounded-full bg-sv-primary/15 dark:bg-sv-dark-primary/25
                    flex items-center justify-center flex-shrink-0">
      <span className="text-xs font-bold text-sv-primary dark:text-sv-dark-primary">{initials}</span>
    </div>
  )
}

// ── Upgrade prompt ─────────────────────────────────────────────────────────────

function UpgradePrompt() {
  return (
    <div className="text-center py-16 px-6">
      <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/30
                      flex items-center justify-center mx-auto mb-5">
        <Lock className="w-8 h-8 text-amber-600 dark:text-amber-400" />
      </div>
      <h2 className="text-xl font-bold text-sv-text dark:text-sv-dark-text mb-2">
        Team Accounts are a Business feature
      </h2>
      <p className="text-sm text-sv-secondary dark:text-sv-dark-secondary mb-8 max-w-sm mx-auto leading-relaxed">
        Collaborate with your team on SignVault. Invite colleagues, share a workspace,
        and manage documents together. Upgrade to Business to create a team.
      </p>
      <Link
        href="/pricing"
        className="inline-flex items-center gap-2 px-6 py-3 rounded-[var(--radius-button)]
                   bg-sv-primary dark:bg-sv-dark-primary text-white text-sm font-semibold
                   hover:opacity-90 transition-opacity"
      >
        <ArrowRight className="w-4 h-4" />
        View Pricing Plans
      </Link>
    </div>
  )
}

// ── Create team form ───────────────────────────────────────────────────────────

function CreateTeamForm({ onCreated }: { onCreated: (team: TeamData) => void }) {
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleCreate() {
    if (!name.trim()) return
    setError(null)
    setLoading(true)
    try {
      const res = await fetch('/api/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() }),
      })
      const data = await res.json() as { team?: TeamData; error?: string }
      if (!res.ok) { setError(data.error ?? 'Could not create team.'); return }
      toast.success('Team created!')
      onCreated({ ...data.team!, members: data.team!.members ?? [], invitations: [] })
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="text-center py-10 px-4">
      <div className="w-16 h-16 rounded-full bg-sv-primary/10 dark:bg-sv-dark-primary/20
                      flex items-center justify-center mx-auto mb-5">
        <Users className="w-8 h-8 text-sv-primary dark:text-sv-dark-primary" />
      </div>
      <h2 className="text-xl font-bold text-sv-text dark:text-sv-dark-text mb-1">
        Create Your Team
      </h2>
      <p className="text-sm text-sv-secondary dark:text-sv-dark-secondary mb-8 max-w-sm mx-auto leading-relaxed">
        Give your team a name, then invite colleagues by email.
        Each member gets their own SignVault account.
      </p>
      <div className="max-w-sm mx-auto space-y-3">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleCreate() }}
          placeholder="e.g. Acme Legal, Design Team…"
          className="w-full px-4 py-3 text-sm rounded-[var(--radius-input)]
                     bg-sv-bg dark:bg-sv-dark-bg border border-sv-border dark:border-sv-dark-border
                     text-sv-text dark:text-sv-dark-text
                     placeholder:text-sv-secondary dark:placeholder:text-sv-dark-secondary
                     focus:outline-none focus:ring-2 focus:ring-sv-primary dark:focus:ring-sv-dark-primary"
        />
        {error && (
          <p className="text-xs text-red-500 flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />{error}
          </p>
        )}
        <button
          onClick={handleCreate}
          disabled={!name.trim() || loading}
          className="w-full py-3 rounded-[var(--radius-button)]
                     bg-sv-primary dark:bg-sv-dark-primary text-white text-sm font-semibold
                     flex items-center justify-center gap-2
                     hover:opacity-90 transition-opacity
                     disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          {loading ? 'Creating…' : 'Create Team'}
        </button>
      </div>
    </div>
  )
}

// ── Team management view ───────────────────────────────────────────────────────

function TeamManagementView({
  team: initialTeam,
  myRole,
  currentUserId,
  onLeft,
}: {
  team: TeamData
  myRole: string
  currentUserId: string
  onLeft: () => void
}) {
  const router = useRouter()
  const [team, setTeam] = useState<TeamData>(initialTeam)

  // Invite form state
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviting, setInviting] = useState(false)
  const [inviteError, setInviteError] = useState<string | null>(null)

  // Confirm dialogs
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null)   // memberId
  const [confirmCancelInvite, setConfirmCancelInvite] = useState<string | null>(null) // token
  const [confirmDisband, setConfirmDisband] = useState(false)
  const [confirmLeave, setConfirmLeave] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  const isOwner = myRole === 'owner'

  // ── Invite a member ──────────────────────────────────────────────────────
  async function handleInvite() {
    if (!inviteEmail.trim()) return
    setInviteError(null)
    setInviting(true)
    try {
      const res = await fetch('/api/team/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail.trim() }),
      })
      const data = await res.json() as { success?: boolean; error?: string }
      if (!res.ok) { setInviteError(data.error ?? 'Could not send invite.'); return }
      toast.success(`Invitation sent to ${inviteEmail.trim()}`)
      setInviteEmail('')
      // Add optimistic invitation entry
      setTeam((prev) => ({
        ...prev,
        invitations: [
          {
            id: Date.now().toString(),
            email: inviteEmail.trim().toLowerCase(),
            token: '',
            expiresAt: new Date(Date.now() + 7 * 86400000).toISOString(),
            createdAt: new Date().toISOString(),
          },
          ...prev.invitations,
        ],
      }))
    } catch {
      setInviteError('Network error. Please try again.')
    } finally {
      setInviting(false)
    }
  }

  // ── Remove a member ──────────────────────────────────────────────────────
  async function handleRemoveMember(memberId: string) {
    setActionLoading(true)
    try {
      const res = await fetch(`/api/team/members/${memberId}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json() as { error?: string }
        toast.error(data.error ?? 'Could not remove member.')
        return
      }
      setTeam((prev) => ({
        ...prev,
        members: prev.members.filter((m) => m.id !== memberId),
      }))
      toast.success('Member removed.')
    } catch {
      toast.error('Network error.')
    } finally {
      setActionLoading(false)
      setConfirmRemove(null)
    }
  }

  // ── Leave the team ───────────────────────────────────────────────────────
  async function handleLeave() {
    const me = team.members.find((m) => m.user.id === currentUserId)
    if (!me) return
    setActionLoading(true)
    try {
      const res = await fetch(`/api/team/members/${me.id}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json() as { error?: string }
        toast.error(data.error ?? 'Could not leave team.')
        return
      }
      toast.success('You have left the team.')
      onLeft()
    } catch {
      toast.error('Network error.')
    } finally {
      setActionLoading(false)
      setConfirmLeave(false)
    }
  }

  // ── Cancel an invitation ─────────────────────────────────────────────────
  async function handleCancelInvite(token: string) {
    if (!token) return  // optimistic entry without a real token
    setActionLoading(true)
    try {
      const res = await fetch(`/api/team/invite/${token}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json() as { error?: string }
        toast.error(data.error ?? 'Could not cancel invitation.')
        return
      }
      setTeam((prev) => ({
        ...prev,
        invitations: prev.invitations.filter((i) => i.token !== token),
      }))
      toast.success('Invitation cancelled.')
    } catch {
      toast.error('Network error.')
    } finally {
      setActionLoading(false)
      setConfirmCancelInvite(null)
    }
  }

  // ── Disband team ─────────────────────────────────────────────────────────
  async function handleDisband() {
    setActionLoading(true)
    try {
      const res = await fetch('/api/team', { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json() as { error?: string }
        toast.error(data.error ?? 'Could not disband team.')
        return
      }
      toast.success('Team disbanded.')
      router.refresh()
      onLeft()
    } catch {
      toast.error('Network error.')
    } finally {
      setActionLoading(false)
      setConfirmDisband(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* ── Team header ──────────────────────────────────────────────── */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-[10px] bg-sv-primary/10 dark:bg-sv-dark-primary/20
                            flex items-center justify-center">
              <Users className="w-5 h-5 text-sv-primary dark:text-sv-dark-primary" />
            </div>
            <h2 className="text-xl font-bold text-sv-text dark:text-sv-dark-text">{team.name}</h2>
          </div>
          <p className="text-xs text-sv-secondary dark:text-sv-dark-secondary ml-13">
            {team.members.length} member{team.members.length !== 1 ? 's' : ''}
            {isOwner && ` · ${team.invitations.length} pending invite${team.invitations.length !== 1 ? 's' : ''}`}
          </p>
        </div>

        {/* Leave / Disband */}
        {isOwner ? (
          <button
            onClick={() => setConfirmDisband(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-[var(--radius-button)]
                       border border-red-200 dark:border-red-800
                       text-red-600 dark:text-red-400
                       hover:bg-red-50 dark:hover:bg-red-900/20
                       transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Disband Team
          </button>
        ) : (
          <button
            onClick={() => setConfirmLeave(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-[var(--radius-button)]
                       border border-sv-border dark:border-sv-dark-border
                       text-sv-secondary dark:text-sv-dark-secondary
                       hover:border-red-300 dark:hover:border-red-700
                       hover:text-red-600 dark:hover:text-red-400
                       transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            Leave Team
          </button>
        )}
      </div>

      {/* ── Invite form (owner only) ──────────────────────────────────── */}
      {isOwner && (
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider
                         text-sv-secondary dark:text-sv-dark-secondary mb-3">
            Invite a Member
          </h3>
          <div className="flex gap-2">
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => { setInviteEmail(e.target.value); setInviteError(null) }}
              onKeyDown={(e) => { if (e.key === 'Enter') handleInvite() }}
              placeholder="colleague@example.com"
              className="flex-1 px-3 py-2.5 text-sm rounded-[var(--radius-input)]
                         bg-sv-bg dark:bg-sv-dark-bg border border-sv-border dark:border-sv-dark-border
                         text-sv-text dark:text-sv-dark-text
                         placeholder:text-sv-secondary dark:placeholder:text-sv-dark-secondary
                         focus:outline-none focus:ring-2 focus:ring-sv-primary dark:focus:ring-sv-dark-primary"
            />
            <button
              onClick={handleInvite}
              disabled={inviting || !inviteEmail.includes('@')}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-[var(--radius-button)]
                         bg-sv-primary dark:bg-sv-dark-primary text-white text-sm font-medium
                         hover:opacity-90 transition-opacity
                         disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {inviting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {inviting ? 'Sending…' : 'Invite'}
            </button>
          </div>
          {inviteError && (
            <p className="mt-2 text-xs text-red-500 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />{inviteError}
            </p>
          )}
        </div>
      )}

      {/* ── Members list ─────────────────────────────────────────────── */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider
                       text-sv-secondary dark:text-sv-dark-secondary mb-3">
          Members ({team.members.length})
        </h3>
        <div className="space-y-2">
          {team.members.map((member) => {
            const isSelf = member.user.id === currentUserId
            const isOwnerMember = member.role === 'owner'
            return (
              <div
                key={member.id}
                className="flex items-center gap-3 p-3 rounded-[var(--radius-card)]
                           bg-sv-surface dark:bg-sv-dark-surface
                           border border-sv-border dark:border-sv-dark-border"
              >
                <Avatar name={member.user.name} email={member.user.email} image={member.user.image} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-sv-text dark:text-sv-dark-text truncate">
                      {member.user.name ?? member.user.email ?? 'Unknown'}
                      {isSelf && <span className="text-sv-secondary dark:text-sv-dark-secondary font-normal"> (you)</span>}
                    </p>
                    {isOwnerMember && (
                      <span className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400
                                       bg-amber-50 dark:bg-amber-900/30 px-1.5 py-0.5 rounded-full flex-shrink-0">
                        <Crown className="w-3 h-3" /> Owner
                      </span>
                    )}
                  </div>
                  {member.user.name && (
                    <p className="text-xs text-sv-secondary dark:text-sv-dark-secondary truncate">
                      {member.user.email}
                    </p>
                  )}
                </div>
                {/* Remove button (owner can remove non-owner members; members can only remove themselves) */}
                {!isOwnerMember && (isOwner || isSelf) && (
                  <button
                    onClick={() => setConfirmRemove(member.id)}
                    className="w-8 h-8 flex-shrink-0 rounded-[6px] flex items-center justify-center
                               text-sv-secondary dark:text-sv-dark-secondary
                               hover:bg-red-50 dark:hover:bg-red-900/20
                               hover:text-red-500 dark:hover:text-red-400
                               transition-colors"
                    aria-label={isSelf ? 'Leave team' : 'Remove member'}
                    title={isSelf ? 'Leave team' : 'Remove member'}
                  >
                    <UserMinus className="w-4 h-4" />
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Pending invitations (owner only) ─────────────────────────── */}
      {isOwner && team.invitations.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider
                         text-sv-secondary dark:text-sv-dark-secondary mb-3">
            Pending Invitations ({team.invitations.length})
          </h3>
          <div className="space-y-2">
            {team.invitations.map((invite) => (
              <div
                key={invite.id}
                className="flex items-center gap-3 p-3 rounded-[var(--radius-card)]
                           bg-sv-bg dark:bg-sv-dark-bg
                           border border-sv-border dark:border-sv-dark-border border-dashed"
              >
                <div className="w-9 h-9 rounded-full bg-sv-border dark:bg-sv-dark-border
                                flex items-center justify-center flex-shrink-0">
                  <MailOpen className="w-4 h-4 text-sv-secondary dark:text-sv-dark-secondary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-sv-text dark:text-sv-dark-text truncate">
                    {invite.email}
                  </p>
                  <p className="text-xs text-sv-secondary dark:text-sv-dark-secondary">
                    Expires {new Date(invite.expiresAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </p>
                </div>
                {invite.token && (
                  <button
                    onClick={() => setConfirmCancelInvite(invite.token)}
                    className="w-8 h-8 flex-shrink-0 rounded-[6px] flex items-center justify-center
                               text-sv-secondary dark:text-sv-dark-secondary
                               hover:bg-red-50 dark:hover:bg-red-900/20
                               hover:text-red-500 dark:hover:text-red-400
                               transition-colors"
                    aria-label="Cancel invitation"
                    title="Cancel invitation"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Confirm dialogs ───────────────────────────────────────────── */}
      <AnimatePresence>
        {(confirmRemove || confirmDisband || confirmLeave || confirmCancelInvite) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-4"
            onClick={() => {
              setConfirmRemove(null)
              setConfirmDisband(false)
              setConfirmLeave(false)
              setConfirmCancelInvite(null)
            }}
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="w-full max-w-sm bg-sv-surface dark:bg-sv-dark-surface
                         border border-sv-border dark:border-sv-dark-border
                         rounded-[var(--radius-card)] shadow-xl p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-base font-bold text-sv-text dark:text-sv-dark-text mb-2">
                {confirmDisband ? 'Disband Team?' :
                 confirmLeave   ? 'Leave Team?' :
                 confirmCancelInvite ? 'Cancel Invitation?' :
                 'Remove Member?'}
              </h3>
              <p className="text-sm text-sv-secondary dark:text-sv-dark-secondary mb-5 leading-relaxed">
                {confirmDisband
                  ? 'This will permanently delete the team and remove all members. This cannot be undone.'
                  : confirmLeave
                  ? 'You will lose access to this team workspace. You can be re-invited later.'
                  : confirmCancelInvite
                  ? 'The recipient\'s invitation link will stop working.'
                  : 'This member will be removed from the team immediately.'}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setConfirmRemove(null)
                    setConfirmDisband(false)
                    setConfirmLeave(false)
                    setConfirmCancelInvite(null)
                  }}
                  className="flex-1 py-2.5 rounded-[var(--radius-button)] text-sm font-medium
                             border border-sv-border dark:border-sv-dark-border
                             text-sv-secondary dark:text-sv-dark-secondary
                             hover:bg-sv-bg dark:hover:bg-sv-dark-bg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (confirmRemove) handleRemoveMember(confirmRemove)
                    else if (confirmDisband) handleDisband()
                    else if (confirmLeave) handleLeave()
                    else if (confirmCancelInvite) handleCancelInvite(confirmCancelInvite)
                  }}
                  disabled={actionLoading}
                  className="flex-1 py-2.5 rounded-[var(--radius-button)] text-sm font-semibold
                             bg-red-500 hover:bg-red-600 text-white transition-colors
                             flex items-center justify-center gap-2
                             disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {actionLoading
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <CheckCircle className="w-4 h-4" />}
                  {confirmDisband ? 'Disband' : confirmLeave ? 'Leave' : 'Confirm'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────

export function TeamClient({ isBusinessPlan, currentUserId, initialTeam, myRole }: TeamClientProps) {
  const [team, setTeam] = useState<TeamData | null>(initialTeam)
  const [role, setRole] = useState<string | null>(myRole)

  if (!isBusinessPlan) {
    return (
      <div>
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-sv-text dark:text-sv-dark-text">My Team</h1>
          <p className="text-sm text-sv-secondary dark:text-sv-dark-secondary mt-1">
            Collaborate with colleagues on SignVault.
          </p>
        </div>
        <UpgradePrompt />
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-sv-text dark:text-sv-dark-text">My Team</h1>
        <p className="text-sm text-sv-secondary dark:text-sv-dark-secondary mt-1">
          Invite colleagues, share a workspace, and collaborate on documents.
        </p>
      </div>

      {!team ? (
        <CreateTeamForm
          onCreated={(newTeam) => {
            setTeam(newTeam)
            setRole('owner')
          }}
        />
      ) : (
        <TeamManagementView
          team={team}
          myRole={role ?? 'member'}
          currentUserId={currentUserId}
          onLeft={() => { setTeam(null); setRole(null) }}
        />
      )}
    </div>
  )
}
