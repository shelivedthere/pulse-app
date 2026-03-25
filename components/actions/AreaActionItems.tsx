'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type StatusValue = 'open' | 'in_progress' | 'closed'

type AreaActionItem = {
  id: string
  description: string
  status: StatusValue
  audit_id: string | null
}

interface Props {
  initialItems: AreaActionItem[]
  isAdmin: boolean
}

function SourceBadge({ item, isEdited }: { item: AreaActionItem; isEdited: boolean }) {
  if (item.audit_id !== null) {
    return (
      <span style={{
        fontSize: '0.625rem', fontWeight: 700, padding: '2px 6px',
        borderRadius: '999px', background: 'rgba(91, 184, 212, 0.15)',
        color: '#5BB8D4', fontFamily: "'Plus Jakarta Sans', sans-serif",
        flexShrink: 0,
      }}>
        {isEdited ? '✨ AI · Edited' : '✨ AI'}
      </span>
    )
  }
  return (
    <span style={{
      fontSize: '0.625rem', fontWeight: 700, padding: '2px 6px',
      borderRadius: '999px', background: 'rgba(91, 127, 166, 0.1)',
      color: '#5B7FA6', fontFamily: "'Plus Jakarta Sans', sans-serif",
      flexShrink: 0,
    }}>
      Manual
    </span>
  )
}

export default function AreaActionItems({ initialItems, isAdmin }: Props) {
  const [items, setItems] = useState<AreaActionItem[]>(initialItems)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState('')
  const [editSaving, setEditSaving] = useState(false)
  const [editedIds, setEditedIds] = useState<Set<string>>(new Set())
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  function startEdit(item: AreaActionItem) {
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

  if (items.length === 0) {
    return (
      <p style={{
        fontSize: '14px', color: '#2DA870', fontWeight: 600,
        fontFamily: "'Plus Jakarta Sans', sans-serif", margin: 0,
      }}>
        ✓ No open action items for this area
      </p>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {items.map(item => {
        const isEditing = editingId === item.id
        const isConfirmingDelete = confirmDeleteId === item.id
        const isEdited = editedIds.has(item.id)
        const isProcessing = deletingId === item.id || editSaving && editingId === item.id

        return (
          <div
            key={item.id}
            style={{
              padding: '12px 16px',
              borderRadius: '10px',
              border: '1px solid #e8edf2',
              background: '#fafbfc',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              opacity: isProcessing ? 0.6 : 1,
              transition: 'opacity 0.15s',
            }}
          >
            {/* Top row */}
            <div style={{
              display: 'flex', alignItems: 'center',
              justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <SourceBadge item={item} isEdited={isEdited} />
                <span style={{
                  flexShrink: 0, fontSize: '11px', fontWeight: 700,
                  padding: '3px 10px', borderRadius: '999px',
                  background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444',
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  textTransform: 'capitalize',
                }}>
                  {item.status.replace('_', ' ')}
                </span>
              </div>

              {isAdmin && !isEditing && !isConfirmingDelete && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                  <button
                    onClick={() => startEdit(item)}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      fontSize: '0.75rem', color: '#2D8FBF',
                      padding: '3px 6px', borderRadius: '4px',
                      fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 600,
                    }}
                  >
                    ✏️ Edit
                  </button>
                  <button
                    onClick={() => { setConfirmDeleteId(item.id); setEditingId(null) }}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      fontSize: '0.875rem', color: '#ef4444',
                      padding: '3px 4px', borderRadius: '4px',
                    }}
                  >
                    🗑️
                  </button>
                </div>
              )}
            </div>

            {/* Description — read or edit */}
            {isEditing ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <textarea
                  value={editDraft}
                  onChange={e => setEditDraft(e.target.value)}
                  autoFocus
                  rows={3}
                  style={{
                    width: '100%', borderRadius: '8px', border: '1.5px solid #2D8FBF',
                    padding: '8px 10px', fontSize: '13px', color: '#252850',
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
                      padding: '5px 14px', borderRadius: '6px',
                      background: '#2D8FBF', color: '#ffffff',
                      fontWeight: 600, fontSize: '0.8125rem',
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
                      padding: '5px 14px', borderRadius: '6px',
                      background: 'none', border: 'none',
                      color: '#5B7FA6', fontWeight: 600, fontSize: '0.8125rem',
                      fontFamily: "'Plus Jakarta Sans', sans-serif", cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <p style={{
                fontSize: '13px', color: '#252850',
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                margin: 0, lineHeight: 1.5,
              }}>
                {item.description}
              </p>
            )}

            {/* Delete confirmation */}
            {isConfirmingDelete && (
              <div style={{
                borderRadius: '6px', background: '#fff5f5',
                border: '1px solid #fecaca', padding: '10px 12px',
                display: 'flex', flexDirection: 'column', gap: '8px',
              }}>
                <p style={{
                  fontSize: '0.8125rem', color: '#252850', margin: 0,
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                }}>
                  Delete this action item? This cannot be undone.
                </p>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => executeDelete(item.id)}
                    disabled={deletingId === item.id}
                    style={{
                      padding: '5px 14px', borderRadius: '6px',
                      background: '#ef4444', color: '#ffffff',
                      fontWeight: 600, fontSize: '0.8125rem',
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
                      padding: '5px 14px', borderRadius: '6px',
                      background: 'none', border: 'none',
                      color: '#5B7FA6', fontWeight: 600, fontSize: '0.8125rem',
                      fontFamily: "'Plus Jakarta Sans', sans-serif", cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
