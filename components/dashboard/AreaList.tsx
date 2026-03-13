'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

type Area = {
  id: string
  name: string
  created_at: string
}

interface Props {
  initialAreas: Area[]
  orgId: string
  userId: string
}

export default function AreaList({ initialAreas, orgId, userId }: Props) {
  const [areas, setAreas] = useState<Area[]>(initialAreas)
  const [showForm, setShowForm] = useState(false)
  const [areaName, setAreaName] = useState('')
  const [formError, setFormError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleAddArea(e: React.FormEvent) {
    e.preventDefault()

    const name = areaName.trim()
    if (!name) {
      setFormError('Area name is required.')
      return
    }

    setFormError(null)
    setLoading(true)

    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('areas')
        .insert({ name, org_id: orgId, created_by: userId })
        .select('id, name, created_at')
        .single()

      if (error || !data) {
        setFormError('Failed to add area. Please try again.')
        setLoading(false)
        return
      }

      setAreas(prev => [...prev, data])
      setAreaName('')
      setShowForm(false)
    } catch {
      setFormError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  function handleCancel() {
    setShowForm(false)
    setAreaName('')
    setFormError(null)
  }

  // ── Empty state ──────────────────────────────────────────────
  if (areas.length === 0 && !showForm) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mb-6"
          style={{ background: '#EBF0F8' }}
        >
          🏭
        </div>
        <h2
          className="text-xl font-extrabold mb-2"
          style={{ color: '#2D3272', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
        >
          No areas yet
        </h2>
        <p className="text-sm mb-8 max-w-xs" style={{ color: '#5B7FA6' }}>
          Add your first area — a warehouse, lab, or production floor — to start running audits.
        </p>
        <button
          onClick={() => setShowForm(true)}
          className="px-6 py-3 rounded-lg text-sm font-semibold text-white"
          style={{ background: '#2D8FBF', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
        >
          + Add your first area
        </button>
      </div>
    )
  }

  // ── Areas list ───────────────────────────────────────────────
  return (
    <div>
      {/* Add Area form */}
      {showForm && (
        <div className="bg-white rounded-xl border border-[#e8edf2] shadow-sm p-6 mb-6">
          <h3
            className="text-base font-bold mb-4"
            style={{ color: '#2D3272', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            Add area
          </h3>
          <form onSubmit={handleAddArea} className="flex flex-col gap-3">
            <input
              type="text"
              autoFocus
              value={areaName}
              onChange={e => {
                setAreaName(e.target.value)
                if (formError) setFormError(null)
              }}
              placeholder="e.g. Warehouse, Lab A, Production Floor 2"
              className="w-full rounded-lg border border-[#d1dae6] px-4 py-2.5 text-sm outline-none transition focus:border-[#2D8FBF] focus:ring-2 focus:ring-[#2D8FBF]/20"
              style={{ color: '#252850', fontFamily: "'Inter', sans-serif" }}
            />
            {formError && (
              <p className="text-sm text-red-600">{formError}</p>
            )}
            <div className="flex gap-2 mt-1">
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-60 disabled:cursor-not-allowed"
                style={{ background: '#2D8FBF', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                {loading ? 'Adding…' : 'Add area'}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 rounded-lg text-sm font-semibold border border-[#d1dae6]"
                style={{ color: '#5B7FA6', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Add Area button (when areas exist and form is hidden) */}
      {!showForm && (
        <div className="flex justify-end mb-5">
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-white"
            style={{ background: '#2D8FBF', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            + Add area
          </button>
        </div>
      )}

      {/* Area cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {areas.map(area => (
          <div
            key={area.id}
            className="bg-white rounded-xl border border-[#e8edf2] shadow-sm p-6 flex flex-col gap-4"
          >
            {/* Area name */}
            <h3
              className="text-lg font-extrabold leading-tight"
              style={{ color: '#2D3272', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              {area.name}
            </h3>

            {/* Status row */}
            <div className="flex items-center gap-3 text-sm" style={{ color: '#5B7FA6' }}>
              <span>No audits yet</span>
              <span className="text-[#d1dae6]">·</span>
              <span className="flex items-center gap-1">
                <span
                  className="inline-block w-2 h-2 rounded-full"
                  style={{ background: '#F5D800' }}
                />
                0 open
              </span>
            </div>

            {/* Start Audit button */}
            <div className="mt-auto pt-1">
              <Link
                href={`/audit/${area.id}`}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold border-2 transition-colors"
                style={{
                  color: '#2D8FBF',
                  borderColor: '#2D8FBF',
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                }}
              >
                Start Audit →
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
