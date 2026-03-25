'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { ActionItem } from './ActionItemList'

type StatusValue = 'open' | 'in_progress' | 'closed'
type Area = { id: string; name: string }

interface Props {
  areas: Area[]
  orgId: string
  onAdd: (item: ActionItem) => void
  onClose: () => void
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  borderRadius: '0.5rem',
  border: '1.5px solid #e5e7eb',
  padding: '0.75rem 1rem',
  fontSize: '0.9375rem',
  color: '#252850',
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'border-color 0.15s',
}

const labelStyle: React.CSSProperties = {
  fontSize: '0.875rem',
  fontWeight: 600,
  color: '#2D3272',
  fontFamily: "'Plus Jakarta Sans', sans-serif",
}

export default function AddActionItemModal({ areas, orgId, onAdd, onClose }: Props) {
  const [areaId, setAreaId] = useState(areas[0]?.id ?? '')
  const [description, setDescription] = useState('')
  const [ownerName, setOwnerName] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [status, setStatus] = useState<StatusValue>('open')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleAdd() {
    if (!areaId) { setError('Please select an area.'); return }
    if (!description.trim()) { setError('Description is required.'); return }

    setSaving(true)
    setError(null)

    const supabase = createClient()
    const { data, error: insertError } = await supabase
      .from('action_items')
      .insert({
        org_id: orgId,
        area_id: areaId,
        description: description.trim(),
        owner_name: ownerName.trim() || null,
        due_date: dueDate || null,
        status,
        audit_id: null,
      })
      .select('id, description, owner_name, due_date, status, area_id, created_at, audit_id')
      .single()

    setSaving(false)

    if (insertError || !data) {
      setError('Failed to add action item. Please try again.')
      return
    }

    const area = areas.find(a => a.id === areaId)
    onAdd({ ...data, area_name: area?.name ?? 'Unknown' } as ActionItem)
    onClose()
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        background: 'rgba(37, 40, 80, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: '0.875rem',
          boxShadow: '0 20px 60px rgba(45, 50, 114, 0.18)',
          padding: '2rem',
          width: '100%',
          maxWidth: '480px',
          position: 'relative',
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          style={{
            position: 'absolute', top: '1rem', right: '1rem',
            background: 'none', border: 'none', cursor: 'pointer',
            color: '#5B7FA6', fontSize: '1rem', lineHeight: 1, padding: '4px',
          }}
        >✕</button>

        <h2 style={{
          color: '#2D3272', fontWeight: 800, fontSize: '1.25rem',
          letterSpacing: '-0.01em', margin: '0 0 1.5rem',
        }}>
          Add Action Item
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.125rem' }}>
          {/* Area */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
            <label style={labelStyle}>
              Area <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <select
              value={areaId}
              onChange={e => setAreaId(e.target.value)}
              style={{ ...inputStyle, fontFamily: "'Plus Jakarta Sans', sans-serif", cursor: 'pointer' }}
            >
              {areas.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>

          {/* Description */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
            <label style={labelStyle}>
              Description <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Describe the action needed..."
              rows={4}
              style={{ ...inputStyle, fontFamily: "'Inter', sans-serif", resize: 'none' }}
              onFocus={e => (e.currentTarget.style.borderColor = '#2D8FBF')}
              onBlur={e => (e.currentTarget.style.borderColor = '#e5e7eb')}
            />
          </div>

          {/* Owner */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
            <label style={labelStyle}>
              Owner{' '}
              <span style={{ color: '#9ca3af', fontWeight: 400, fontSize: '0.8125rem' }}>(optional)</span>
            </label>
            <input
              type="text"
              value={ownerName}
              onChange={e => setOwnerName(e.target.value)}
              placeholder="e.g. Jane Smith"
              style={{ ...inputStyle, fontFamily: "'Inter', sans-serif" }}
              onFocus={e => (e.currentTarget.style.borderColor = '#2D8FBF')}
              onBlur={e => (e.currentTarget.style.borderColor = '#e5e7eb')}
            />
          </div>

          {/* Due date */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
            <label style={labelStyle}>
              Due date{' '}
              <span style={{ color: '#9ca3af', fontWeight: 400, fontSize: '0.8125rem' }}>(optional)</span>
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={e => setDueDate(e.target.value)}
              style={{ ...inputStyle, fontFamily: "'Inter', sans-serif" }}
              onFocus={e => (e.currentTarget.style.borderColor = '#2D8FBF')}
              onBlur={e => (e.currentTarget.style.borderColor = '#e5e7eb')}
            />
          </div>

          {/* Status */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
            <label style={labelStyle}>Status</label>
            <select
              value={status}
              onChange={e => setStatus(e.target.value as StatusValue)}
              style={{ ...inputStyle, fontFamily: "'Plus Jakarta Sans', sans-serif", cursor: 'pointer' }}
            >
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="closed">Closed</option>
            </select>
          </div>

          {error && (
            <p style={{
              fontSize: '0.875rem', borderRadius: '0.5rem',
              background: '#fef2f2', border: '1px solid #fecaca',
              color: '#dc2626', padding: '0.75rem 1rem', margin: 0,
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}>{error}</p>
          )}

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.25rem' }}>
            <button
              onClick={handleAdd}
              disabled={saving}
              style={{
                flex: 1, padding: '0.75rem', borderRadius: '0.5rem',
                background: saving ? '#5B7FA6' : '#2D8FBF',
                color: '#FFFFFF', fontWeight: 700, fontSize: '0.9375rem',
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                border: 'none', cursor: saving ? 'not-allowed' : 'pointer',
                opacity: saving ? 0.7 : 1, transition: 'background 0.15s',
              }}
            >
              {saving ? 'Adding…' : 'Add Action Item'}
            </button>
            <button
              onClick={onClose}
              style={{
                padding: '0.75rem 1.25rem', borderRadius: '0.5rem',
                background: 'none', border: '1.5px solid #e5e7eb',
                color: '#5B7FA6', fontWeight: 600, fontSize: '0.9375rem',
                fontFamily: "'Plus Jakarta Sans', sans-serif", cursor: 'pointer',
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
