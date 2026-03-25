'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirect')
  const notice = searchParams.get('notice')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const [showReset, setShowReset] = useState(false)
  const [resetEmail, setResetEmail] = useState('')
  const [resetSent, setResetSent] = useState(false)
  const [resetError, setResetError] = useState<string | null>(null)
  const [resetLoading, setResetLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = createClient()

    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('org_id')
        .eq('id', user.id)
        .single()

      if (redirectTo) {
        router.push(redirectTo)
      } else if (profile?.org_id) {
        router.push('/dashboard')
      } else {
        router.push('/onboarding')
      }
    } else {
      router.push('/onboarding')
    }
  }

  async function handleReset(e: React.FormEvent) {
    e.preventDefault()
    setResetError(null)
    setResetLoading(true)

    const supabase = createClient()
    const { error: resetErr } = await supabase.auth.resetPasswordForEmail(resetEmail, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    })

    setResetLoading(false)

    if (resetErr) {
      setResetError(resetErr.message)
    } else {
      setResetSent(true)
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
            Welcome back.
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
            Your 6S program is waiting.
          </p>

          {/* Value props */}
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {[
              'Your audit history is right where you left it',
              'Open action items are ready to close',
              'Your team is counting on you',
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
            Welcome back
          </h1>
          <p
            style={{
              color: '#5B7FA6',
              fontSize: '0.9375rem',
              marginBottom: '2rem',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}
          >
            Sign in to your Pulse account
          </p>

          {/* Session expired banner */}
          {notice === 'expired' && (
            <div
              style={{
                marginBottom: '1.5rem',
                borderRadius: '0.5rem',
                border: '1px solid #fde68a',
                padding: '0.75rem 1rem',
                fontSize: '0.875rem',
                fontWeight: 600,
                background: '#FEF9C3',
                color: '#854D0E',
                fontFamily: "'Plus Jakarta Sans', sans-serif",
              }}
            >
              Your session expired — please sign in again.
            </div>
          )}

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
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
                autoComplete="current-password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
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
              {/* Forgot password link — right-aligned */}
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => { setShowReset(!showReset); setResetError(null); setResetSent(false) }}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    cursor: 'pointer',
                    fontSize: '0.8125rem',
                    color: '#2D8FBF',
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                  }}
                >
                  Forgot your password?
                </button>
              </div>
            </div>

            {/* Password reset inline form */}
            {showReset && (
              <div
                style={{
                  borderRadius: '0.5rem',
                  border: '1.5px solid #e5e7eb',
                  background: '#f7f9fc',
                  padding: '1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                }}
              >
                {resetSent ? (
                  <p style={{ fontSize: '0.875rem', color: '#2DA870', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    Check your email for a password reset link.
                  </p>
                ) : (
                  <>
                    <p style={{ fontSize: '0.8125rem', color: '#5B7FA6', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                      Enter your email and we&apos;ll send you a reset link.
                    </p>
                    <input
                      type="email"
                      value={resetEmail}
                      onChange={e => setResetEmail(e.target.value)}
                      placeholder="you@company.com"
                      style={{
                        width: '100%',
                        borderRadius: '0.5rem',
                        border: '1.5px solid #e5e7eb',
                        padding: '0.625rem 0.875rem',
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
                    {resetError && (
                      <p style={{ fontSize: '0.8125rem', color: '#dc2626', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                        {resetError}
                      </p>
                    )}
                    <button
                      type="button"
                      onClick={handleReset}
                      disabled={resetLoading || !resetEmail}
                      style={{
                        width: '100%',
                        borderRadius: '0.5rem',
                        padding: '0.625rem 1rem',
                        background: '#2D8FBF',
                        color: '#FFFFFF',
                        fontWeight: 600,
                        fontSize: '0.9375rem',
                        fontFamily: "'Plus Jakarta Sans', sans-serif",
                        border: 'none',
                        cursor: resetLoading || !resetEmail ? 'not-allowed' : 'pointer',
                        opacity: resetLoading || !resetEmail ? 0.6 : 1,
                        transition: 'opacity 0.15s',
                      }}
                    >
                      {resetLoading ? 'Sending…' : 'Send reset link'}
                    </button>
                  </>
                )}
              </div>
            )}

            {/* Error message */}
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
              {loading ? 'Signing in…' : 'Sign In'}
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

            {/* Sign up link */}
            <p
              style={{
                textAlign: 'center',
                fontSize: '0.9375rem',
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                color: '#5B7FA6',
                margin: 0,
              }}
            >
              Don&apos;t have an account?{' '}
              <Link
                href="/signup"
                style={{ color: '#2D8FBF', fontWeight: 600, textDecoration: 'none' }}
              >
                Sign up free →
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
