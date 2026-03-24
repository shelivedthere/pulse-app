'use client'

import { useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { CATEGORIES, type Category } from '@/lib/constants'

type TemplateItem = {
  id: string
  template_id: string
  org_id: string
  category: string
  description: string
  sort_order: number
  is_default: boolean
}

interface Props {
  initialItems: TemplateItem[]
  templateId: string
  orgId: string
}

export default function TemplateBuilder({ initialItems, templateId, orgId }: Props) {
  const [items, setItems] = useState<TemplateItem[]>(initialItems)
  const [activeCategory, setActiveCategory] = useState<Category | null>(null)
  const [newItemText, setNewItemText] = useState('')
  const [formError, setFormError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const groupedItems = useMemo(() => {
    const groups: Record<string, TemplateItem[]> = {}
    for (const cat of CATEGORIES) groups[cat] = []
    for (const item of items) {
      if (groups[item.category]) groups[item.category].push(item)
    }
    for (const cat of CATEGORIES) {
      groups[cat].sort((a, b) => a.sort_order - b.sort_order)
    }
    return groups
  }, [items])

  async function handleAddItem(category: Category) {
    const description = newItemText.trim()
    if (!description) {
      setFormError('Item description is required.')
      return
    }

    setFormError(null)
    setSaving(true)

    try {
      const supabase = createClient()
      const sortOrder = (groupedItems[category]?.length ?? 0) + 1

      const { data, error } = await supabase
        .from('template_items')
        .insert({ template_id: templateId, org_id: orgId, category, description, sort_order: sortOrder, is_default: false })
        .select()
        .single()

      if (error || !data) {
        setFormError('Failed to add item. Please try again.')
        return
      }

      setItems(prev => [...prev, data])
      setNewItemText('')
      setActiveCategory(null)
    } catch {
      setFormError('Something went wrong. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(itemId: string) {
    setDeletingId(itemId)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('template_items')
        .delete()
        .eq('id', itemId)

      if (error) return
      setItems(prev => prev.filter(i => i.id !== itemId))
    } finally {
      setDeletingId(null)
    }
  }

  function openForm(category: Category) {
    setActiveCategory(category)
    setNewItemText('')
    setFormError(null)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {CATEGORIES.map(category => {
        const catItems = groupedItems[category] ?? []
        const isFormOpen = activeCategory === category

        return (
          <div key={category} style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e8edf2', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
            {/* Category header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 20px',
                background: '#F5F7FA',
                borderBottom: '1px solid #f0f2f5',
              }}
            >
              <h3
                style={{
                  fontSize: '13px',
                  fontWeight: 700,
                  color: '#2D3272',
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  margin: 0,
                }}
              >
                {category}
              </h3>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  padding: '2px 10px',
                  borderRadius: '999px',
                  background: '#f3f4f6',
                  color: '#5B7FA6',
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                }}
              >
                {catItems.length} {catItems.length === 1 ? 'item' : 'items'}
              </span>
            </div>

            {/* Items */}
            <div style={{ borderTop: 'none' }}>
              {catItems.map(item => (
                <div
                  key={item.id}
                  className="hover:bg-[#fafbfc] transition-colors"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 20px',
                    gap: '16px',
                    borderBottom: '1px solid #f0f2f5',
                  }}
                >
                  <span style={{ fontSize: '13px', color: '#252850', flex: 1, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    {item.description}
                  </span>
                  {item.is_default ? (
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 600,
                        padding: '3px 10px',
                        borderRadius: '999px',
                        background: '#f3f4f6',
                        color: '#5B7FA6',
                        fontFamily: "'Plus Jakarta Sans', sans-serif",
                        flexShrink: 0,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      🔒 Default
                    </span>
                  ) : (
                    <button
                      onClick={() => handleDelete(item.id)}
                      disabled={deletingId === item.id}
                      className="hover:bg-red-50 transition-colors disabled:opacity-40"
                      style={{
                        flexShrink: 0,
                        width: '28px',
                        height: '28px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '8px',
                        border: 'none',
                        background: 'transparent',
                        cursor: 'pointer',
                        fontSize: '13px',
                        color: '#ef4444',
                      }}
                      aria-label={`Remove "${item.description}"`}
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}

              {catItems.length === 0 && !isFormOpen && (
                <div style={{ padding: '14px 20px', fontSize: '13px', color: '#5B7FA6', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  No items yet — add one below.
                </div>
              )}
            </div>

            {/* Add item form or button */}
            <div style={{ padding: '12px 20px', borderTop: '1px solid #f0f2f5' }}>
              {isFormOpen ? (
                <form
                  onSubmit={e => { e.preventDefault(); handleAddItem(category) }}
                  style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}
                >
                  <input
                    type="text"
                    autoFocus
                    value={newItemText}
                    onChange={e => { setNewItemText(e.target.value); setFormError(null) }}
                    placeholder="Describe the checklist item…"
                    className="outline-none focus:ring-2 focus:ring-[#2D8FBF]/20 focus:border-[#2D8FBF] transition"
                    style={{
                      width: '100%',
                      borderRadius: '8px',
                      border: '1px solid #d1dae6',
                      padding: '8px 12px',
                      fontSize: '13px',
                      color: '#252850',
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                      boxSizing: 'border-box',
                    }}
                  />
                  {formError && <p style={{ fontSize: '12px', color: '#ef4444', margin: 0 }}>{formError}</p>}
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      type="submit"
                      disabled={saving}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: 600,
                        color: '#ffffff',
                        background: '#2D8FBF',
                        border: 'none',
                        cursor: 'pointer',
                        fontFamily: "'Plus Jakarta Sans', sans-serif",
                        opacity: saving ? 0.6 : 1,
                      }}
                    >
                      {saving ? 'Adding…' : 'Add item'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveCategory(null)}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: 600,
                        color: '#5B7FA6',
                        background: 'transparent',
                        border: '1px solid #d1dae6',
                        cursor: 'pointer',
                        fontFamily: "'Plus Jakarta Sans', sans-serif",
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <button
                  onClick={() => openForm(category)}
                  style={{
                    fontSize: '13px',
                    fontWeight: 600,
                    color: '#2D8FBF',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 0,
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                  }}
                >
                  + Add item
                </button>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
