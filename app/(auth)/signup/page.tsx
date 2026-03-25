'use client'

import { Suspense, useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function SignupPage() {
  return (
    <Suspense>
      <SignupForm />
    </Suspense>
  )
}

function SignupForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const inviteToken = searchParams.get('invite')
  const inviteEmail = searchParams.get('email') ?? ''

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState(inviteEmail)
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (inviteEmail) setEmail(inviteEmail)
  }, [inviteEmail])

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = createClient()

    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
      },
    })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    // Update the profile with full_name (trigger creates the row, we patch the name)
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      await supabase
        .from('profiles')
        .update({ full_name: fullName })
        .eq('id', user.id)
    }

    // If signing up via invite, go to the invite acceptance page
    if (inviteToken) {
      router.push(`/invite/${inviteToken}`)
    } else {
      // New users always go to /onboarding to create their organization
      router.push('/onboarding')
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        minHeight: '100vh',
        fontFamily: "'Plus Jakarta Sans', sans-serif",
      }}
    >
      {/* LEFT PANEL */}
      <div
        style={{
          display: 'none',
          width: '45%',
          flexShrink: 0,
          background: '#2D3272',
          padding: '3rem',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}
        className="left-panel"
      >
        {/* Logo */}
        <div>
          <a href="/" style={{ textDecoration: 'none', display: 'inline-block' }}>
            <span
              style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontWeight: 800,
                fontSize: '1.5rem',
                letterSpacing: '-0.02em',
                color: '#FFFFFF',
                display: 'flex',
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

          {/* Headline */}
          <h2
            style={{
              color: '#FFFFFF',
              fontWeight: 800,
              fontSize: '2.25rem',
              lineHeight: 1.2,
              letterSpacing: '-0.02em',
              marginTop: '3.5rem',
              marginBottom: '1rem',
            }}
          >
            Take the vital signs of your operation.
          </h2>

          {/* Subtext */}
          <p
            style={{
              color: '#5BB8D4',
              fontSize: '1.0625rem',
              marginBottom: '2.5rem',
              lineHeight: 1.5,
            }}
          >
            The 6S audit tool built for the floor.
          </p>

          {/* Value props */}
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {[
              'Run structured 6S audits in under 5 minutes',
              'Track scores and trends across all your areas',
              'Close corrective actions that actually stick',
            ].map((bullet) => (
              <li
                key={bullet}
                style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}
              >
                <span
                  style={{
                    color: '#2DA870',
                    fontWeight: 700,
                    fontSize: '1.125rem',
                    lineHeight: 1.4,
                    flexShrink: 0,
                  }}
                >
                  ✓
                </span>
                <span
                  style={{
                    color: '#FFFFFF',
                    fontSize: '0.9375rem',
                    lineHeight: 1.5,
                    opacity: 0.92,
                  }}
                >
                  {bullet}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Social proof */}
        <p
          style={{
            color: '#5B7FA6',
            fontSize: '0.875rem',
            lineHeight: 1.6,
            marginTop: '3rem',
          }}
        >
          Used in labs, warehouses, and production floors.
        </p>
      </div>

      {/* RIGHT PANEL */}
      <div
        style={{
          flex: 1,
          background: '#FFFFFF',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '3rem 2rem',
          overflowY: 'auto',
        }}
      >
        <div style={{ width: '100%', maxWidth: '400px' }}>
          {/* Heading */}
          <h1
            style={{
              color: '#2D3272',
              fontWeight: 800,
              fontSize: '1.75rem',
              letterSpacing: '-0.02em',
              marginBottom: '0.375rem',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}
          >
            Create your account
          </h1>
          <p
            style={{
              color: '#5B7FA6',
              fontSize: '0.9375rem',
              marginBottom: '2rem',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}
          >
            {inviteToken
              ? 'Set up your account to accept the invitation.'
              : 'Start your free 6S audit program today'}
          </p>

          <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Full name */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
              <label
                htmlFor="fullName"
                style={{
                  color: '#2D3272',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                }}
              >
                Full name
              </label>
              <input
                id="fullName"
                type="text"
                autoComplete="name"
                required
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder="Abby OpEx Lead"
                style={{
                  width: '100%',
                  borderRadius: '0.5rem',
                  border: '1.5px solid #e5e7eb',
                  padding: '0.75rem 1rem',
                  fontSize: '0.9375rem',
                  color: '#252850',
                  outline: 'none',
                  fontFamily: "'Inter', sans-serif",
                  boxSizing: 'border-box',
                  transition: 'border-color 0.15s',
                }}
                onFocus={e => (e.currentTarget.style.borderColor = '#2D8FBF')}
                onBlur={e => (e.currentTarget.style.borderColor = '#e5e7eb')}
              />
            </div>

            {/* Email */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
              <label
                htmlFor="email"
                style={{
                  color: '#2D3272',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                }}
              >
                Email address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@company.com"
                readOnly={!!inviteToken && !!inviteEmail}
                style={{
                  width: '100%',
                  borderRadius: '0.5rem',
                  border: '1.5px solid #e5e7eb',
                  padding: '0.75rem 1rem',
                  fontSize: '0.9375rem',
                  color: '#252850',
                  outline: 'none',
                  fontFamily: "'Inter', sans-serif",
                  boxSizing: 'border-box',
                  background: inviteToken && inviteEmail ? '#f8f9fb' : '#FFFFFF',
                  transition: 'border-color 0.15s',
                }}
                onFocus={e => {
                  if (!(inviteToken && inviteEmail)) e.currentTarget.style.borderColor = '#2D8FBF'
                }}
                onBlur={e => (e.currentTarget.style.borderColor = '#e5e7eb')}
              />
              {inviteToken && inviteEmail && (
                <p style={{ color: '#5B7FA6', fontSize: '0.75rem' }}>
                  This email matches your invitation and cannot be changed.
                </p>
              )}
            </div>

            {/* Password */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
              <label
                htmlFor="password"
                style={{
                  color: '#2D3272',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                }}
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                style={{
                  width: '100%',
                  borderRadius: '0.5rem',
                  border: '1.5px solid #e5e7eb',
                  padding: '0.75rem 1rem',
                  fontSize: '0.9375rem',
                  color: '#252850',
                  outline: 'none',
                  fontFamily: "'Inter', sans-serif",
                  boxSizing: 'border-box',
                  transition: 'border-color 0.15s',
                }}
                onFocus={e => (e.currentTarget.style.borderColor = '#2D8FBF')}
                onBlur={e => (e.currentTarget.style.borderColor = '#e5e7eb')}
              />
            </div>

            {error && (
              <p
                style={{
                  fontSize: '0.875rem',
                  borderRadius: '0.5rem',
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  color: '#dc2626',
                  padding: '0.75rem 1rem',
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
                transition: 'background 0.15s, opacity 0.15s',
              }}
            >
              {loading ? 'Creating account…' : 'Create Account'}
            </button>

            {/* Divider */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                margin: '0.25rem 0',
              }}
            >
              <div style={{ flex: 1, height: '1px', background: '#e5e7eb' }} />
              <span style={{ color: '#9ca3af', fontSize: '0.8125rem', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                or
              </span>
              <div style={{ flex: 1, height: '1px', background: '#e5e7eb' }} />
            </div>

            {/* Sign in link */}
            <p
              style={{
                textAlign: 'center',
                fontSize: '0.9375rem',
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                color: '#5B7FA6',
                margin: 0,
              }}
            >
              Already have an account?{' '}
              <Link
                href={inviteToken ? `/login?redirect=/invite/${inviteToken}` : '/login'}
                style={{ color: '#2D8FBF', fontWeight: 600, textDecoration: 'none' }}
              >
                Sign in →
              </Link>
            </p>
          </form>
        </div>
      </div>

      {/* Responsive styles */}
      <style>{`
        @media (min-width: 768px) {
          .left-panel {
            display: flex !important;
          }
        }
      `}</style>
    </div>
  )
}
