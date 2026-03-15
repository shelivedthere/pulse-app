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

    // Determine redirect: first-time users (no org) go to /onboarding
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
        <p className="mt-2 text-sm" style={{ color: '#5B7FA6', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          Take the vital signs of your operation.
        </p>
      </div>

      {/* Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-[#e8edf2] px-8 py-10">
        <h1
          className="text-2xl font-extrabold mb-1 tracking-tight"
          style={{ color: '#2D3272', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
        >
          Welcome back
        </h1>
        <p className="text-sm mb-6" style={{ color: '#5B7FA6', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          Sign in to your Pulse account.
        </p>

        {notice === 'expired' && (
          <div
            className="mb-6 rounded-lg border px-4 py-3 text-sm"
            style={{ background: '#FFF8E6', borderColor: '#F5D800', color: '#252850', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            Your session expired — please sign in again.
          </div>
        )}

        <form onSubmit={handleLogin} className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="email"
              className="text-sm font-semibold"
              style={{ color: '#2D3272', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-lg border border-[#d1dae6] px-4 py-3 text-sm outline-none transition focus:border-[#2D8FBF] focus:ring-2 focus:ring-[#2D8FBF]/20"
              style={{ color: '#252850', fontFamily: "'Inter', sans-serif" }}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="password"
              className="text-sm font-semibold"
              style={{ color: '#2D3272', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
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
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>

      <p className="text-center text-sm mt-6" style={{ color: '#5B7FA6', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
        Don&apos;t have an account?{' '}
        <Link href="/signup" className="font-semibold" style={{ color: '#2D8FBF' }}>
          Sign up free
        </Link>
      </p>
    </div>
  )
}

