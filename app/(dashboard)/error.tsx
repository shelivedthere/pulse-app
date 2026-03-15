'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mb-5"
        style={{ background: '#FDECEA' }}
      >
        ⚠️
      </div>
      <h2
        className="text-xl font-extrabold mb-2"
        style={{ color: '#2D3272', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
      >
        Something went wrong
      </h2>
      <p className="text-sm mb-6 max-w-xs" style={{ color: '#5B7FA6' }}>
        We couldn&apos;t load this page. This is usually a temporary issue.
      </p>
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="px-4 py-2 rounded-lg text-sm font-semibold text-white"
          style={{ background: '#2D8FBF', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
        >
          Try again
        </button>
        <Link
          href="/dashboard"
          className="px-4 py-2 rounded-lg text-sm font-semibold border border-[#d1dae6]"
          style={{ color: '#2D3272', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  )
}
