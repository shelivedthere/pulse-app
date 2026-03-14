'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  token: string
}

export default function AcceptInviteButton({ token }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleAccept() {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/invite/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Failed to accept invitation. Please try again.')
        return
      }

      router.push('/dashboard')
      router.refresh()
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <button
        onClick={handleAccept}
        disabled={loading}
        className="px-6 py-3 rounded-xl text-sm font-bold text-white disabled:opacity-60"
        style={{ background: '#2D8FBF', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
      >
        {loading ? 'Accepting…' : 'Accept Invitation →'}
      </button>
      {error && (
        <p className="text-sm rounded-lg bg-red-50 border border-red-200 text-red-600 px-4 py-3">
          {error}
        </p>
      )}
    </div>
  )
}
