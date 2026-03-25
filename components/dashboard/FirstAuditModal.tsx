'use client'

import Link from 'next/link'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

const SEEN_KEY = 'pulse_first_audit_seen'

interface Props {
  auditHref: string
  onClose: () => void
}

export default function FirstAuditModal({ auditHref, onClose }: Props) {
  const router = useRouter()

  // Mark as seen as soon as modal is shown
  useEffect(() => {
    localStorage.setItem(SEEN_KEY, '1')
  }, [])

  function handleStartAnyway() {
    onClose()
    router.push(auditHref)
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        background: 'rgba(37, 40, 80, 0.5)',
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: '0.875rem',
          boxShadow: '0 20px 60px rgba(45, 50, 114, 0.18), 0 4px 16px rgba(45, 50, 114, 0.1)',
          padding: '2rem',
          width: '100%',
          maxWidth: '480px',
          position: 'relative',
          fontFamily: "'Plus Jakarta Sans', sans-serif",
        }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          aria-label="Close"
          style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: '#5B7FA6',
            fontSize: '1rem',
            lineHeight: 1,
            padding: '4px',
          }}
        >
          ✕
        </button>

        {/* Icon */}
        <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>📋</div>

        {/* Title */}
        <h2
          style={{
            color: '#2D3272',
            fontWeight: 800,
            fontSize: '1.25rem',
            letterSpacing: '-0.01em',
            marginBottom: '0.625rem',
          }}
        >
          Before your first audit
        </h2>

        {/* Body */}
        <p
          style={{
            color: '#5B7FA6',
            fontSize: '0.9375rem',
            lineHeight: 1.6,
            marginBottom: '1.75rem',
          }}
        >
          Your default 6S checklist is ready. We recommend reviewing it before you start
          to make sure it fits your area.
        </p>

        {/* Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
          <Link
            href="/settings?tab=template"
            onClick={onClose}
            style={{
              display: 'block',
              textAlign: 'center',
              padding: '0.75rem 1.5rem',
              borderRadius: '0.5rem',
              background: '#2D8FBF',
              color: '#FFFFFF',
              fontWeight: 700,
              fontSize: '0.9375rem',
              textDecoration: 'none',
            }}
          >
            Review Template →
          </Link>
          <button
            onClick={handleStartAnyway}
            style={{
              display: 'block',
              width: '100%',
              padding: '0.75rem 1.5rem',
              borderRadius: '0.5rem',
              background: 'none',
              border: '1.5px solid #e5e7eb',
              color: '#252850',
              fontWeight: 600,
              fontSize: '0.9375rem',
              cursor: 'pointer',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}
          >
            Start Audit Anyway →
          </button>
        </div>

        {/* Fine print */}
        <p
          style={{
            textAlign: 'center',
            color: '#9ca3af',
            fontSize: '0.75rem',
            marginTop: '1rem',
            marginBottom: 0,
          }}
        >
          You won&apos;t see this again after your first audit.
        </p>
      </div>
    </div>
  )
}

/** Call this to decide whether to show the modal */
export function shouldShowFirstAuditModal(): boolean {
  if (typeof window === 'undefined') return false
  return !localStorage.getItem(SEEN_KEY)
}
