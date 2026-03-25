'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

const DISMISSED_KEY = 'pulse_template_nudge_dismissed'

export default function TemplateNudge() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const dismissed = localStorage.getItem(DISMISSED_KEY)
    if (!dismissed) setVisible(true)
  }, [])

  function dismiss() {
    localStorage.setItem(DISMISSED_KEY, '1')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '1rem',
        background: 'rgba(45, 143, 191, 0.08)',
        border: '1px solid rgba(45, 143, 191, 0.3)',
        borderRadius: '0.75rem',
        padding: '1.25rem 1.5rem',
        marginBottom: '1.5rem',
        position: 'relative',
        flexWrap: 'wrap',
      }}
    >
      {/* Icon */}
      <div style={{ fontSize: '2rem', lineHeight: 1, flexShrink: 0, marginTop: '2px' }}>
        📋
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: '200px' }}>
        <p
          style={{
            color: '#2D3272',
            fontWeight: 600,
            fontSize: '0.9375rem',
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            marginBottom: '0.375rem',
          }}
        >
          Review your standard audit template first
        </p>
        <p
          style={{
            color: '#5B7FA6',
            fontSize: '0.875rem',
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            lineHeight: 1.5,
            margin: 0,
          }}
        >
          Your default 6S checklist is ready. Take a moment to review and customize it before your first audit.
        </p>
      </div>

      {/* Buttons */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          flexShrink: 0,
          flexWrap: 'wrap',
        }}
      >
        <Link
          href="/settings?tab=template"
          style={{
            padding: '0.5rem 1rem',
            borderRadius: '0.5rem',
            background: '#2D8FBF',
            color: '#FFFFFF',
            fontWeight: 600,
            fontSize: '0.875rem',
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            textDecoration: 'none',
            whiteSpace: 'nowrap',
          }}
        >
          Review Template →
        </Link>
        <button
          onClick={dismiss}
          style={{
            background: 'none',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
            color: '#5B7FA6',
            fontSize: '0.875rem',
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            whiteSpace: 'nowrap',
          }}
        >
          Skip for now
        </button>
      </div>

      {/* X dismiss button */}
      <button
        onClick={dismiss}
        aria-label="Dismiss"
        style={{
          position: 'absolute',
          top: '0.75rem',
          right: '0.75rem',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: '#5B7FA6',
          fontSize: '1rem',
          lineHeight: 1,
          padding: '2px',
        }}
      >
        ✕
      </button>
    </div>
  )
}
