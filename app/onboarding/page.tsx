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
    <div className="min-h-screen flex items-center justify-center bg-[#F5F7FA] px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <span
            className="inline-block font-extrabold text-2xl tracking-tight"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: '#2D3272' }}
          >
            Pulse
            <span
              className="inline-block w-2.5 h-2.5 rounded-full ml-0.5 mb-0.5 align-middle"
              style={{ background: '#F5D800' }}
            />
          </span>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-[#e8edf2] px-8 py-10">
          <div className="mb-8">
            <p
              className="text-xs font-bold uppercase tracking-wider mb-2"
              style={{ color: '#2DA870', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              Step 1 of 1
            </p>
            <h1
              className="text-2xl font-extrabold tracking-tight mb-2"
              style={{ color: '#2D3272', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              Name your organization
            </h1>
            <p className="text-sm" style={{ color: '#5B7FA6', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              This is usually your company or site name. You can change it later in Settings.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="orgName"
                className="text-sm font-semibold"
                style={{ color: '#2D3272', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                Organization name
              </label>
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
                placeholder="e.g. Acme Manufacturing — Site A"
                className="w-full rounded-lg border border-[#d1dae6] px-4 py-3 text-sm outline-none transition focus:border-[#2D8FBF] focus:ring-2 focus:ring-[#2D8FBF]/20"
                style={{ color: '#252850', fontFamily: "'Inter', sans-serif" }}
              />
              {error && (
                <p className="text-sm text-red-600">{error}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg px-4 py-3 text-sm font-semibold text-white transition disabled:opacity-60 disabled:cursor-not-allowed"
              style={{
                background: '#2D8FBF',
                fontFamily: "'Plus Jakarta Sans', sans-serif",
              }}
            >
              {loading ? 'Setting up…' : 'Create organization →'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
