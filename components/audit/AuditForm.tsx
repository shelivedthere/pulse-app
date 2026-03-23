'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { CATEGORIES } from '@/lib/constants'

type AuditItem = {
  id: string
  category: string
  description: string
  sort_order: number
}

type ScoreValue = 'pass' | 'partial' | 'fail'

type ItemScore = {
  score: ScoreValue
  note: string
}

type Scores = Record<string, ItemScore>

interface Props {
  areaId: string
  orgId: string
  userId: string
  areaName: string
  items: AuditItem[]
}

const SCORE_STYLES: Record<
  ScoreValue,
  { active: string; activeText: string; inactive: string; inactiveText: string; label: string }
> = {
  pass: {
    active: '#2DA870',
    activeText: '#ffffff',
    inactive: 'rgba(45,168,112,0.15)',
    inactiveText: '#2DA870',
    label: 'Pass',
  },
  partial: {
    active: '#F5D800',
    activeText: '#1a1a1a',
    inactive: 'rgba(245,216,0,0.15)',
    inactiveText: '#92700A',
    label: 'Partial',
  },
  fail: {
    active: '#ef4444',
    activeText: '#ffffff',
    inactive: 'rgba(239,68,68,0.15)',
    inactiveText: '#ef4444',
    label: 'Fail',
  },
}

export default function AuditForm({ areaId, orgId, userId, items }: Props) {
  const router = useRouter()
  const [scores, setScores] = useState<Scores>({})
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [focusedNote, setFocusedNote] = useState<string | null>(null)

  const grouped = useMemo(() => {
    const map: Record<string, AuditItem[]> = {}
    for (const cat of CATEGORIES) map[cat] = []
    for (const item of items) {
      if (map[item.category]) map[item.category].push(item)
    }
    return map
  }, [items])

  const scoredCount = Object.keys(scores).length
  const totalCount = items.length
  const allScored = scoredCount === totalCount
  const remaining = totalCount - scoredCount
  const progressPct = totalCount > 0 ? (scoredCount / totalCount) * 100 : 0

  function setScore(itemId: string, score: ScoreValue) {
    setScores(prev => ({
      ...prev,
      [itemId]: { score, note: prev[itemId]?.note ?? '' },
    }))
  }

  function setNote(itemId: string, note: string) {
    setScores(prev => ({
      ...prev,
      [itemId]: { score: prev[itemId]?.score ?? 'fail', note },
    }))
  }

  async function handleSubmit() {
    if (!allScored) {
      setError(`Please score all ${totalCount} items before submitting.`)
      return
    }

    setError(null)
    setSubmitting(true)

    try {
      const payload = {
        areaId,
        orgId,
        userId,
        scores: items.map(item => ({
          templateItemId: item.id,
          score: scores[item.id].score,
          note: scores[item.id].note || null,
          description: item.description,
          category: item.category,
        })),
      }

      const res = await fetch('/api/audit/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError((data as { error?: string }).error ?? 'Failed to submit audit. Please try again.')
        return
      }

      const { auditId } = await res.json() as { auditId: string }
      router.push(`/audit/${areaId}/complete?auditId=${auditId}`)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', paddingBottom: '9rem' }}>

      {/* Progress bar */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: '12px',
          border: '1px solid #e8edf2',
          boxShadow: '0 1px 4px rgba(45,50,114,0.06)',
          padding: '16px 20px',
        }}
      >
        <div
          style={{
            height: '8px',
            borderRadius: '999px',
            background: '#EBF0F8',
            overflow: 'hidden',
            marginBottom: '10px',
          }}
        >
          <div
            style={{
              height: '100%',
              borderRadius: '999px',
              background: allScored ? '#2DA870' : '#2D8FBF',
              width: `${progressPct}%`,
              transition: 'width 0.3s ease',
            }}
          />
        </div>
        <p
          style={{
            fontSize: '13px',
            fontWeight: 600,
            color: '#5B7FA6',
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            margin: 0,
          }}
        >
          {scoredCount} of {totalCount} items scored
        </p>
      </div>

      {/* Category sections */}
      {CATEGORIES.map(category => {
        const catItems = grouped[category]
        if (!catItems || catItems.length === 0) return null

        return (
          <div
            key={category}
            style={{
              background: '#ffffff',
              borderRadius: '12px',
              border: '1px solid #e8edf2',
              boxShadow: '0 1px 4px rgba(45,50,114,0.06)',
              overflow: 'hidden',
            }}
          >
            {/* Category header */}
            <div
              style={{
                padding: '12px 20px',
                background: '#F5F7FA',
                borderBottom: '1px solid #e8edf2',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
              }}
            >
              <h2
                style={{
                  margin: 0,
                  fontSize: '14px',
                  fontWeight: 700,
                  color: '#2D3272',
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                }}
              >
                {category}
              </h2>
              <span
                style={{
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#5B7FA6',
                  background: '#e8edf2',
                  borderRadius: '999px',
                  padding: '2px 8px',
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  whiteSpace: 'nowrap',
                }}
              >
                {catItems.length} {catItems.length === 1 ? 'item' : 'items'}
              </span>
            </div>

            {/* Items */}
            {catItems.map((item, idx) => {
              const scored = scores[item.id]
              const selected = scored?.score
              const isNoteActive = selected === 'partial' || selected === 'fail'

              return (
                <div
                  key={item.id}
                  style={{
                    padding: '16px 20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    background: idx % 2 === 0 ? '#ffffff' : '#f9fafb',
                    borderTop: idx === 0 ? 'none' : '1px solid #f0f2f5',
                  }}
                >
                  {/* Item description */}
                  <p
                    style={{
                      margin: 0,
                      fontSize: '14px',
                      lineHeight: '1.45',
                      color: '#252850',
                      fontFamily: "'Inter', sans-serif",
                    }}
                  >
                    {item.description}
                  </p>

                  {/* Pass / Partial / Fail buttons */}
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {(['pass', 'partial', 'fail'] as ScoreValue[]).map(val => {
                      const s = SCORE_STYLES[val]
                      const isSelected = selected === val

                      return (
                        <button
                          key={val}
                          onClick={() => setScore(item.id, val)}
                          style={{
                            flex: 1,
                            minHeight: '52px',
                            borderRadius: '8px',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: 600,
                            fontFamily: "'Plus Jakarta Sans', sans-serif",
                            background: isSelected ? s.active : s.inactive,
                            color: isSelected ? s.activeText : s.inactiveText,
                            transition: 'background 0.15s ease, color 0.15s ease',
                          }}
                        >
                          {s.label}
                        </button>
                      )
                    })}
                  </div>

                  {/* Note field — visible for partial or fail */}
                  {isNoteActive && (
                    <textarea
                      value={scored?.note ?? ''}
                      onChange={e => setNote(item.id, e.target.value)}
                      onFocus={() => setFocusedNote(item.id)}
                      onBlur={() => setFocusedNote(null)}
                      placeholder="Describe the finding..."
                      rows={3}
                      style={{
                        width: '100%',
                        borderRadius: '8px',
                        border: focusedNote === item.id
                          ? '1.5px solid #2D8FBF'
                          : '1.5px solid #d1dae6',
                        padding: '10px 12px',
                        fontSize: '14px',
                        color: '#252850',
                        fontFamily: "'Inter', sans-serif",
                        resize: 'none',
                        outline: 'none',
                        boxSizing: 'border-box',
                        background: '#ffffff',
                        transition: 'border-color 0.15s ease',
                        boxShadow: focusedNote === item.id
                          ? '0 0 0 3px rgba(45,143,191,0.15)'
                          : 'none',
                      }}
                    />
                  )}
                </div>
              )
            })}
          </div>
        )
      })}

      {/* Sticky submit bar */}
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          background: '#ffffff',
          boxShadow: '0 -2px 8px rgba(0,0,0,0.08)',
          padding: '12px 16px calc(12px + env(safe-area-inset-bottom))',
          zIndex: 40,
        }}
      >
        <div style={{ maxWidth: '672px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {error && (
            <p
              style={{
                fontSize: '13px',
                color: '#ef4444',
                textAlign: 'center',
                margin: 0,
                fontFamily: "'Plus Jakarta Sans', sans-serif",
              }}
            >
              {error}
            </p>
          )}
          <button
            onClick={handleSubmit}
            disabled={submitting || !allScored}
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: '12px',
              border: 'none',
              fontSize: '14px',
              fontWeight: 700,
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              cursor: allScored && !submitting ? 'pointer' : 'not-allowed',
              background: allScored ? '#2D8FBF' : '#B0B8C9',
              color: '#ffffff',
              opacity: submitting ? 0.7 : 1,
              transition: 'background 0.2s ease',
            }}
          >
            {submitting
              ? 'Submitting…'
              : allScored
              ? 'Submit Audit'
              : `Score ${remaining} more item${remaining !== 1 ? 's' : ''} to submit`}
          </button>
        </div>
      </div>
    </div>
  )
}
