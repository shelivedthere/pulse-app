'use client'

import { useState } from 'react'

type Area = { id: string; name: string }
type TeamMember = { id: string; full_name: string; email: string; areas: string[] }
type PendingInvite = { id: string; email: string; area_name: string; created_at: string }

interface Props {
  orgId: string
  areas: Area[]
  teamMembers: TeamMember[]
  pendingInvitations: PendingInvite[]
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function TeamTab({ orgId, areas, teamMembers, pendingInvitations }: Props) {
  const [email, setEmail] = useState('')
  const [areaId, setAreaId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [pending, setPending] = useState<PendingInvite[]>(pendingInvitations)

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (!email.trim()) { setError('Email address is required.'); return }
    if (!areaId) { setError('Please select an area.'); return }

    setLoading(true)
    try {
      const res = await fetch('/api/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), areaId, orgId }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Failed to send invitation. Please try again.')
        return
      }

      setSuccess(`Invitation sent to ${email.trim()}.`)
      setEmail('')
      setAreaId('')

      if (data.invitation) {
        const areaName = areas.find(a => a.id === areaId)?.name ?? 'Unknown'
        setPending(prev => [{
          id: data.invitation.id,
          email: data.invitation.email,
          area_name: areaName,
          created_at: data.invitation.created_at,
        }, ...prev])
      }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl">
      {/* Invite form */}
      <div className="mb-8">
        <h2
          className="text-lg font-extrabold mb-1"
          style={{ color: '#2D3272', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
        >
          Invite Team Member
        </h2>
        <p className="text-sm mb-5" style={{ color: '#5B7FA6' }}>
          Invite an area owner to conduct audits and manage action items for their area.
        </p>

        <form onSubmit={handleInvite} className="bg-white rounded-xl border border-[#e8edf2] shadow-sm p-6 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="invite-email"
              className="text-sm font-semibold"
              style={{ color: '#2D3272', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              Email address
            </label>
            <input
              id="invite-email"
              type="email"
              value={email}
              onChange={e => { setEmail(e.target.value); setError(null); setSuccess(null) }}
              placeholder="owner@company.com"
              className="w-full rounded-lg border border-[#d1dae6] px-4 py-2.5 text-sm outline-none transition focus:border-[#2D8FBF] focus:ring-2 focus:ring-[#2D8FBF]/20"
              style={{ color: '#252850', fontFamily: "'Inter', sans-serif" }}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="invite-area"
              className="text-sm font-semibold"
              style={{ color: '#2D3272', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              Area assignment
            </label>
            {areas.length === 0 ? (
              <p className="text-sm" style={{ color: '#5B7FA6' }}>
                No areas yet. Add areas on the dashboard before inviting contributors.
              </p>
            ) : (
              <select
                id="invite-area"
                value={areaId}
                onChange={e => { setAreaId(e.target.value); setError(null) }}
                className="w-full rounded-lg border border-[#d1dae6] px-4 py-2.5 text-sm outline-none transition focus:border-[#2D8FBF] focus:ring-2 focus:ring-[#2D8FBF]/20 bg-white"
                style={{ color: areaId ? '#252850' : '#9aabb8', fontFamily: "'Inter', sans-serif" }}
              >
                <option value="" disabled>Select an area…</option>
                {areas.map(a => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            )}
          </div>

          {error && (
            <p className="text-sm rounded-lg bg-red-50 border border-red-200 text-red-600 px-4 py-3">
              {error}
            </p>
          )}
          {success && (
            <p
              className="text-sm rounded-lg px-4 py-3 font-semibold"
              style={{ background: '#E8F8F1', borderColor: '#2DA870', color: '#1a7a50', border: '1px solid #2DA870' }}
            >
              {success}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || areas.length === 0}
            className="self-start px-5 py-2.5 rounded-lg text-sm font-semibold text-white disabled:opacity-60"
            style={{ background: '#2D8FBF', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            {loading ? 'Sending…' : 'Send Invitation'}
          </button>
        </form>
      </div>

      {/* Current team members */}
      {teamMembers.length > 0 && (
        <div className="mb-8">
          <h2
            className="text-base font-bold mb-4"
            style={{ color: '#2D3272', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            Team Members
          </h2>
          <div className="bg-white rounded-xl border border-[#e8edf2] shadow-sm divide-y divide-[#e8edf2]">
            {teamMembers.map(member => (
              <div key={member.id} className="px-5 py-4 flex items-start justify-between gap-4">
                <div>
                  <p
                    className="text-sm font-semibold"
                    style={{ color: '#252850', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                  >
                    {member.full_name}
                  </p>
                  <p className="text-sm" style={{ color: '#5B7FA6' }}>{member.email}</p>
                </div>
                <div className="text-right">
                  {member.areas.length > 0 ? (
                    member.areas.map(a => (
                      <span
                        key={a}
                        className="inline-block text-xs font-semibold rounded-full px-2.5 py-0.5 mr-1 mb-1"
                        style={{ background: '#EBF5FB', color: '#2D8FBF', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                      >
                        {a}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs" style={{ color: '#B0B8C9' }}>No areas assigned</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pending invitations */}
      {pending.length > 0 && (
        <div>
          <h2
            className="text-base font-bold mb-4"
            style={{ color: '#2D3272', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            Pending Invitations
          </h2>
          <div className="bg-white rounded-xl border border-[#e8edf2] shadow-sm divide-y divide-[#e8edf2]">
            {pending.map(inv => (
              <div key={inv.id} className="px-5 py-4 flex items-center justify-between gap-4">
                <div>
                  <p
                    className="text-sm font-semibold"
                    style={{ color: '#252850', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                  >
                    {inv.email}
                  </p>
                  <p className="text-xs" style={{ color: '#5B7FA6' }}>
                    Invited {formatDate(inv.created_at)} · {inv.area_name}
                  </p>
                </div>
                <span
                  className="text-xs font-semibold rounded-full px-2.5 py-1"
                  style={{ background: '#FFF8E6', color: '#B8860B', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                >
                  Pending
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state — no team members or invitations */}
      {teamMembers.length === 0 && pending.length === 0 && (
        <div
          className="bg-white rounded-xl border border-[#e8edf2] shadow-sm p-8 text-center"
          style={{ marginTop: '-1rem' }}
        >
          <p
            className="text-sm font-semibold mb-1"
            style={{ color: '#2D3272', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            No team members yet
          </p>
          <p className="text-sm" style={{ color: '#5B7FA6' }}>
            Invite area owners using the form above to give them access to their specific areas.
          </p>
        </div>
      )}
    </div>
  )
}
