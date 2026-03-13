'use client'

import { useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { CATEGORIES } from '@/lib/constants'

type ItemWithActive = {
  id: string
  category: string
  description: string
  sort_order: number
  is_default: boolean
  is_active: boolean
}

interface Props {
  initialItems: ItemWithActive[]
  areaId: string
  orgId: string
}

export default function AreaChecklist({ initialItems, areaId, orgId }: Props) {
  const [items, setItems] = useState<ItemWithActive[]>(initialItems)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  const groupedItems = useMemo(() => {
    const groups: Record<string, ItemWithActive[]> = {}
    for (const cat of CATEGORIES) groups[cat] = []
    for (const item of items) {
      if (groups[item.category]) groups[item.category].push(item)
    }
    for (const cat of CATEGORIES) {
      groups[cat].sort((a, b) => a.sort_order - b.sort_order)
    }
    return groups
  }, [items])

  const activeCount = items.filter(i => i.is_active).length
  const totalCount = items.length

  async function handleToggle(itemId: string, currentActive: boolean) {
    const newActive = !currentActive

    // Optimistic update
    setItems(prev =>
      prev.map(item => (item.id === itemId ? { ...item, is_active: newActive } : item))
    )
    setTogglingId(itemId)

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('area_template_items')
        .upsert(
          { area_id: areaId, template_item_id: itemId, org_id: orgId, is_active: newActive },
          { onConflict: 'area_id,template_item_id' }
        )

      if (error) {
        // Revert on failure
        setItems(prev =>
          prev.map(item => (item.id === itemId ? { ...item, is_active: currentActive } : item))
        )
      }
    } catch {
      // Revert on failure
      setItems(prev =>
        prev.map(item => (item.id === itemId ? { ...item, is_active: currentActive } : item))
      )
    } finally {
      setTogglingId(null)
    }
  }

  return (
    <div>
      {/* Active count summary */}
      <div
        className="flex items-center gap-2 mb-6 px-4 py-3 rounded-lg"
        style={{ background: '#EBF6FA' }}
      >
        <span
          className="text-sm font-bold"
          style={{ color: '#2D8FBF', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
        >
          {activeCount} of {totalCount} items active
        </span>
        {activeCount < totalCount && (
          <span className="text-sm" style={{ color: '#5B7FA6' }}>
            — {totalCount - activeCount} hidden for this area
          </span>
        )}
      </div>

      {/* Categories */}
      <div className="flex flex-col gap-4">
        {CATEGORIES.map(category => {
          const catItems = groupedItems[category] ?? []
          const activeInCat = catItems.filter(i => i.is_active).length

          return (
            <div key={category} className="bg-white rounded-xl border border-[#e8edf2] shadow-sm overflow-hidden">
              {/* Category header */}
              <div
                className="flex items-center justify-between px-5 py-3 border-b border-[#f0f2f5]"
                style={{ background: '#F5F7FA' }}
              >
                <h3
                  className="text-sm font-bold"
                  style={{ color: '#2D3272', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                >
                  {category}
                </h3>
                <span className="text-xs" style={{ color: '#5B7FA6', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  {activeInCat}/{catItems.length} active
                </span>
              </div>

              {/* Items with toggles */}
              <div className="divide-y divide-[#f0f2f5]">
                {catItems.map(item => (
                  <div key={item.id} className="flex items-center justify-between px-5 py-3 gap-4">
                    <span
                      className="text-sm flex-1"
                      style={{ color: item.is_active ? '#252850' : '#B0B8C9' }}
                    >
                      {item.description}
                    </span>
                    {/* Toggle switch */}
                    <button
                      role="switch"
                      aria-checked={item.is_active}
                      onClick={() => handleToggle(item.id, item.is_active)}
                      disabled={togglingId === item.id}
                      className="relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors duration-200 focus:outline-none disabled:opacity-50"
                      style={{ background: item.is_active ? '#2D8FBF' : '#d1dae6' }}
                    >
                      <span
                        className="inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200"
                        style={{ transform: item.is_active ? 'translateX(20px)' : 'translateX(4px)' }}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
