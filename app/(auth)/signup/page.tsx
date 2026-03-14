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
          {inviteToken ? 'Create your account' : 'Create your account'}
        </h1>
        <p className="text-sm mb-8" style={{ color: '#5B7FA6', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          {inviteToken
            ? 'Set up your account to accept the invitation.'
            : 'Get started — free forever for solo practitioners.'}
        </p>

        <form onSubmit={handleSignup} className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="fullName"
              className="text-sm font-semibold"
              style={{ color: '#2D3272', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
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
              placeholder="Tracey Minutolo"
              className="w-full rounded-lg border border-[#d1dae6] px-4 py-3 text-sm outline-none transition focus:border-[#2D8FBF] focus:ring-2 focus:ring-[#2D8FBF]/20"
              style={{ color: '#252850', fontFamily: "'Inter', sans-serif" }}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="email"
              className="text-sm font-semibold"
              style={{ color: '#2D3272', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              Work email
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
              className="w-full rounded-lg border border-[#d1dae6] px-4 py-3 text-sm outline-none transition focus:border-[#2D8FBF] focus:ring-2 focus:ring-[#2D8FBF]/20"
              style={{
                color: '#252850',
                fontFamily: "'Inter', sans-serif",
                background: inviteToken && inviteEmail ? '#f8f9fb' : undefined,
              }}
            />
            {inviteToken && inviteEmail && (
              <p className="text-xs" style={{ color: '#5B7FA6' }}>
                This email matches your invitation and cannot be changed.
              </p>
            )}
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
              autoComplete="new-password"
              required
              minLength={8}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="At least 8 characters"
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
            {loading ? 'Creating account…' : 'Create account'}
          </button>

          <p className="text-xs text-center" style={{ color: '#5B7FA6', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            By signing up you agree to our terms of service.
          </p>
        </form>
      </div>

      <p className="text-center text-sm mt-6" style={{ color: '#5B7FA6', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
        Already have an account?{' '}
        <Link
          href={inviteToken ? `/login?redirect=/invite/${inviteToken}` : '/login'}
          className="font-semibold"
          style={{ color: '#2D8FBF' }}
        >
          Sign in
        </Link>
      </p>
    </div>
  )
}
