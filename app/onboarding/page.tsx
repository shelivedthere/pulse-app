'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function OnboardingPage() {
  const router = useRouter()
  const [orgName, setOrgName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const name = orgName.trim()
    if (!name) {
      setError('Organization name is required.')
      return
    }

    setError(null)
    setLoading(true)
    console.log('[onboarding] Starting org creation for:', name)

    try {
      // Single API call — the route handler uses the service role key
      // so it creates the org, links the profile, and seeds the full
      // 18-item template in one atomic sequence with no RLS edge cases.
      const res = await fetch('/api/onboarding/create-org', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orgName: name }),
      })

      const data = await res.json() as { orgId?: string; templateId?: string; error?: string }

      if (!res.ok) {
        console.error('[onboarding] create-org failed — HTTP', res.status, data.error)
        setError(data.error ?? 'Failed to set up your organization. Please try again.')
        setLoading(false)
        return
      }

      console.log('[onboarding] OK — org:', data.orgId, '| template:', data.templateId)
      router.push('/dashboard')
    } catch (err) {
      console.error('[onboarding] Unexpected error:', err)
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#f9fafb',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem 1rem',
        fontFamily: "'Plus Jakarta Sans', sans-serif",
      }}
    >
      {/* Card */}
      <div
        style={{
          width: '100%',
          maxWidth: '560px',
          background: '#FFFFFF',
          borderRadius: '1rem',
          boxShadow: '0 4px 24px rgba(45, 50, 114, 0.08), 0 1px 4px rgba(45, 50, 114, 0.06)',
          padding: '2.5rem 2.5rem 2rem',
        }}
      >
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
          <a href="/" style={{ textDecoration: 'none', display: 'inline-block' }}>
            <span
              style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontWeight: 800,
                fontSize: '1.5rem',
                letterSpacing: '-0.02em',
                color: '#2D3272',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '2px',
              }}
            >
              Pulse
              <span
                style={{
                  display: 'inline-block',
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: '#F5D800',
                  marginLeft: '1px',
                  marginBottom: '2px',
                  flexShrink: 0,
                }}
              />
            </span>
          </a>
        </div>

        {/* Step indicator */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.5rem',
            marginBottom: '2rem',
          }}
        >
          <p
            style={{
              color: '#5B7FA6',
              fontSize: '0.8125rem',
              fontWeight: 500,
              margin: 0,
            }}
          >
            Step 1 of 2
          </p>
          <div style={{ display: 'flex', gap: '0.375rem', alignItems: 'center' }}>
            <span
              style={{
                display: 'inline-block',
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                background: '#2D8FBF',
              }}
            />
            <span
              style={{
                display: 'inline-block',
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                background: '#e5e7eb',
              }}
            />
          </div>
        </div>

        {/* Heading */}
        <h1
          style={{
            color: '#2D3272',
            fontWeight: 800,
            fontSize: '1.625rem',
            letterSpacing: '-0.02em',
            marginBottom: '0.5rem',
            textAlign: 'center',
          }}
        >
          Let&apos;s set up your workspace
        </h1>
        <p
          style={{
            color: '#5B7FA6',
            fontSize: '0.9375rem',
            textAlign: 'center',
            marginBottom: '2rem',
            lineHeight: 1.5,
          }}
        >
          This takes less than 2 minutes.{' '}
          <span style={{ display: 'inline' }}>You can change everything later.</span>
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {/* Label + helper */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginBottom: '0.25rem' }}>
            <label
              htmlFor="orgName"
              style={{
                color: '#2D3272',
                fontWeight: 600,
                fontSize: '0.9375rem',
                fontFamily: "'Plus Jakarta Sans', sans-serif",
              }}
            >
              Organization name
            </label>
            <p
              style={{
                color: '#5B7FA6',
                fontSize: '0.8125rem',
                margin: 0,
                lineHeight: 1.5,
              }}
            >
              This is usually your company or site name — e.g. Acme Corp, San Diego Plant
            </p>
          </div>

          {/* Input */}
          <input
            id="orgName"
            type="text"
            autoFocus
            required
            value={orgName}
            onChange={e => {
              setOrgName(e.target.value)
              if (error) setError(null)
            }}
            placeholder="e.g. Acme Manufacturing"
            style={{
              width: '100%',
              borderRadius: '0.5rem',
              border: '1.5px solid #e5e7eb',
              padding: '0.875rem 1rem',
              fontSize: '1rem',
              color: '#252850',
              outline: 'none',
              fontFamily: "'Inter', sans-serif",
              boxSizing: 'border-box',
              transition: 'border-color 0.15s',
            }}
            onFocus={e => (e.currentTarget.style.borderColor = '#2D8FBF')}
            onBlur={e => (e.currentTarget.style.borderColor = '#e5e7eb')}
          />

          {/* Error */}
          {error && (
            <p
              style={{
                fontSize: '0.875rem',
                borderRadius: '0.5rem',
                background: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#dc2626',
                padding: '0.75rem 1rem',
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                margin: 0,
              }}
            >
              {error}
            </p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              borderRadius: '0.5rem',
              padding: '0 1rem',
              minHeight: '52px',
              background: loading ? '#5B7FA6' : '#2D8FBF',
              color: '#FFFFFF',
              fontWeight: 700,
              fontSize: '1rem',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              marginTop: '1.5rem',
              transition: 'background 0.15s, opacity 0.15s',
            }}
          >
            {loading ? 'Setting up…' : 'Continue →'}
          </button>
        </form>

        {/* Security note */}
        <p
          style={{
            textAlign: 'center',
            fontSize: '0.8125rem',
            color: '#9ca3af',
            marginTop: '1.5rem',
            marginBottom: 0,
            lineHeight: 1.5,
          }}
        >
          🔒 Your data is private and secure. Only your team can see your organization.
        </p>
      </div>

      {/* What's next preview */}
      <div
        style={{
          marginTop: '2rem',
          textAlign: 'center',
          maxWidth: '560px',
          width: '100%',
          padding: '0 0.5rem',
        }}
      >
        <p
          style={{
            color: '#9ca3af',
            fontSize: '0.8125rem',
            marginBottom: '0.625rem',
            fontFamily: "'Plus Jakarta Sans', sans-serif",
          }}
        >
          After this you&apos;ll:
        </p>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.375rem',
          }}
        >
          {[
            'Add your first work area',
            'Review your 6S audit template',
            'Conduct your first audit',
          ].map((step) => (
            <p
              key={step}
              style={{
                color: '#5B7FA6',
                fontSize: '0.8125rem',
                margin: 0,
                fontFamily: "'Plus Jakarta Sans', sans-serif",
              }}
            >
              → {step}
            </p>
          ))}
        </div>
      </div>
    </div>
  )
}
