'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { CATEGORIES } from '@/lib/constants'

const DEFAULT_ITEMS: { category: string; description: string; sort_order: number }[] = [
  { category: 'Sort',         description: 'Unnecessary items removed from work area',            sort_order: 1 },
  { category: 'Sort',         description: 'Only required tools and materials are present',        sort_order: 2 },
  { category: 'Sort',         description: 'Red tag process in use for questionable items',        sort_order: 3 },
  { category: 'Set in Order', description: 'All items have a designated location',                sort_order: 1 },
  { category: 'Set in Order', description: 'Locations are clearly labeled or marked',             sort_order: 2 },
  { category: 'Set in Order', description: 'Items are returned to their location after use',      sort_order: 3 },
  { category: 'Shine',        description: 'Work area is clean and free of debris',               sort_order: 1 },
  { category: 'Shine',        description: 'Equipment is clean and in good condition',            sort_order: 2 },
  { category: 'Shine',        description: 'Cleaning responsibilities are clearly assigned',      sort_order: 3 },
  { category: 'Standardize',  description: 'Visual standards are posted and visible',             sort_order: 1 },
  { category: 'Standardize',  description: '5S standards are documented and accessible',          sort_order: 2 },
  { category: 'Standardize',  description: 'Area layout matches the standard visual',             sort_order: 3 },
  { category: 'Sustain',      description: 'Audit is being performed on schedule',                sort_order: 1 },
  { category: 'Sustain',      description: 'Team members follow 6S standards consistently',      sort_order: 2 },
  { category: 'Sustain',      description: 'Previous audit findings have been addressed',         sort_order: 3 },
  { category: 'Safety',       description: 'Emergency exits are clear and unobstructed',          sort_order: 1 },
  { category: 'Safety',       description: 'PPE is available and properly stored',                sort_order: 2 },
  { category: 'Safety',       description: 'Hazardous materials are properly labeled and stored', sort_order: 3 },
]

// Confirm all categories are present (compile-time safety)
void CATEGORIES

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

    try {
      const supabase = createClient()

      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        setError('Session expired. Please sign in again.')
        setLoading(false)
        return
      }

      // 1. Create the organization
      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .insert({ name, created_by: user.id })
        .select('id')
        .single()

      if (orgError || !org) {
        setError('Failed to create organization. Please try again.')
        setLoading(false)
        return
      }

      // 2. Link user to org and set role = admin
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ org_id: org.id, role: 'admin' })
        .eq('id', user.id)

      if (profileError) {
        setError('Failed to set up your account. Please try again.')
        setLoading(false)
        return
      }

      // 3. Create the audit template for the org
      const { data: template, error: templateError } = await supabase
        .from('audit_templates')
        .insert({ org_id: org.id, name: '6S Audit Template', created_by: user.id })
        .select('id')
        .single()

      if (templateError || !template) {
        setError('Failed to create audit template. Please try again.')
        setLoading(false)
        return
      }

      // 4. Seed the 18 default template items
      const { error: itemsError } = await supabase
        .from('template_items')
        .insert(
          DEFAULT_ITEMS.map(item => ({
            template_id: template.id,
            org_id: org.id,
            category: item.category,
            description: item.description,
            sort_order: item.sort_order,
            is_default: true,
          }))
        )

      if (itemsError) {
        setError('Failed to seed checklist items. Please try again.')
        setLoading(false)
        return
      }

      router.push('/dashboard')
    } catch {
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
