'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  )
}

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const code = searchParams.get('code')

  const [ready, setReady] = useState(false)
  const [exchangeError, setExchangeError] = useState<string | null>(null)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (!code) {
      setExchangeError('Invalid or missing reset link. Please request a new one.')
      return
    }

    const supabase = createClient()
    supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
      if (error) {
        setExchangeError('This reset link has expired or is invalid. Please request a new one.')
      } else {
        setReady(true)
      }
    })
  }, [code])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }

    setLoading(true)
    const supabase = createClient()
    const { error: updateError } = await supabase.auth.updateUser({ password })
    setLoading(false)

    if (updateError) {
      setError(updateError.message)
    } else {
      setSuccess(true)
      setTimeout(() => router.push('/dashboard'), 2000)
    }
  }

  return (
    <div className="w-full max-w-md">
      {/* Logo */}
      <div className="text-center mb-8">
        <a href="/" className="inline-block">
          <span
            className="font-extrabold text-2xl tracking-tight"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: '#2D3272' }}
          >
            Pulse
            <span
              className="inline-block w-2.5 h-2.5 rounded-full ml-0.5 mb-0.5 align-middle"
              style={{ background: '#F5D800' }}
            />
          </span>
        </a>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-[#e8edf2] px-8 py-10">
        <h1
          className="text-2xl font-extrabold mb-1 tracking-tight"
          style={{ color: '#2D3272', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
        >
          Set new password
        </h1>

        {exchangeError ? (
          <div className="mt-4 flex flex-col gap-4">
            <p className="text-sm rounded-lg bg-red-50 border border-red-200 text-red-600 px-4 py-3">
              {exchangeError}
            </p>
            <a
              href="/login"
              className="text-sm font-semibold hover:underline"
              style={{ color: '#2D8FBF', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              Back to login
            </a>
          </div>
        ) : success ? (
          <p
            className="mt-4 text-sm"
            style={{ color: '#2DA870', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            Password updated! Redirecting to dashboard…
          </p>
        ) : ready ? (
          <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="password"
                className="text-sm font-semibold"
                style={{ color: '#2D3272', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                New password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-lg border border-[#d1dae6] px-4 py-3 text-sm outline-none transition focus:border-[#2D8FBF] focus:ring-2 focus:ring-[#2D8FBF]/20"
                style={{ color: '#252850', fontFamily: "'Inter', sans-serif" }}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="confirm"
                className="text-sm font-semibold"
                style={{ color: '#2D3272', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                Confirm new password
              </label>
              <input
                id="confirm"
                type="password"
                autoComplete="new-password"
                required
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-lg border border-[#d1dae6] px-4 py-3 text-sm outline-none transition focus:border-[#2D8FBF] focus:ring-2 focus:ring-[#2D8FBF]/20"
                style={{ color: '#252850', fontFamily: "'Inter', sans-serif" }}
              />
            </div>

            {error && (
              <p className="text-sm rounded-lg bg-red-50 border border-red-200 text-red-600 px-4 py-3">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg px-4 py-3 text-sm font-semibold text-white transition disabled:opacity-60 disabled:cursor-not-allowed"
              style={{
                background: loading ? '#5B7FA6' : '#2D8FBF',
                fontFamily: "'Plus Jakarta Sans', sans-serif",
              }}
            >
              {loading ? 'Updating…' : 'Update password'}
            </button>
          </form>
        ) : (
          <p
            className="mt-4 text-sm"
            style={{ color: '#5B7FA6', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            Verifying reset link…
          </p>
        )}
      </div>
    </div>
  )
}
