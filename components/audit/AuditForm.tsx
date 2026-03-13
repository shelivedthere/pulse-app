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

const SCORE_STYLES: Record<ScoreValue, { active: string; activeText: string; inactive: string; inactiveText: string; label: string }> = {
  pass:    { active: '#2DA870', activeText: '#fff', inactive: '#EBF6F0', inactiveText: '#2DA870', label: 'Pass' },
  partial: { active: '#F5A623', activeText: '#fff', inactive: '#FEF3E2', inactiveText: '#D4860B', label: 'Partial' },
  fail:    { active: '#E53935', activeText: '#fff', inactive: '#FDECEA', inactiveText: '#C62828', label: 'Fail' },
}

export default function AuditForm({ areaId, orgId, userId, items }: Props) {
  const router = useRouter()
  const [scores, setScores] = useState<Scores>({})
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
    <div className="flex flex-col gap-4 pb-28">
      {/* Progress bar */}
      <div className="bg-white rounded-xl border border-[#e8edf2] shadow-sm px-5 py-4">
        <div className="flex items-center justify-between mb-2">
          <span
            className="text-sm font-semibold"
            style={{ color: '#2D3272', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            Progress
          </span>
          <span className="text-sm font-semibold" style={{ color: '#5B7FA6' }}>
            {scoredCount} / {totalCount}
          </span>
        </div>
        <div className="h-2 rounded-full overflow-hidden" style={{ background: '#EBF0F8' }}>
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{
              width: `${totalCount > 0 ? (scoredCount / totalCount) * 100 : 0}%`,
              background: allScored ? '#2DA870' : '#2D8FBF',
            }}
          />
        </div>
      </div>

      {/* Category sections */}
      {CATEGORIES.map(category => {
        const catItems = grouped[category]
        if (!catItems || catItems.length === 0) return null

        return (
          <div
            key={category}
            className="bg-white rounded-xl border border-[#e8edf2] shadow-sm overflow-hidden"
          >
            {/* Category header */}
            <div
              className="px-5 py-3 border-b border-[#f0f2f5]"
              style={{ background: '#F5F7FA' }}
            >
              <h2
                className="text-sm font-bold"
                style={{ color: '#2D3272', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                {category}
              </h2>
            </div>

            {/* Items */}
            <div className="divide-y divide-[#f0f2f5]">
              {catItems.map(item => {
                const scored = scores[item.id]
                const selected = scored?.score

                return (
                  <div key={item.id} className="px-5 py-4 flex flex-col gap-3">
                    {/* Item description */}
                    <p
                      className="text-sm leading-snug"
                      style={{ color: '#252850' }}
                    >
                      {item.description}
                    </p>

                    {/* Pass / Partial / Fail buttons */}
                    <div className="flex gap-2">
                      {(['pass', 'partial', 'fail'] as ScoreValue[]).map(val => {
                        const s = SCORE_STYLES[val]
                        const isSelected = selected === val

                        return (
                          <button
                            key={val}
                            onClick={() => setScore(item.id, val)}
                            className="flex-1 rounded-lg text-sm font-semibold transition-all"
                            style={{
                              minHeight: '44px',
                              background: isSelected ? s.active : s.inactive,
                              color: isSelected ? s.activeText : s.inactiveText,
                              fontFamily: "'Plus Jakarta Sans', sans-serif",
                            }}
                          >
                            {s.label}
                          </button>
                        )
                      })}
                    </div>

                    {/* Note field — visible for partial or fail */}
                    {(selected === 'partial' || selected === 'fail') && (
                      <textarea
                        value={scored?.note ?? ''}
                        onChange={e => setNote(item.id, e.target.value)}
                        placeholder="Finding note — what did you observe? (helps generate better action items)"
                        rows={2}
                        className="w-full rounded-lg border border-[#d1dae6] px-3 py-2 text-sm outline-none transition focus:border-[#2D8FBF] focus:ring-2 focus:ring-[#2D8FBF]/20 resize-none"
                        style={{ color: '#252850', fontFamily: "'Inter', sans-serif" }}
                      />
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}

      {/* Sticky submit bar */}
      <div
        className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#e8edf2] px-4 py-4 z-40"
        style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}
      >
        <div className="max-w-2xl mx-auto flex flex-col gap-2">
          {error && (
            <p className="text-sm text-red-600 text-center">{error}</p>
          )}
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full py-3.5 rounded-xl text-sm font-bold text-white transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            style={{
              background: allScored ? '#2D8FBF' : '#B0B8C9',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
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
