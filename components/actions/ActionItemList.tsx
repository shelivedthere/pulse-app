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
  initialAreaFilter?: string
}

const STATUS_LABELS: Record<StatusValue, string> = {
  open: 'Open',
  in_progress: 'In Progress',
  closed: 'Closed',
}

const STATUS_TEXT_COLORS: Record<StatusValue, string> = {
  open: '#5B7FA6',
  in_progress: '#2D8FBF',
  closed: '#2DA870',
}

function dueDateInfo(due_date: string | null): { label: string; color: string } {
  if (!due_date) return { label: 'No due date', color: '#B0B8C9' }

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const due = new Date(due_date + 'T12:00:00')
  const msPerDay = 1000 * 60 * 60 * 24
  const daysUntil = Math.round((due.getTime() - today.getTime()) / msPerDay)
  const label = due.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

  if (daysUntil < 0)  return { label, color: '#ef4444' }
  if (daysUntil <= 7) return { label, color: '#F5D800' }
  return { label, color: '#5B7FA6' }
}

function cardLeftBorderColor(item: ActionItem): string {
  if (item.status === 'closed') return '#2DA870'
  if (!item.due_date) return '#e5e7eb'
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const due = new Date(item.due_date + 'T12:00:00')
  const msPerDay = 1000 * 60 * 60 * 24
  const daysUntil = Math.round((due.getTime() - today.getTime()) / msPerDay)
  if (daysUntil < 0) return '#ef4444'
  if (daysUntil <= 7) return '#F5D800'
  return '#e5e7eb'
}

export default function ActionItemList({ initialItems, areas, initialAreaFilter = 'all' }: Props) {
  const [items, setItems] = useState<ActionItem[]>(initialItems)
  const [areaFilter, setAreaFilter] = useState(initialAreaFilter)
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

  const isFiltered = areaFilter !== 'all' || statusFilter !== 'all'

  function clearFilters() {
    setAreaFilter('all')
    setStatusFilter('all')
  }

  const selectStyle: React.CSSProperties = {
    borderRadius: '8px',
    border: '1px solid #d1dae6',
    padding: '8px 12px',
    fontSize: '0.875rem',
    color: '#252850',
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    backgroundColor: '#ffffff',
    outline: 'none',
    cursor: 'pointer',
  }

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '0.68rem',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    color: '#B0B8C9',
    marginBottom: '5px',
    fontFamily: "'Plus Jakarta Sans', sans-serif",
  }

  return (
    <div>
      {/* Filter bar */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '24px',
        }}
      >
        <select
          value={areaFilter}
          onChange={e => setAreaFilter(e.target.value)}
          style={selectStyle}
        >
          <option value="all">All areas</option>
          {areas.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>

        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          style={selectStyle}
        >
          <option value="all">All statuses</option>
          <option value="open">Open</option>
          <option value="in_progress">In Progress</option>
          <option value="closed">Closed</option>
        </select>

        <span style={{ fontSize: '0.85rem', color: '#5B7FA6', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          {isFiltered
            ? `Showing ${filtered.length} of ${items.length} ${items.length === 1 ? 'item' : 'items'}`
            : `${items.length} ${items.length === 1 ? 'item' : 'items'}`}
        </span>

        {isFiltered && (
          <button
            onClick={clearFilters}
            style={{
              background: 'none',
              border: 'none',
              color: '#2D8FBF',
              fontSize: '0.85rem',
              cursor: 'pointer',
              padding: 0,
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              textDecoration: 'underline',
            }}
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #e8edf2',
            boxShadow: '0 1px 4px rgba(45, 50, 114, 0.06)',
            padding: '48px 24px',
            textAlign: 'center',
          }}
        >
          {isFiltered ? (
            <p style={{ fontSize: '0.9rem', color: '#5B7FA6', margin: 0 }}>
              No items match your filters.
            </p>
          ) : (
            <>
              <p style={{ fontSize: '2rem', margin: '0 0 12px' }}>🎉</p>
              <p
                style={{
                  fontSize: '1rem',
                  fontWeight: 700,
                  color: '#2D3272',
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  margin: '0 0 6px',
                }}
              >
                No open action items — your areas are in great shape!
              </p>
              <p style={{ fontSize: '0.875rem', color: '#5B7FA6', margin: 0 }}>
                Conduct an audit to generate action items
              </p>
            </>
          )}
        </div>
      )}

      {/* Item list */}
      {filtered.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {filtered.map(item => {
            const { label: dateLabel, color: dateColor } = dueDateInfo(item.due_date)
            const leftBorder = cardLeftBorderColor(item)
            const isSaving = savingId === item.id
            const statusTextColor = STATUS_TEXT_COLORS[item.status]

            return (
              <div
                key={item.id}
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '12px',
                  border: '1px solid #e8edf2',
                  borderLeft: `4px solid ${leftBorder}`,
                  boxShadow: '0 1px 4px rgba(45, 50, 114, 0.06)',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                  opacity: isSaving ? 0.6 : item.status === 'closed' ? 0.7 : 1,
                  transition: 'opacity 0.15s',
                }}
              >
                {/* Top row: area badge + status dropdown */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                    flexWrap: 'wrap',
                  }}
                >
                  <span
                    style={{
                      backgroundColor: 'rgba(45, 143, 191, 0.12)',
                      color: '#2D8FBF',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      padding: '4px 10px',
                      borderRadius: '999px',
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                    }}
                  >
                    {item.area_name}
                  </span>

                  <select
                    value={item.status}
                    onChange={e => handleStatusChange(item.id, e.target.value as StatusValue)}
                    disabled={isSaving}
                    style={{
                      color: statusTextColor,
                      backgroundColor: '#ffffff',
                      border: '1px solid #d1dae6',
                      borderRadius: '8px',
                      padding: '4px 8px',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      outline: 'none',
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                    }}
                  >
                    {(Object.entries(STATUS_LABELS) as [StatusValue, string][]).map(([val, label]) => (
                      <option key={val} value={val}>{label}</option>
                    ))}
                  </select>
                </div>

                {/* Description */}
                <p
                  style={{
                    fontSize: '0.95rem',
                    lineHeight: 1.6,
                    color: '#252850',
                    margin: 0,
                  }}
                >
                  {item.description}
                </p>

                {/* Owner + due date row */}
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                  }}
                >
                  {/* Owner */}
                  <div>
                    <label style={labelStyle}>Owner</label>
                    <input
                      type="text"
                      value={ownerValue(item)}
                      onChange={e => setOwnerDraft(prev => ({ ...prev, [item.id]: e.target.value }))}
                      onBlur={() => handleOwnerBlur(item.id)}
                      onKeyDown={e => e.key === 'Enter' && (e.currentTarget.blur())}
                      placeholder="Assign owner…"
                      disabled={isSaving}
                      style={{
                        width: '100%',
                        borderRadius: '8px',
                        border: '1px solid #d1dae6',
                        padding: '8px 12px',
                        fontSize: '0.875rem',
                        color: '#252850',
                        fontFamily: "'Inter', sans-serif",
                        outline: 'none',
                        boxSizing: 'border-box',
                        backgroundColor: '#ffffff',
                      }}
                    />
                  </div>

                  {/* Due date */}
                  <div>
                    <span style={labelStyle}>Due</span>
                    <span
                      style={{
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        color: dateColor,
                        fontFamily: "'Plus Jakarta Sans', sans-serif",
                      }}
                    >
                      {dateLabel}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
