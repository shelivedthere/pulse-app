'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import FirstAuditModal, { shouldShowFirstAuditModal } from './FirstAuditModal'

type Area = {
  id: string
  name: string
  created_at: string
  latestScore: number | null
  lastAuditDate: string | null
  openItemCount: number
}

interface Props {
  initialAreas: Area[]
  orgId: string
  userId: string
  isAdmin: boolean
}

function scoreColor(score: number | null): string {
  if (score == null) return '#5B7FA6'
  if (score >= 80) return '#2DA870'
  if (score >= 60) return '#F5D800'
  return '#E53935'
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default function AreaList({ initialAreas, orgId, userId, isAdmin }: Props) {
  const [areas, setAreas] = useState<Area[]>(initialAreas)
  const [showForm, setShowForm] = useState(false)
  const [areaName, setAreaName] = useState('')
  const [formError, setFormError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [firstAuditModalHref, setFirstAuditModalHref] = useState<string | null>(null)

  function handleStartAudit(href: string) {
    if (shouldShowFirstAuditModal()) {
      setFirstAuditModalHref(href)
    } else {
      window.location.href = href
    }
  }

  async function handleAddArea(e: React.FormEvent) {
    e.preventDefault()
    const name = areaName.trim()
    if (!name) { setFormError('Area name is required.'); return }

    setFormError(null)
    setLoading(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('areas')
        .insert({ name, org_id: orgId, created_by: userId })
        .select('id, name, created_at')
        .single()

      if (error || !data) { setFormError('Failed to add area. Please try again.'); return }

      setAreas(prev => [...prev, { ...data, latestScore: null, lastAuditDate: null, openItemCount: 0 }])
      setAreaName('')
      setShowForm(false)
    } catch {
      setFormError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // ── Empty state ──────────────────────────────────────────────
  if (areas.length === 0 && !showForm) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '4rem 2rem',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            width: '72px',
            height: '72px',
            borderRadius: '1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '4rem',
            background: '#EBF0F8',
            marginBottom: '1.5rem',
          }}
        >
          🏭
        </div>
        <h2
          style={{
            fontSize: '1.75rem',
            fontWeight: 800,
            color: '#2D3272',
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            marginBottom: '0.75rem',
          }}
        >
          {isAdmin ? 'Welcome to Pulse!' : 'No areas assigned'}
        </h2>
        <p
          style={{
            fontSize: '0.9375rem',
            color: '#5B7FA6',
            maxWidth: '22rem',
            lineHeight: 1.6,
            marginBottom: '2rem',
          }}
        >
          {isAdmin
            ? 'Add your first work area to get started — a warehouse, lab, or production floor.'
            : "You haven't been assigned to any areas yet. Contact your administrator to get access."}
        </p>
        {isAdmin && (
          <button
            onClick={() => setShowForm(true)}
            style={{
              padding: '0.875rem 2rem',
              fontSize: '1rem',
              minHeight: '52px',
              borderRadius: '0.5rem',
              fontWeight: 700,
              color: '#FFFFFF',
              background: '#2D8FBF',
              border: 'none',
              cursor: 'pointer',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}
          >
            + Add your first area
          </button>
        )}
      </div>
    )
  }

  return (
    <div>
      {/* First audit modal */}
      {firstAuditModalHref && (
        <FirstAuditModal
          auditHref={firstAuditModalHref}
          onClose={() => setFirstAuditModalHref(null)}
        />
      )}

      {/* Add area form — admin only */}
      {isAdmin && showForm && (
        <div
          style={{
            padding: '1rem',
            marginBottom: '24px',
            border: '1px solid #e5e7eb',
            borderRadius: '0.75rem',
            backgroundColor: '#ffffff',
          }}
        >
          <h3
            className="text-base font-bold"
            style={{ color: '#2D3272', fontFamily: "'Plus Jakarta Sans', sans-serif", marginBottom: '0.5rem' }}
          >
            Add area
          </h3>
          <form onSubmit={handleAddArea} className="flex flex-col">
            <input
              type="text"
              autoFocus
              value={areaName}
              onChange={e => { setAreaName(e.target.value); if (formError) setFormError(null) }}
              placeholder="e.g. Warehouse, Lab A, Production Floor 2"
              className="w-full rounded-lg border border-[#d1dae6] px-4 py-2.5 text-sm outline-none transition focus:border-[#2D8FBF] focus:ring-2 focus:ring-[#2D8FBF]/20"
              style={{ color: '#252850', fontFamily: "'Inter', sans-serif", marginBottom: '0.75rem' }}
            />
            {formError && <p className="text-sm text-red-600" style={{ marginBottom: '0.5rem' }}>{formError}</p>}
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={loading}
                className="rounded-lg text-sm font-semibold text-white disabled:opacity-60"
                style={{ padding: '0.5rem 1rem', background: '#2D8FBF', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                {loading ? 'Adding…' : 'Add area'}
              </button>
              <button
                type="button"
                onClick={() => { setShowForm(false); setAreaName(''); setFormError(null) }}
                className="rounded-lg text-sm font-semibold border border-[#d1dae6]"
                style={{ padding: '0.5rem 1rem', color: '#5B7FA6', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Add area button — admin only */}
      {isAdmin && !showForm && (
        <div className="flex justify-end mb-5">
          <button
            onClick={() => setShowForm(true)}
            style={{
              padding: '0.625rem 1.25rem',
              fontSize: '0.9375rem',
              fontWeight: 600,
              minHeight: '44px',
              borderRadius: '0.5rem',
              background: '#2D8FBF',
              color: '#ffffff',
              border: 'none',
              cursor: 'pointer',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}
          >
            + Add area
          </button>
        </div>
      )}

      {/* Area cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {areas.map(area => {
          const color = scoreColor(area.latestScore)
          const hasScore = area.latestScore != null

          return (
            <div
              key={area.id}
              style={{
                background: '#ffffff',
                borderRadius: '14px',
                border: '1px solid #e8edf2',
                boxShadow: '0 2px 10px rgba(45, 50, 114, 0.08)',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              {/* Area name */}
              <h3
                className="text-lg font-extrabold leading-tight"
                style={{ color: '#2D3272', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                {area.name}
              </h3>

              {/* Edit checklist link — admin only */}
              {isAdmin && (
                <Link
                  href={`/areas/${area.id}/settings`}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    fontSize: '0.8125rem',
                    color: '#2D8FBF',
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    textDecoration: 'none',
                    marginTop: '-4px',
                  }}
                >
                  ✏️ Edit checklist
                </Link>
              )}

              {/* Score */}
              {hasScore ? (
                <div
                  className="text-4xl font-extrabold tabular-nums"
                  style={{ color, fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                >
                  {area.latestScore!.toFixed(1)}%
                </div>
              ) : (
                <div
                  className="text-sm font-semibold"
                  style={{ color: '#5B7FA6', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                >
                  No audits yet
                </div>
              )}

              {/* Meta row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', fontSize: '13px', color: '#5B7FA6' }}>
                {area.lastAuditDate && (
                  <span>Last audit: {formatDate(area.lastAuditDate)}</span>
                )}
                {area.lastAuditDate && area.openItemCount > 0 && (
                  <span style={{ color: '#d1dae6' }}>·</span>
                )}
                {area.openItemCount > 0 && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                    <span
                      style={{
                        width: '7px',
                        height: '7px',
                        borderRadius: '50%',
                        background: '#ef4444',
                        flexShrink: 0,
                        display: 'inline-block',
                      }}
                    />
                    {area.openItemCount} open {area.openItemCount === 1 ? 'item' : 'items'}
                  </span>
                )}
                {!area.lastAuditDate && area.openItemCount === 0 && (
                  <span>—</span>
                )}
              </div>

              {/* Action buttons */}
              <div style={{ marginTop: 'auto', paddingTop: '4px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button
                  onClick={() => handleStartAudit(`/audit/${area.id}`)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: 600,
                    background: '#2D8FBF',
                    color: '#ffffff',
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  Start Audit
                </button>
                <Link
                  href={`/areas/${area.id}`}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: 600,
                    border: '1.5px solid #2D8FBF',
                    color: '#2D8FBF',
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    textDecoration: 'none',
                  }}
                >
                  View Area
                </Link>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
