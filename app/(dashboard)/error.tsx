'use client'

import { useEffect } from 'react'

const FONT = "'Plus Jakarta Sans', sans-serif"

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
    <div
      style={{
        maxWidth: '1120px',
        margin: '0 auto',
        padding: '40px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
      }}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: '16px',
          border: '1px solid #e8edf2',
          boxShadow: '0 2px 12px rgba(45,50,114,0.08)',
          padding: '40px 32px',
          textAlign: 'center',
          maxWidth: '400px',
          width: '100%',
        }}
      >
        <div
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '14px',
            background: '#FDECEA',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px',
            margin: '0 auto 20px',
          }}
        >
          ⚠️
        </div>
        <h2
          style={{
            fontSize: '20px',
            fontWeight: 800,
            color: '#2D3272',
            fontFamily: FONT,
            margin: '0 0 8px 0',
          }}
        >
          Something went wrong
        </h2>
        <p
          style={{
            fontSize: '14px',
            color: '#5B7FA6',
            fontFamily: FONT,
            margin: '0 0 24px 0',
            lineHeight: '1.6',
          }}
        >
          We couldn&apos;t load your data. Please try refreshing the page.
        </p>
        <button
          onClick={reset}
          style={{
            padding: '10px 24px',
            borderRadius: '10px',
            fontSize: '14px',
            fontWeight: 700,
            color: '#ffffff',
            background: '#2D8FBF',
            border: 'none',
            cursor: 'pointer',
            fontFamily: FONT,
          }}
        >
          Refresh
        </button>
      </div>
    </div>
  )
}
