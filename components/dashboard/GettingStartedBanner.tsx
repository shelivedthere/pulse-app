'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Props {
  hasAreas: boolean
  hasAudit: boolean
  firstAreaId?: string
}

const DISMISS_KEY = 'pulse_getting_started_dismissed'

export default function GettingStartedBanner({ hasAreas, hasAudit, firstAreaId }: Props) {
  const [dismissed, setDismissed] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    setDismissed(localStorage.getItem(DISMISS_KEY) === 'true')
  }, [])

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, 'true')
    setDismissed(true)
  }

  if (!mounted || dismissed) return null

  const steps = [
    { label: 'Create your organization', done: true },
    { label: 'Add your first area', done: hasAreas },
    { label: 'Conduct your first audit', done: hasAudit },
  ]

  return (
    <div
      style={{
        background: 'linear-gradient(135deg, #F0F7FF 0%, #FFFBE6 100%)',
        border: '1px solid #C2DCF5',
        borderRadius: '12px',
        padding: '20px 24px',
        marginBottom: '32px',
        position: 'relative',
      }}
    >
      {/* Dismiss button */}
      <button
        onClick={dismiss}
        aria-label="Dismiss getting started"
        style={{
          position: 'absolute',
          top: '10px',
          right: '12px',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: '#5B7FA6',
          fontSize: '15px',
          lineHeight: 1,
          padding: '4px 6px',
          borderRadius: '4px',
        }}
      >
        ✕
      </button>

      <p
        style={{
          color: '#2D3272',
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          fontWeight: 800,
          fontSize: '14px',
          marginBottom: '12px',
          marginTop: 0,
        }}
      >
        Getting Started
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {steps.map(step => (
          <div
            key={step.label}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}
          >
            {step.done ? (
              <>
                <span
                  style={{
                    color: '#2DA870',
                    fontWeight: 700,
                    fontSize: '15px',
                    flexShrink: 0,
                  }}
                >
                  ✓
                </span>
                <span style={{ textDecoration: 'line-through', color: '#5B7FA6' }}>
                  {step.label}
                </span>
              </>
            ) : (
              <>
                <span
                  style={{
                    color: '#B0B8C9',
                    fontSize: '15px',
                    flexShrink: 0,
                  }}
                >
                  ☐
                </span>
                <span style={{ color: '#252850', fontWeight: 500 }}>{step.label}</span>
              </>
            )}
          </div>
        ))}
      </div>

      {/* CTA */}
      <div style={{ marginTop: '16px' }}>
        {!hasAreas && (
          <span
            style={{
              color: '#2D8FBF',
              fontSize: '13px',
              fontWeight: 600,
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}
          >
            Start by adding an area below ↓
          </span>
        )}
        {hasAreas && !hasAudit && firstAreaId && (
          <Link
            href={`/audit/${firstAreaId}`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              borderRadius: '8px',
              background: '#2D8FBF',
              color: '#ffffff',
              fontSize: '14px',
              fontWeight: 600,
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              textDecoration: 'none',
            }}
          >
            Start your first audit →
          </Link>
        )}
      </div>
    </div>
  )
}
