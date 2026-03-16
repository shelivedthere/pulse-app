import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import TemplateBuilder from '@/components/settings/TemplateBuilder'
import TeamTab from '@/components/settings/TeamTab'

interface Props {
  searchParams: Promise<{ tab?: string }>
}

export default async function SettingsPage({ searchParams }: Props) {
  const { tab = 'template' } = await searchParams
  const supabase = await createServerSupabaseClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('org_id, role')
    .eq('id', user.id)
    .single()

  if (!profile?.org_id) redirect('/onboarding')
  if (profile.role !== 'admin') redirect('/dashboard?notice=settings-admin-only')

  const orgId: string = profile.org_id

  // ── Template tab data ────────────────────────────────────────
  const { data: template } = await supabase
    .from('audit_templates')
    .select('id')
    .eq('org_id', orgId)
    .single()

  const { data: items } = template
    ? await supabase
        .from('template_items')
        .select('id, template_id, org_id, category, description, sort_order, is_default')
        .eq('template_id', template.id)
        .order('sort_order', { ascending: true })
    : { data: [] }

  // ── Team tab data ────────────────────────────────────────────
  const [{ data: areas }, { data: contributors }, { data: invitations }] =
    await Promise.all([
      supabase
        .from('areas')
        .select('id, name')
        .eq('org_id', orgId)
        .order('name', { ascending: true }),
      supabase
        .from('profiles')
        .select('id, full_name, email, role, assigned_area_id')
        .eq('org_id', orgId)
        .order('created_at', { ascending: true }),
      supabase
        .from('invitations')
        .select('id, email, area_id, created_at, accepted_at')
        .eq('org_id', orgId)
        .order('created_at', { ascending: false }),
    ])

  // Build area name lookup
  const areaMap = new Map<string, string>()
  for (const a of areas ?? []) areaMap.set(a.id, a.name)

  const teamMembers = (contributors ?? []).map(m => ({
    id: m.id,
    full_name: m.full_name ?? '',
    email: m.email ?? '',
    role: (m.role ?? 'contributor') as 'admin' | 'contributor',
    assigned_area_id: m.assigned_area_id ?? null,
  }))

  const pendingInvitations = (invitations ?? [])
    .filter(i => !i.accepted_at)
    .map(i => ({
      id: i.id,
      email: i.email,
      area_id: i.area_id,
      area_name: areaMap.get(i.area_id) ?? 'Unknown',
      created_at: i.created_at,
    }))

  const activeTab = tab === 'team' ? 'team' : 'template'

  return (
    <div className="max-w-[1120px] mx-auto px-6 py-10">
      {/* Page header */}
      <div className="mb-8">
        <h1
          className="text-3xl font-extrabold tracking-tight mb-6"
          style={{ color: '#2D3272', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
        >
          Settings
        </h1>

        {/* Sub-navigation */}
        <div className="flex gap-0 border-b border-[#e8edf2]">
          <Link
            href="/settings?tab=template"
            className="px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors"
            style={
              activeTab === 'template'
                ? { color: '#2D3272', borderColor: '#2D8FBF', fontFamily: "'Plus Jakarta Sans', sans-serif" }
                : { color: '#5B7FA6', borderColor: 'transparent', fontFamily: "'Plus Jakarta Sans', sans-serif" }
            }
          >
            Template
          </Link>
          <Link
            href="/settings?tab=team"
            className="px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors"
            style={
              activeTab === 'team'
                ? { color: '#2D3272', borderColor: '#2D8FBF', fontFamily: "'Plus Jakarta Sans', sans-serif" }
                : { color: '#5B7FA6', borderColor: 'transparent', fontFamily: "'Plus Jakarta Sans', sans-serif" }
            }
          >
            Team
          </Link>
        </div>
      </div>

      {/* Template tab */}
      {activeTab === 'template' && (
        <div className="max-w-2xl">
          <div className="mb-6">
            <h2
              className="text-lg font-extrabold mb-1"
              style={{ color: '#2D3272', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              Audit Template
            </h2>
            <p className="text-sm" style={{ color: '#5B7FA6' }}>
              These items appear on every audit by default. Use area settings to toggle items on or off for individual areas.
            </p>
          </div>

          {template ? (
            <TemplateBuilder
              initialItems={items ?? []}
              templateId={template.id}
              orgId={orgId}
            />
          ) : (
            <div className="bg-white rounded-xl border border-[#e8edf2] shadow-sm p-8 text-center">
              <p
                className="text-sm font-semibold mb-1"
                style={{ color: '#2D3272', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                No template found
              </p>
              <p className="text-sm" style={{ color: '#5B7FA6' }}>
                Run the template migration SQL in your Supabase SQL Editor, then create a new organization to auto-seed the default template.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Team tab */}
      {activeTab === 'team' && (
        <TeamTab
          orgId={orgId}
          areas={areas ?? []}
          teamMembers={teamMembers}
          pendingInvitations={pendingInvitations}
        />
      )}
    </div>
  )
}
