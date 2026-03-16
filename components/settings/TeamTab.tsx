'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Area = { id: string; name: string }

type TeamMember = {
  id: string
  full_name: string
  email: string
  role: 'admin' | 'contributor'
  assigned_area_id: string | null
}

type PendingInvite = {
  id: string
  email: string
  area_id: string
  area_name: string
  created_at: string
}

interface Props {
  orgId: string
  areas: Area[]
  teamMembers: TeamMember[]
  pendingInvitations: PendingInvite[]
}

const FONT = "'Plus Jakarta Sans', sans-serif"

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function RoleBadge({ role }: { role: 'admin' | 'contributor' }) {
  return (
    <span
      className="inline-block text-xs font-semibold rounded-full px-2.5 py-0.5"
      style={
        role === 'admin'
          ? { background: '#EBF0F8', color: '#2D3272', fontFamily: FONT }
          : { background: '#EBF5FB', color: '#2D8FBF', fontFamily: FONT }
      }
    >
      {role === 'admin' ? 'Admin' : 'Contributor'}
    </span>
  )
}

function MemberRow({
  member,
  areas,
  orgId,
}: {
  member: TeamMember
  areas: Area[]
  orgId: string
}) {
  const [areaId, setAreaId] = useState(member.assigned_area_id ?? '')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  async function handleAreaChange(newAreaId: string) {
    setAreaId(newAreaId)
    setSaveError(null)
    setSaving(true)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('profiles')
        .update({ assigned_area_id: newAreaId || null })
        .eq('id', member.id)
        .eq('org_id', orgId)

      if (error) {
        setSaveError('Failed to save')
        setAreaId(member.assigned_area_id ?? '')
      }
    } catch {
      setSaveError('Failed to save')
      setAreaId(member.assigned_area_id ?? '')
    } finally {
      setSaving(false)
    }
  }

  const displayName = member.full_name || member.email

  return (
    <div className="px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3">
      {/* Name / email + role badge */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p
            className="text-sm font-semibold truncate"
            style={{ color: '#252850', fontFamily: FONT }}
          >
            {displayName}
          </p>
          <RoleBadge role={member.role} />
        </div>
        {member.full_name && (
          <p className="text-xs mt-0.5 truncate" style={{ color: '#5B7FA6' }}>
            {member.email}
          </p>
        )}
      </div>

      {/* Area dropdown — only for contributors */}
      {member.role === 'contributor' ? (
        <div className="flex items-center gap-2 sm:flex-shrink-0">
          <select
            value={areaId}
            onChange={e => handleAreaChange(e.target.value)}
            disabled={saving}
            className="rounded-lg border border-[#d1dae6] px-3 py-2 text-sm outline-none transition focus:border-[#2D8FBF] focus:ring-2 focus:ring-[#2D8FBF]/20 bg-white disabled:opacity-60"
            style={{ color: '#252850', fontFamily: FONT, minWidth: '160px' }}
          >
            <option value="">No area assigned</option>
            {areas.map(a => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
          {saving && (
            <span className="text-xs" style={{ color: '#5B7FA6' }}>Saving…</span>
          )}
          {saveError && (
            <span className="text-xs text-red-500">{saveError}</span>
          )}
        </div>
      ) : (
        <span className="text-xs sm:flex-shrink-0" style={{ color: '#5B7FA6', fontFamily: FONT }}>
          All areas
        </span>
      )}
    </div>
  )
}

export default function TeamTab({ orgId, areas, teamMembers, pendingInvitations }: Props) {
  const [email, setEmail] = useState('')
  const [areaId, setAreaId] = useState('')
  const [inviteRole, setInviteRole] = useState<'contributor' | 'admin'>('contributor')
  const [inviteLoading, setInviteLoading] = useState(false)
  const [inviteError, setInviteError] = useState<string | null>(null)
  const [inviteSuccess, setInviteSuccess] = useState<string | null>(null)
  const [pending, setPending] = useState<PendingInvite[]>(pendingInvitations)
  const [cancellingId, setCancellingId] = useState<string | null>(null)

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    setInviteError(null)
    setInviteSuccess(null)
    if (!email.trim()) { setInviteError('Email address is required.'); return }
    if (!areaId) { setInviteError('Please select an area.'); return }

    setInviteLoading(true)
    try {
      const res = await fetch('/api/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), areaId, orgId, role: inviteRole }),
      })
      const data = await res.json()

      if (!res.ok) {
        setInviteError(data.error ?? 'Failed to send invitation. Please try again.')
        return
      }

      setInviteSuccess(`Invitation sent to ${email.trim()}.`)
      setEmail('')
      setAreaId('')
      setInviteRole('contributor')

      if (data.invitation) {
        const areaName = areas.find(a => a.id === areaId)?.name ?? 'Unknown'
        setPending(prev => [{
          id: data.invitation.id,
          email: data.invitation.email,
          area_id: areaId,
          area_name: areaName,
          created_at: data.invitation.created_at,
        }, ...prev])
      }
    } catch {
      setInviteError('Something went wrong. Please try again.')
    } finally {
      setInviteLoading(false)
    }
  }

  async function handleCancelInvite(inviteId: string) {
    setCancellingId(inviteId)
    try {
      const res = await fetch('/api/invite', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inviteId, orgId }),
      })
      if (res.ok) {
        setPending(prev => prev.filter(i => i.id !== inviteId))
      }
    } finally {
      setCancellingId(null)
    }
  }

  const selectClass = "w-full rounded-lg border border-[#d1dae6] px-4 py-2.5 text-sm outline-none transition focus:border-[#2D8FBF] focus:ring-2 focus:ring-[#2D8FBF]/20 bg-white"

  return (
    <div className="max-w-2xl">

      {/* ── Invite form ─────────────────────────────────────────── */}
      <div className="mb-10">
        <h2
          className="text-lg font-extrabold mb-1"
          style={{ color: '#2D3272', fontFamily: FONT }}
        >
          Invite Team Member
        </h2>
        <p className="text-sm mb-5" style={{ color: '#5B7FA6' }}>
          Send an invitation to give someone access to a specific area.
        </p>

        <form onSubmit={handleInvite} className="bg-white rounded-xl border border-[#e8edf2] shadow-sm p-6 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="invite-email" className="text-sm font-semibold" style={{ color: '#2D3272', fontFamily: FONT }}>
              Email address
            </label>
            <input
              id="invite-email"
              type="email"
              value={email}
              onChange={e => { setEmail(e.target.value); setInviteError(null); setInviteSuccess(null) }}
              placeholder="owner@company.com"
              className="w-full rounded-lg border border-[#d1dae6] px-4 py-2.5 text-sm outline-none transition focus:border-[#2D8FBF] focus:ring-2 focus:ring-[#2D8FBF]/20"
              style={{ color: '#252850', fontFamily: "'Inter', sans-serif" }}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="invite-area" className="text-sm font-semibold" style={{ color: '#2D3272', fontFamily: FONT }}>
                Area
              </label>
              {areas.length === 0 ? (
                <p className="text-sm" style={{ color: '#5B7FA6' }}>
                  Add areas on the dashboard first.
                </p>
              ) : (
                <select
                  id="invite-area"
                  value={areaId}
                  onChange={e => { setAreaId(e.target.value); setInviteError(null) }}
                  className={selectClass}
                  style={{ color: areaId ? '#252850' : '#9aabb8', fontFamily: "'Inter', sans-serif" }}
                >
                  <option value="" disabled>Select an area…</option>
                  {areas.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="invite-role" className="text-sm font-semibold" style={{ color: '#2D3272', fontFamily: FONT }}>
                Role
              </label>
              <select
                id="invite-role"
                value={inviteRole}
                onChange={e => setInviteRole(e.target.value as 'contributor' | 'admin')}
                className={selectClass}
                style={{ color: '#252850', fontFamily: "'Inter', sans-serif" }}
              >
                <option value="contributor">Contributor</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>

          {inviteError && (
            <p className="text-sm rounded-lg bg-red-50 border border-red-200 text-red-600 px-4 py-3">
              {inviteError}
            </p>
          )}
          {inviteSuccess && (
            <p className="text-sm rounded-lg px-4 py-3 font-semibold" style={{ background: '#E8F8F1', border: '1px solid #2DA870', color: '#1a7a50' }}>
              {inviteSuccess}
            </p>
          )}

          <button
            type="submit"
            disabled={inviteLoading || areas.length === 0}
            className="self-start px-5 py-2.5 rounded-lg text-sm font-semibold text-white disabled:opacity-60"
            style={{ background: '#2D8FBF', fontFamily: FONT }}
          >
            {inviteLoading ? 'Sending…' : 'Send Invitation'}
          </button>
        </form>
      </div>

      {/* ── Team members list ────────────────────────────────────── */}
      <div className="mb-10">
        <h2
          className="text-base font-bold mb-4"
          style={{ color: '#2D3272', fontFamily: FONT }}
        >
          Team Members
        </h2>

        {teamMembers.length === 0 ? (
          <div className="bg-white rounded-xl border border-[#e8edf2] shadow-sm p-8 text-center">
            <p className="text-sm font-semibold mb-1" style={{ color: '#2D3272', fontFamily: FONT }}>
              No team members yet
            </p>
            <p className="text-sm" style={{ color: '#5B7FA6' }}>
              Use the invite form above to give area owners access.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-[#e8edf2] shadow-sm divide-y divide-[#f0f2f5]">
            {teamMembers.map(member => (
              <MemberRow key={member.id} member={member} areas={areas} orgId={orgId} />
            ))}
          </div>
        )}
      </div>

      {/* ── Pending invitations ──────────────────────────────────── */}
      {pending.length > 0 && (
        <div>
          <h2
            className="text-base font-bold mb-4"
            style={{ color: '#2D3272', fontFamily: FONT }}
          >
            Pending Invitations
          </h2>
          <div className="bg-white rounded-xl border border-[#e8edf2] shadow-sm divide-y divide-[#f0f2f5]">
            {pending.map(inv => (
              <div key={inv.id} className="px-5 py-4 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: '#252850', fontFamily: FONT }}>
                    {inv.email}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: '#5B7FA6' }}>
                    Invited {formatDate(inv.created_at)} · {inv.area_name}
                  </p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span
                    className="text-xs font-semibold rounded-full px-2.5 py-1"
                    style={{ background: '#FFF8E6', color: '#B8860B', fontFamily: FONT }}
                  >
                    Pending
                  </span>
                  <button
                    onClick={() => handleCancelInvite(inv.id)}
                    disabled={cancellingId === inv.id}
                    className="text-xs font-semibold transition disabled:opacity-40"
                    style={{ color: '#E53935', fontFamily: FONT }}
                  >
                    {cancellingId === inv.id ? 'Cancelling…' : 'Cancel'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
