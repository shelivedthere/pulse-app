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
    <div className="flex flex-col gap-4">
      {CATEGORIES.map(category => {
        const catItems = groupedItems[category] ?? []
        const isFormOpen = activeCategory === category

        return (
          <div key={category} className="bg-white rounded-xl border border-[#e8edf2] shadow-sm overflow-hidden">
            {/* Category header */}
            <div
              className="flex items-center justify-between px-5 py-4 border-b border-[#f0f2f5]"
              style={{ background: '#F5F7FA' }}
            >
              <h3
                className="text-sm font-bold"
                style={{ color: '#2D3272', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                {category}
              </h3>
              <span
                className="text-xs font-semibold px-2 py-0.5 rounded-full"
                style={{ background: '#EBF6FA', color: '#2D8FBF', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                {catItems.length} {catItems.length === 1 ? 'item' : 'items'}
              </span>
            </div>

            {/* Items */}
            <div className="divide-y divide-[#f0f2f5]">
              {catItems.map(item => (
                <div key={item.id} className="flex items-center justify-between px-5 py-3 gap-4">
                  <span className="text-sm flex-1" style={{ color: '#252850' }}>
                    {item.description}
                  </span>
                  {item.is_default ? (
                    <span
                      className="text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 flex items-center gap-1"
                      style={{ background: '#f0f2f5', color: '#5B7FA6', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                    >
                      🔒 Default
                    </span>
                  ) : (
                    <button
                      onClick={() => handleDelete(item.id)}
                      disabled={deletingId === item.id}
                      className="text-sm flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-lg transition hover:bg-red-50 disabled:opacity-40"
                      style={{ color: '#B0B8C9' }}
                      aria-label={`Remove "${item.description}"`}
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}

              {catItems.length === 0 && !isFormOpen && (
                <div className="px-5 py-4 text-sm" style={{ color: '#5B7FA6' }}>
                  No items yet — add one below.
                </div>
              )}
            </div>

            {/* Add item form or button */}
            <div className="px-5 py-3 border-t border-[#f0f2f5]">
              {isFormOpen ? (
                <form
                  onSubmit={e => { e.preventDefault(); handleAddItem(category) }}
                  className="flex flex-col gap-2"
                >
                  <input
                    type="text"
                    autoFocus
                    value={newItemText}
                    onChange={e => { setNewItemText(e.target.value); setFormError(null) }}
                    placeholder="Describe the checklist item…"
                    className="w-full rounded-lg border border-[#d1dae6] px-3 py-2 text-sm outline-none transition focus:border-[#2D8FBF] focus:ring-2 focus:ring-[#2D8FBF]/20"
                    style={{ color: '#252850' }}
                  />
                  {formError && <p className="text-xs text-red-600">{formError}</p>}
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={saving}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white disabled:opacity-60"
                      style={{ background: '#2D8FBF', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                    >
                      {saving ? 'Adding…' : 'Add item'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveCategory(null)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-[#d1dae6]"
                      style={{ color: '#5B7FA6', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <button
                  onClick={() => openForm(category)}
                  className="text-xs font-semibold transition"
                  style={{ color: '#2D8FBF', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
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
