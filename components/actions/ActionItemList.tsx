'use client'

import { useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import AddActionItemModal from './AddActionItemModal'

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
  audit_id: string | null
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

function SourceBadge({ item, isEdited }: { item: ActionItem; isEdited: boolean }) {
  if (item.audit_id !== null) {
    return (
      <span style={{
        fontSize: '0.6875rem', fontWeight: 700, padding: '2px 8px',
        borderRadius: '999px', background: 'rgba(91, 184, 212, 0.15)',
        color: '#5BB8D4', fontFamily: "'Plus Jakarta Sans', sans-serif",
        whiteSpace: 'nowrap',
      }}>
        {isEdited ? '✨ AI · Edited' : '✨ AI'}
      </span>
    )
  }
  return (
    <span style={{
      fontSize: '0.6875rem', fontWeight: 700, padding: '2px 8px',
      borderRadius: '999px', background: 'rgba(91, 127, 166, 0.1)',
      color: '#5B7FA6', fontFamily: "'Plus Jakarta Sans', sans-serif",
      whiteSpace: 'nowrap',
    }}>
      Manual
    </span>
  )
}

export default function ActionItemList({ initialItems, areas, orgId, initialAreaFilter = 'all' }: Props) {
  const [items, setItems] = useState<ActionItem[]>(initialItems)
  const [areaFilter, setAreaFilter] = useState(initialAreaFilter)
  const [statusFilter, setStatusFilter] = useState('all')
  const [ownerDraft, setOwnerDraft] = useState<Record<string, string>>({})
  const [savingId, setSavingId] = useState<string | null>(null)

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState('')
  const [editSaving, setEditSaving] = useState(false)
  const [editedIds, setEditedIds] = useState<Set<string>>(new Set())

  // Delete state
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Add modal
  const [showAddModal, setShowAddModal] = useState(false)

  const filtered = useMemo(
    () => items.filter(item => {
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

  function startEdit(item: ActionItem) {
    setEditingId(item.id)
    setEditDraft(item.description)
    setConfirmDeleteId(null)
  }

  function cancelEdit() {
    setEditingId(null)
    setEditDraft('')
  }

  async function saveEdit(id: string) {
    const trimmed = editDraft.trim()
    if (!trimmed) return
    setEditSaving(true)
    const supabase = createClient()
    const { error } = await supabase.from('action_items').update({ description: trimmed }).eq('id', id)
    if (!error) {
      setItems(prev => prev.map(i => i.id === id ? { ...i, description: trimmed } : i))
      setEditedIds(prev => new Set(prev).add(id))
      setEditingId(null)
      setEditDraft('')
    }
    setEditSaving(false)
  }

  async function executeDelete(id: string) {
    setDeletingId(id)
    const supabase = createClient()
    const { error } = await supabase.from('action_items').delete().eq('id', id)
    if (!error) {
      setItems(prev => prev.filter(i => i.id !== id))
      setConfirmDeleteId(null)
    }
    setDeletingId(null)
  }

  const isFiltered = areaFilter !== 'all' || statusFilter !== 'all'

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
      {/* Add modal */}
      {showAddModal && (
        <AddActionItemModal
          areas={areas}
          orgId={orgId}
          onAdd={item => setItems(prev => [item, ...prev])}
          onClose={() => setShowAddModal(false)}
        />
      )}

      {/* Filter bar + Add button */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: '12px',
        marginBottom: '24px',
        flexWrap: 'wrap',
      }}>
        {/* Filters */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px' }}>
          <select value={areaFilter} onChange={e => setAreaFilter(e.target.value)} style={selectStyle}>
            <option value="all">All areas</option>
            {areas.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>

          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={selectStyle}>
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
              onClick={() => { setAreaFilter('all'); setStatusFilter('all') }}
              style={{
                background: 'none', border: 'none', color: '#2D8FBF',
                fontSize: '0.85rem', cursor: 'pointer', padding: 0,
                fontFamily: "'Plus Jakarta Sans', sans-serif", textDecoration: 'underline',
              }}
            >
              Clear filters
            </button>
          )}
        </div>

        {/* Add button */}
        <button
          onClick={() => setShowAddModal(true)}
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
            whiteSpace: 'nowrap',
          }}
        >
          + Add Action Item
        </button>
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <div style={{
          backgroundColor: '#ffffff', borderRadius: '12px',
          border: '1px solid #e8edf2', boxShadow: '0 1px 4px rgba(45, 50, 114, 0.06)',
          padding: '48px 24px', textAlign: 'center',
        }}>
          {isFiltered ? (
            <p style={{ fontSize: '0.9rem', color: '#5B7FA6', margin: 0 }}>No items match your filters.</p>
          ) : (
            <>
              <p style={{ fontSize: '2rem', margin: '0 0 12px' }}>🎉</p>
              <p style={{
                fontSize: '1rem', fontWeight: 700, color: '#2D3272',
                fontFamily: "'Plus Jakarta Sans', sans-serif", margin: '0 0 6px',
              }}>
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
            const isSaving = savingId === item.id || deletingId === item.id
            const statusTextColor = STATUS_TEXT_COLORS[item.status]
            const isEditing = editingId === item.id
            const isConfirmingDelete = confirmDeleteId === item.id
            const isEdited = editedIds.has(item.id)

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
                {/* Top row: badges + actions + status */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '8px',
                  flexWrap: 'wrap',
                }}>
                  {/* Left: area badge + source badge */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                    <span style={{
                      backgroundColor: 'rgba(45, 143, 191, 0.12)',
                      color: '#2D8FBF', fontSize: '0.75rem', fontWeight: 700,
                      padding: '4px 10px', borderRadius: '999px',
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                    }}>
                      {item.area_name}
                    </span>
                    <SourceBadge item={item} isEdited={isEdited} />
                  </div>

                  {/* Right: edit + delete + status */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {!isEditing && !isConfirmingDelete && (
                      <>
                        <button
                          onClick={() => startEdit(item)}
                          disabled={isSaving}
                          title="Edit description"
                          style={{
                            background: 'none', border: 'none', cursor: 'pointer',
                            fontSize: '0.8125rem', color: '#2D8FBF',
                            padding: '4px 8px', borderRadius: '6px',
                            fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 600,
                          }}
                        >
                          ✏️ Edit
                        </button>
                        <button
                          onClick={() => { setConfirmDeleteId(item.id); setEditingId(null) }}
                          disabled={isSaving}
                          title="Delete"
                          style={{
                            background: 'none', border: 'none', cursor: 'pointer',
                            fontSize: '0.875rem', color: '#ef4444',
                            padding: '4px 6px', borderRadius: '6px',
                          }}
                        >
                          🗑️
                        </button>
                      </>
                    )}

                    <select
                      value={item.status}
                      onChange={e => handleStatusChange(item.id, e.target.value as StatusValue)}
                      disabled={isSaving}
                      style={{
                        color: statusTextColor, backgroundColor: '#ffffff',
                        border: '1px solid #d1dae6', borderRadius: '8px',
                        padding: '4px 8px', fontSize: '0.8rem', fontWeight: 600,
                        cursor: 'pointer', outline: 'none',
                        fontFamily: "'Plus Jakarta Sans', sans-serif",
                      }}
                    >
                      {(Object.entries(STATUS_LABELS) as [StatusValue, string][]).map(([val, label]) => (
                        <option key={val} value={val}>{label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Description — read or edit mode */}
                {isEditing ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <textarea
                      value={editDraft}
                      onChange={e => setEditDraft(e.target.value)}
                      autoFocus
                      rows={3}
                      style={{
                        width: '100%', borderRadius: '8px', border: '1.5px solid #2D8FBF',
                        padding: '10px 12px', fontSize: '0.95rem', color: '#252850',
                        fontFamily: "'Inter', sans-serif", resize: 'vertical',
                        outline: 'none', boxSizing: 'border-box',
                        boxShadow: '0 0 0 3px rgba(45,143,191,0.12)',
                      }}
                    />
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => saveEdit(item.id)}
                        disabled={editSaving || !editDraft.trim()}
                        style={{
                          padding: '6px 16px', borderRadius: '8px',
                          background: '#2D8FBF', color: '#ffffff',
                          fontWeight: 600, fontSize: '0.875rem',
                          fontFamily: "'Plus Jakarta Sans', sans-serif",
                          border: 'none', cursor: editSaving ? 'not-allowed' : 'pointer',
                          opacity: editSaving ? 0.7 : 1,
                        }}
                      >
                        {editSaving ? 'Saving…' : 'Save'}
                      </button>
                      <button
                        onClick={cancelEdit}
                        style={{
                          padding: '6px 16px', borderRadius: '8px',
                          background: 'none', border: 'none',
                          color: '#5B7FA6', fontWeight: 600, fontSize: '0.875rem',
                          fontFamily: "'Plus Jakarta Sans', sans-serif", cursor: 'pointer',
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <p style={{ fontSize: '0.95rem', lineHeight: 1.6, color: '#252850', margin: 0 }}>
                    {item.description}
                  </p>
                )}

                {/* Delete confirmation */}
                {isConfirmingDelete && (
                  <div style={{
                    borderRadius: '8px', background: '#fff5f5',
                    border: '1px solid #fecaca', padding: '12px 16px',
                    display: 'flex', flexDirection: 'column', gap: '10px',
                  }}>
                    <p style={{
                      fontSize: '0.875rem', color: '#252850', margin: 0,
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                    }}>
                      Delete this action item? This cannot be undone.
                    </p>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => executeDelete(item.id)}
                        disabled={deletingId === item.id}
                        style={{
                          padding: '6px 16px', borderRadius: '8px',
                          background: '#ef4444', color: '#ffffff',
                          fontWeight: 600, fontSize: '0.875rem',
                          fontFamily: "'Plus Jakarta Sans', sans-serif",
                          border: 'none', cursor: 'pointer',
                          opacity: deletingId === item.id ? 0.7 : 1,
                        }}
                      >
                        {deletingId === item.id ? 'Deleting…' : 'Yes, delete'}
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(null)}
                        style={{
                          padding: '6px 16px', borderRadius: '8px',
                          background: 'none', border: 'none',
                          color: '#5B7FA6', fontWeight: 600, fontSize: '0.875rem',
                          fontFamily: "'Plus Jakarta Sans', sans-serif", cursor: 'pointer',
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* Owner + due date row */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div>
                    <label style={labelStyle}>Owner</label>
                    <input
                      type="text"
                      value={ownerValue(item)}
                      onChange={e => setOwnerDraft(prev => ({ ...prev, [item.id]: e.target.value }))}
                      onBlur={() => handleOwnerBlur(item.id)}
                      onKeyDown={e => e.key === 'Enter' && e.currentTarget.blur()}
                      placeholder="Assign owner…"
                      disabled={isSaving}
                      style={{
                        width: '100%', borderRadius: '8px', border: '1px solid #d1dae6',
                        padding: '8px 12px', fontSize: '0.875rem', color: '#252850',
                        fontFamily: "'Inter', sans-serif", outline: 'none',
                        boxSizing: 'border-box', backgroundColor: '#ffffff',
                      }}
                    />
                  </div>
                  <div>
                    <span style={labelStyle}>Due</span>
                    <span style={{
                      fontSize: '0.875rem', fontWeight: 600, color: dateColor,
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                    }}>
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
