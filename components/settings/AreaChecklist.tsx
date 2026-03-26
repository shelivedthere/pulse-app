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
            <div
              key={category}
              style={{
                background: '#ffffff',
                borderRadius: '12px',
                border: '1px solid #e8edf2',
                boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
              }}
            >
              {/* Category header */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 20px',
                  borderBottom: '1px solid #f0f2f5',
                  background: '#F5F7FA',
                  borderTopLeftRadius: '12px',
                  borderTopRightRadius: '12px',
                }}
              >
                <h3
                  style={{ fontSize: '13px', fontWeight: 700, color: '#2D3272', fontFamily: "'Plus Jakarta Sans', sans-serif", margin: 0 }}
                >
                  {category}
                </h3>
                <span style={{ fontSize: '11px', color: '#5B7FA6', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  {activeInCat}/{catItems.length} active
                </span>
              </div>

              {/* Items with toggles */}
              <div>
                {catItems.map((item, idx) => (
                  <div
                    key={item.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      width: '100%',
                      padding: '12px 20px',
                      gap: '16px',
                      boxSizing: 'border-box',
                      borderBottom: idx < catItems.length - 1 ? '1px solid #f0f2f5' : 'none',
                    }}
                  >
                    <span
                      style={{
                        fontSize: '14px',
                        color: item.is_active ? '#252850' : '#B0B8C9',
                        flex: 1,
                        minWidth: 0,
                      }}
                    >
                      {item.description}
                    </span>
                    {/* Toggle switch */}
                    <div
                      onClick={() => !togglingId && handleToggle(item.id, item.is_active)}
                      style={{
                        width: '44px',
                        height: '24px',
                        backgroundColor: item.is_active ? '#2D8FBF' : '#9ca3af',
                        borderRadius: '12px',
                        cursor: togglingId === item.id ? 'not-allowed' : 'pointer',
                        position: 'relative',
                        flexShrink: 0,
                        opacity: togglingId === item.id ? 0.5 : 1,
                      }}
                    >
                      <div
                        style={{
                          position: 'absolute',
                          top: '2px',
                          left: item.is_active ? '22px' : '2px',
                          width: '20px',
                          height: '20px',
                          backgroundColor: 'white',
                          borderRadius: '50%',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                        }}
                      />
                    </div>
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
