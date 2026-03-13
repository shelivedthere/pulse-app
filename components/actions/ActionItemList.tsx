'use client'

import { useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'

type StatusValue = 'open' | 'in_progress' | 'closed'

export type ActionItem = {
  id: string
  description: string
  owner_name: string | null
  due_date: string | null
  status: StatusValue
  area_id: string
  area_name: string
  created_at: string
}

type Area = { id: string; name: string }

interface Props {
  initialItems: ActionItem[]
  areas: Area[]
  orgId: string
}

const STATUS_LABELS: Record<StatusValue, string> = {
  open: 'Open',
  in_progress: 'In Progress',
  closed: 'Closed',
}

const STATUS_COLORS: Record<StatusValue, { bg: string; text: string }> = {
  open:        { bg: '#FDECEA', text: '#C62828' },
  in_progress: { bg: '#FEF3E2', text: '#D4860B' },
  closed:      { bg: '#EBF6F0', text: '#2DA870' },
}

function dueDateDisplay(due_date: string | null): { label: string; color: string } {
  if (!due_date) return { label: 'No due date', color: '#B0B8C9' }

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  // Parse as local date by appending noon time to avoid UTC-offset shifts
  const due = new Date(due_date + 'T12:00:00')
  const msPerDay = 1000 * 60 * 60 * 24
  const daysUntil = Math.round((due.getTime() - today.getTime()) / msPerDay)
  const label = due.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

  if (daysUntil < 0)  return { label, color: '#E53935' }
  if (daysUntil <= 7) return { label, color: '#F5D800' }
  return { label, color: '#5B7FA6' }
}

export default function ActionItemList({ initialItems, areas }: Props) {
  const [items, setItems] = useState<ActionItem[]>(initialItems)
  const [areaFilter, setAreaFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [ownerDraft, setOwnerDraft] = useState<Record<string, string>>({})
  const [savingId, setSavingId] = useState<string | null>(null)

  const filtered = useMemo(
    () =>
      items.filter(item => {
        if (areaFilter !== 'all' && item.area_id !== areaFilter) return false
        if (statusFilter !== 'all' && item.status !== statusFilter) return false
        return true
      }),
    [items, areaFilter, statusFilter]
  )

  async function handleStatusChange(id: string, status: StatusValue) {
    setSavingId(id)
    const supabase = createClient()
    const { error } = await supabase.from('action_items').update({ status }).eq('id', id)
    if (!error) setItems(prev => prev.map(i => i.id === id ? { ...i, status } : i))
    setSavingId(null)
  }

  async function handleOwnerBlur(id: string) {
    const draft = ownerDraft[id]
    if (draft === undefined) return

    setSavingId(id)
    const owner_name = draft.trim() || null
    const supabase = createClient()
    const { error } = await supabase.from('action_items').update({ owner_name }).eq('id', id)
    if (!error) {
      setItems(prev => prev.map(i => i.id === id ? { ...i, owner_name } : i))
      setOwnerDraft(prev => { const n = { ...prev }; delete n[id]; return n })
    }
    setSavingId(null)
  }

  function ownerValue(item: ActionItem) {
    return ownerDraft[item.id] !== undefined ? ownerDraft[item.id] : (item.owner_name ?? '')
  }

  const hasAnyOpen = items.some(i => i.status === 'open')
  const isFiltered = areaFilter !== 'all' || statusFilter !== 'all'

  const selectClass = "rounded-lg border border-[#d1dae6] px-3 py-2 text-sm outline-none transition focus:border-[#2D8FBF] focus:ring-2 focus:ring-[#2D8FBF]/20 bg-white"

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <select
          value={areaFilter}
          onChange={e => setAreaFilter(e.target.value)}
          className={selectClass}
          style={{ color: '#252850', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
        >
          <option value="all">All areas</option>
          {areas.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>

        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className={selectClass}
          style={{ color: '#252850', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
        >
          <option value="all">All statuses</option>
          <option value="open">Open</option>
          <option value="in_progress">In Progress</option>
          <option value="closed">Closed</option>
        </select>

        <span className="self-center text-sm" style={{ color: '#5B7FA6' }}>
          {filtered.length} {filtered.length === 1 ? 'item' : 'items'}
        </span>
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="bg-white rounded-xl border border-[#e8edf2] shadow-sm p-10 text-center">
          {!isFiltered && !hasAnyOpen ? (
            <>
              <p className="text-2xl mb-3">🎉</p>
              <p className="text-sm font-semibold" style={{ color: '#2D3272', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                No open action items — great work!
              </p>
              <p className="text-sm mt-1" style={{ color: '#5B7FA6' }}>
                Keep running audits to stay on top of 6S standards.
              </p>
            </>
          ) : (
            <p className="text-sm" style={{ color: '#5B7FA6' }}>
              No items match your filters.
            </p>
          )}
        </div>
      )}

      {/* Item list */}
      {filtered.length > 0 && (
        <div className="flex flex-col gap-3">
          {filtered.map(item => {
            const { label: dateLabel, color: dateColor } = dueDateDisplay(item.due_date)
            const sc = STATUS_COLORS[item.status]
            const isSaving = savingId === item.id

            return (
              <div
                key={item.id}
                className="bg-white rounded-xl border border-[#e8edf2] shadow-sm p-5 flex flex-col gap-3"
                style={{ opacity: isSaving ? 0.6 : 1, transition: 'opacity 0.15s' }}
              >
                {/* Top row: area badge + status */}
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <span
                    className="text-xs font-bold px-2.5 py-1 rounded-full"
                    style={{
                      background: '#EBF0F8',
                      color: '#2D3272',
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                    }}
                  >
                    {item.area_name}
                  </span>

                  <select
                    value={item.status}
                    onChange={e => handleStatusChange(item.id, e.target.value as StatusValue)}
                    disabled={isSaving}
                    className="rounded-lg border-0 text-xs font-semibold px-2.5 py-1 outline-none cursor-pointer"
                    style={{
                      background: sc.bg,
                      color: sc.text,
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                    }}
                  >
                    {(Object.entries(STATUS_LABELS) as [StatusValue, string][]).map(([val, label]) => (
                      <option key={val} value={val}>{label}</option>
                    ))}
                  </select>
                </div>

                {/* Description */}
                <p className="text-sm leading-snug" style={{ color: '#252850' }}>
                  {item.description}
                </p>

                {/* Owner + due date row */}
                <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
                  <input
                    type="text"
                    value={ownerValue(item)}
                    onChange={e => setOwnerDraft(prev => ({ ...prev, [item.id]: e.target.value }))}
                    onBlur={() => handleOwnerBlur(item.id)}
                    onKeyDown={e => e.key === 'Enter' && (e.currentTarget.blur())}
                    placeholder="Assign owner…"
                    disabled={isSaving}
                    className="flex-1 rounded-lg border border-[#d1dae6] px-3 py-2 text-sm outline-none transition focus:border-[#2D8FBF] focus:ring-2 focus:ring-[#2D8FBF]/20"
                    style={{ color: '#252850', fontFamily: "'Inter', sans-serif" }}
                  />

                  <span
                    className="text-xs font-semibold flex-shrink-0"
                    style={{ color: dateColor, fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                  >
                    Due {dateLabel}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
