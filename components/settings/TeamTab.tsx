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
  display_name: string | null
  avatar_emoji: string | null
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

function getInitials(name: string, email: string): string {
  if (name) {
    const parts = name.trim().split(' ').filter(Boolean)
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    return parts[0][0].toUpperCase()
  }
  return email[0].toUpperCase()
}

function RoleBadge({ role }: { role: 'admin' | 'contributor' }) {
  return (
    <span
      style={
        role === 'admin'
          ? { display: 'inline-block', fontSize: '11px', fontWeight: 700, borderRadius: '999px', padding: '3px 10px', background: '#2D8FBF', color: '#ffffff', fontFamily: FONT }
          : { display: 'inline-block', fontSize: '11px', fontWeight: 700, borderRadius: '999px', padding: '3px 10px', background: '#5B7FA6', color: '#ffffff', fontFamily: FONT }
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

  const primaryName = member.display_name || member.full_name || member.email
  const initials = getInitials(member.display_name || member.full_name, member.email)

  return (
    <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
      {/* Avatar circle */}
      <div
        style={{
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          background: '#2D8FBF',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        {member.avatar_emoji
          ? <span style={{ fontSize: '20px', lineHeight: 1 }}>{member.avatar_emoji}</span>
          : <span style={{ fontSize: '14px', fontWeight: 700, color: '#ffffff', fontFamily: FONT, lineHeight: 1 }}>{initials}</span>
        }
      </div>

      {/* Name / email + role badge */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <p style={{ fontSize: '14px', fontWeight: 700, color: '#252850', fontFamily: FONT, margin: 0 }}>
            {primaryName}
          </p>
          <RoleBadge role={member.role} />
        </div>
        <p style={{ fontSize: '12px', color: '#5B7FA6', margin: '2px 0 0 0' }}>
          {member.email}
        </p>
      </div>

      {/* Area dropdown — only for contributors */}
      {member.role === 'contributor' ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          <select
            value={areaId}
            onChange={e => handleAreaChange(e.target.value)}
            disabled={saving}
            className="outline-none focus:ring-2 focus:ring-[#2D8FBF]/20 focus:border-[#2D8FBF] transition disabled:opacity-60"
            style={{
              borderRadius: '8px',
              border: '1px solid #d1dae6',
              padding: '8px 12px',
              fontSize: '13px',
              color: '#252850',
              fontFamily: FONT,
              minWidth: '160px',
              background: '#ffffff',
            }}
          >
            <option value="">No area assigned</option>
            {areas.map(a => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
          {saving && <span style={{ fontSize: '12px', color: '#5B7FA6' }}>Saving…</span>}
          {saveError && <span style={{ fontSize: '12px', color: '#ef4444' }}>{saveError}</span>}
        </div>
      ) : (
        <span style={{ fontSize: '12px', color: '#5B7FA6', fontFamily: FONT, flexShrink: 0 }}>
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

  const inputStyle: React.CSSProperties = {
    width: '100%',
    borderRadius: '8px',
    border: '1px solid #d1dae6',
    padding: '10px 14px',
    fontSize: '14px',
    color: '#252850',
    fontFamily: FONT,
    background: '#ffffff',
    boxSizing: 'border-box',
  }

  return (
    <div style={{ maxWidth: '672px' }}>

      {/* ── Invite form ─────────────────────────────────────────── */}
      <div style={{ marginBottom: '40px' }}>
        <h2 style={{ fontSize: '17px', fontWeight: 800, color: '#2D3272', fontFamily: FONT, margin: '0 0 4px 0' }}>
          Invite Team Member
        </h2>
        <p style={{ fontSize: '14px', color: '#5B7FA6', margin: '0 0 20px 0' }}>
          Send an invitation to give someone access to a specific area.
        </p>

        <form
          onSubmit={handleInvite}
          style={{
            background: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #e8edf2',
            boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label htmlFor="invite-email" style={{ fontSize: '13px', fontWeight: 600, color: '#2D3272', fontFamily: FONT }}>
              Email address
            </label>
            <input
              id="invite-email"
              type="email"
              value={email}
              onChange={e => { setEmail(e.target.value); setInviteError(null); setInviteSuccess(null) }}
              placeholder="owner@company.com"
              className="outline-none focus:ring-2 focus:ring-[#2D8FBF]/20 focus:border-[#2D8FBF] transition"
              style={inputStyle}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }} className="grid-cols-1 sm:grid-cols-2">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label htmlFor="invite-area" style={{ fontSize: '13px', fontWeight: 600, color: '#2D3272', fontFamily: FONT }}>
                Area
              </label>
              {areas.length === 0 ? (
                <p style={{ fontSize: '13px', color: '#5B7FA6', margin: 0 }}>
                  Add areas on the dashboard first.
                </p>
              ) : (
                <select
                  id="invite-area"
                  value={areaId}
                  onChange={e => { setAreaId(e.target.value); setInviteError(null) }}
                  className="outline-none focus:ring-2 focus:ring-[#2D8FBF]/20 focus:border-[#2D8FBF] transition"
                  style={{ ...inputStyle, color: areaId ? '#252850' : '#9aabb8' }}
                >
                  <option value="" disabled>Select an area…</option>
                  {areas.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label htmlFor="invite-role" style={{ fontSize: '13px', fontWeight: 600, color: '#2D3272', fontFamily: FONT }}>
                Role
              </label>
              <select
                id="invite-role"
                value={inviteRole}
                onChange={e => setInviteRole(e.target.value as 'contributor' | 'admin')}
                className="outline-none focus:ring-2 focus:ring-[#2D8FBF]/20 focus:border-[#2D8FBF] transition"
                style={inputStyle}
              >
                <option value="contributor">Contributor</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>

          {inviteError && (
            <p style={{ fontSize: '13px', borderRadius: '8px', background: '#fef2f2', border: '1px solid #fca5a5', color: '#dc2626', padding: '12px 16px', margin: 0 }}>
              {inviteError}
            </p>
          )}
          {inviteSuccess && (
            <p style={{ fontSize: '13px', fontWeight: 600, borderRadius: '8px', background: '#E8F8F1', border: '1px solid #2DA870', color: '#1a7a50', padding: '12px 16px', margin: 0 }}>
              {inviteSuccess}
            </p>
          )}

          <div>
            <button
              type="submit"
              disabled={inviteLoading || areas.length === 0}
              style={{
                padding: '10px 20px',
                borderRadius: '10px',
                fontSize: '14px',
                fontWeight: 700,
                color: '#ffffff',
                background: '#2D8FBF',
                border: 'none',
                cursor: 'pointer',
                fontFamily: FONT,
                opacity: (inviteLoading || areas.length === 0) ? 0.6 : 1,
              }}
            >
              {inviteLoading ? 'Sending…' : 'Send Invitation'}
            </button>
          </div>
        </form>
      </div>

      {/* ── Team members list ────────────────────────────────────── */}
      <div style={{ marginBottom: '40px' }}>
        <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#2D3272', fontFamily: FONT, margin: '0 0 16px 0' }}>
          Team Members
        </h2>

        {teamMembers.length === 0 ? (
          <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e8edf2', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', padding: '32px', textAlign: 'center' }}>
            <p style={{ fontSize: '14px', fontWeight: 600, color: '#2D3272', fontFamily: FONT, marginBottom: '4px' }}>
              No team members yet
            </p>
            <p style={{ fontSize: '13px', color: '#5B7FA6', margin: 0 }}>
              Use the invite form above to give area owners access.
            </p>
          </div>
        ) : (
          <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e8edf2', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
            {teamMembers.map((member, idx) => (
              <div key={member.id} style={idx > 0 ? { borderTop: '1px solid #f0f2f5' } : {}}>
                <MemberRow member={member} areas={areas} orgId={orgId} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Pending invitations ──────────────────────────────────── */}
      {pending.length > 0 && (
        <div>
          <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#2D3272', fontFamily: FONT, margin: '0 0 16px 0' }}>
            Pending Invitations
          </h2>
          <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e8edf2', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
            {pending.map((inv, idx) => (
              <div
                key={inv.id}
                style={{
                  padding: '16px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '16px',
                  borderTop: idx > 0 ? '1px solid #f0f2f5' : 'none',
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontSize: '13px', fontWeight: 600, color: '#252850', fontFamily: FONT, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {inv.email}
                  </p>
                  <p style={{ fontSize: '12px', color: '#5B7FA6', margin: '3px 0 0 0' }}>
                    Invited {formatDate(inv.created_at)} · {inv.area_name}
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      borderRadius: '999px',
                      padding: '3px 10px',
                      background: '#F5D800',
                      color: '#252850',
                      fontFamily: FONT,
                    }}
                  >
                    Pending
                  </span>
                  <button
                    onClick={() => handleCancelInvite(inv.id)}
                    disabled={cancellingId === inv.id}
                    style={{
                      fontSize: '12px',
                      fontWeight: 600,
                      color: '#5B7FA6',
                      background: 'none',
                      border: '1px solid #d1dae6',
                      borderRadius: '6px',
                      padding: '4px 10px',
                      cursor: 'pointer',
                      fontFamily: FONT,
                      opacity: cancellingId === inv.id ? 0.4 : 1,
                    }}
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
