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
  const [ownerFilter, setOwnerFilter] = useState('all')
  const [sortOrder, setSortOrder] = useState('due_asc')
  const [savingId, setSavingId] = useState<string | null>(null)

  // Owner edit state (explicit save pattern)
  const [ownerEditingId, setOwnerEditingId] = useState<string | null>(null)
  const [ownerInputValue, setOwnerInputValue] = useState('')
  const [ownerSavingId, setOwnerSavingId] = useState<string | null>(null)

  // Due date edit state
  const [dueDateEditingId, setDueDateEditingId] = useState<string | null>(null)
  const [dueDateSaving, setDueDateSaving] = useState(false)
  const [dueDateSavedId, setDueDateSavedId] = useState<string | null>(null)
  const [dueDateHoverId, setDueDateHoverId] = useState<string | null>(null)

  // Description edit state
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState('')
  const [editSaving, setEditSaving] = useState(false)
  const [editedIds, setEditedIds] = useState<Set<string>>(new Set())

  // Delete state
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Add modal
  const [showAddModal, setShowAddModal] = useState(false)

  // Derive unique owners with counts for filter dropdown
  const ownerOptions = useMemo(() => {
    const counts = new Map<string, number>()
    let unassignedCount = 0
    for (const item of items) {
      if (item.owner_name) {
        counts.set(item.owner_name, (counts.get(item.owner_name) ?? 0) + 1)
      } else {
        unassignedCount++
      }
    }
    return {
      owners: Array.from(counts.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => a.name.localeCompare(b.name)),
      unassignedCount,
    }
  }, [items])

  const filtered = useMemo(() => {
    let result = items.filter(item => {
      if (areaFilter !== 'all' && item.area_id !== areaFilter) return false
      if (statusFilter !== 'all' && item.status !== statusFilter) return false
      if (ownerFilter === 'unassigned') {
        if (item.owner_name !== null && item.owner_name !== '') return false
      } else if (ownerFilter !== 'all') {
        if (item.owner_name !== ownerFilter) return false
      }
      return true
    })

    result = [...result].sort((a, b) => {
      if (sortOrder === 'due_asc' || sortOrder === 'due_desc') {
        const aNull = !a.due_date
        const bNull = !b.due_date
        if (aNull && bNull) return 0
        if (aNull) return 1
        if (bNull) return -1
        const diff = new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime()
        return sortOrder === 'due_asc' ? diff : -diff
      }
      if (sortOrder === 'created_desc') {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      }
      // created_asc
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    })

    return result
  }, [items, areaFilter, statusFilter, ownerFilter, sortOrder])

  async function handleStatusChange(id: string, status: StatusValue) {
    setSavingId(id)
    const supabase = createClient()
    const { error } = await supabase.from('action_items').update({ status }).eq('id', id)
    if (!error) setItems(prev => prev.map(i => i.id === id ? { ...i, status } : i))
    setSavingId(null)
  }

  function startOwnerEdit(item: ActionItem) {
    setOwnerEditingId(item.id)
    setOwnerInputValue(item.owner_name ?? '')
  }

  function cancelOwnerEdit() {
    setOwnerEditingId(null)
    setOwnerInputValue('')
  }

  async function saveOwner(id: string) {
    setOwnerSavingId(id)
    const owner_name = ownerInputValue.trim() || null
    const supabase = createClient()
    const { error } = await supabase.from('action_items').update({ owner_name }).eq('id', id)
    if (!error) {
      setItems(prev => prev.map(i => i.id === id ? { ...i, owner_name } : i))
      setOwnerEditingId(null)
      setOwnerInputValue('')
    }
    setOwnerSavingId(null)
  }

  async function handleDueDateChange(id: string, value: string) {
    setDueDateSaving(true)
    const due_date = value || null
    const supabase = createClient()
    const { error } = await supabase.from('action_items').update({ due_date }).eq('id', id)
    if (!error) {
      setItems(prev => prev.map(i => i.id === id ? { ...i, due_date } : i))
      setDueDateSavedId(id)
      setTimeout(() => setDueDateSavedId(prev => prev === id ? null : prev), 2000)
    }
    setDueDateSaving(false)
    setDueDateEditingId(null)
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

  const isFiltered = areaFilter !== 'all' || statusFilter !== 'all' || ownerFilter !== 'all'

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
        {/* Filters + Sort */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px' }}>
          {/* Area filter */}
          <select value={areaFilter} onChange={e => setAreaFilter(e.target.value)} style={selectStyle}>
            <option value="all">All areas</option>
            {areas.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>

          {/* Status filter */}
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={selectStyle}>
            <option value="all">All statuses</option>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="closed">Closed</option>
          </select>

          {/* Owner filter */}
          <select value={ownerFilter} onChange={e => setOwnerFilter(e.target.value)} style={selectStyle}>
            <option value="all">All owners</option>
            <option value="unassigned">Unassigned ({ownerOptions.unassignedCount})</option>
            {ownerOptions.owners.map(({ name, count }) => (
              <option key={name} value={name}>{name} ({count})</option>
            ))}
          </select>

          {/* Sort */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{
              fontSize: '0.8rem', color: '#5B7FA6',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              whiteSpace: 'nowrap',
            }}>
              Sort by
            </span>
            <select value={sortOrder} onChange={e => setSortOrder(e.target.value)} style={selectStyle}>
              <option value="due_asc">Due date (earliest first)</option>
              <option value="due_desc">Due date (latest first)</option>
              <option value="created_desc">Date created (newest first)</option>
              <option value="created_asc">Date created (oldest first)</option>
            </select>
          </div>

          {/* Item count */}
          <span style={{ fontSize: '0.85rem', color: '#5B7FA6', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            {isFiltered
              ? `Showing ${filtered.length} of ${items.length} ${items.length === 1 ? 'item' : 'items'}`
              : `${items.length} ${items.length === 1 ? 'item' : 'items'}`}
          </span>

          {isFiltered && (
            <button
              onClick={() => { setAreaFilter('all'); setStatusFilter('all'); setOwnerFilter('all') }}
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
            const isOwnerEditing = ownerEditingId === item.id
            const isOwnerSaving = ownerSavingId === item.id
            const isDueDateEditing = dueDateEditingId === item.id
            const isDueDateSaved = dueDateSavedId === item.id
            const isDueDateHovered = dueDateHoverId === item.id

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
                  {/* Owner — explicit save pattern */}
                  <div>
                    <span style={labelStyle}>Owner</span>
                    {isOwnerEditing ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <input
                            type="text"
                            value={ownerInputValue}
                            onChange={e => setOwnerInputValue(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && saveOwner(item.id)}
                            autoFocus
                            placeholder="Enter owner name…"
                            disabled={isOwnerSaving}
                            style={{
                              flex: 1, borderRadius: '8px', border: '1.5px solid #2D8FBF',
                              padding: '8px 12px', fontSize: '0.875rem', color: '#252850',
                              fontFamily: "'Inter', sans-serif", outline: 'none',
                              boxSizing: 'border-box', backgroundColor: '#ffffff',
                              boxShadow: '0 0 0 3px rgba(45,143,191,0.12)',
                            }}
                          />
                          <button
                            onClick={() => saveOwner(item.id)}
                            disabled={isOwnerSaving}
                            style={{
                              padding: '8px 16px', borderRadius: '8px',
                              background: '#2D8FBF', color: '#ffffff',
                              fontWeight: 600, fontSize: '0.875rem',
                              fontFamily: "'Plus Jakarta Sans', sans-serif",
                              border: 'none', cursor: isOwnerSaving ? 'not-allowed' : 'pointer',
                              opacity: isOwnerSaving ? 0.7 : 1,
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {isOwnerSaving ? 'Saving…' : 'Save'}
                          </button>
                        </div>
                        <button
                          onClick={cancelOwnerEdit}
                          style={{
                            background: 'none', border: 'none',
                            color: '#5B7FA6', fontSize: '0.8125rem',
                            fontFamily: "'Plus Jakarta Sans', sans-serif",
                            cursor: 'pointer', padding: 0,
                            textDecoration: 'underline', alignSelf: 'flex-start',
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => startOwnerEdit(item)}
                        style={{
                          background: 'none', border: 'none', padding: 0,
                          cursor: 'pointer', display: 'block', textAlign: 'left',
                          fontSize: '0.875rem',
                          color: item.owner_name ? '#252850' : '#5B7FA6',
                          fontStyle: item.owner_name ? 'normal' : 'italic',
                          fontFamily: "'Plus Jakarta Sans', sans-serif",
                        }}
                      >
                        {item.owner_name ?? 'Click to assign owner'}
                      </button>
                    )}
                  </div>

                  {/* Due date — clickable to edit */}
                  <div>
                    <span style={labelStyle}>Due</span>
                    {isDueDateEditing ? (
                      <input
                        type="date"
                        defaultValue={item.due_date ?? ''}
                        autoFocus
                        disabled={dueDateSaving}
                        onChange={e => handleDueDateChange(item.id, e.target.value)}
                        onBlur={() => setDueDateEditingId(null)}
                        style={{
                          borderRadius: '8px', border: '1.5px solid #2D8FBF',
                          padding: '6px 10px', fontSize: '0.875rem', color: '#252850',
                          fontFamily: "'Inter', sans-serif", outline: 'none',
                          boxShadow: '0 0 0 3px rgba(45,143,191,0.12)',
                          backgroundColor: '#ffffff',
                        }}
                      />
                    ) : (
                      <button
                        onClick={() => setDueDateEditingId(item.id)}
                        onMouseEnter={() => setDueDateHoverId(item.id)}
                        onMouseLeave={() => setDueDateHoverId(null)}
                        style={{
                          background: 'none', border: 'none', padding: 0,
                          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
                        }}
                      >
                        {item.due_date ? (
                          <span style={{
                            fontSize: '0.875rem', fontWeight: 600,
                            color: isDueDateHovered ? '#2D8FBF' : dateColor,
                            fontFamily: "'Plus Jakarta Sans', sans-serif",
                            textDecoration: isDueDateHovered ? 'underline' : 'none',
                            transition: 'color 0.15s',
                          }}>
                            {dateLabel}
                            {isDueDateHovered && (
                              <span style={{ marginLeft: '4px', fontSize: '0.75rem' }}>✏️</span>
                            )}
                          </span>
                        ) : (
                          <span style={{
                            fontSize: '0.875rem', fontWeight: 600,
                            color: '#2D8FBF',
                            fontFamily: "'Plus Jakarta Sans', sans-serif",
                            textDecoration: isDueDateHovered ? 'underline' : 'none',
                            transition: 'color 0.15s',
                          }}>
                            + Add due date
                          </span>
                        )}
                        {isDueDateSaved && (
                          <span style={{
                            color: '#2DA870', fontSize: '0.8rem', fontWeight: 600,
                            fontFamily: "'Plus Jakarta Sans', sans-serif",
                          }}>
                            Saved ✓
                          </span>
                        )}
                      </button>
                    )}
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
