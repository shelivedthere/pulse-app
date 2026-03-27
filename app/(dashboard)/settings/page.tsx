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
        .select('id, full_name, email, role, assigned_area_id, display_name, avatar_emoji')
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
    display_name: m.display_name ?? null,
    avatar_emoji: m.avatar_emoji ?? null,
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

  const FONT = "'Plus Jakarta Sans', sans-serif"

  return (
    <div style={{ maxWidth: '1120px', margin: '0 auto', padding: '40px 16px' }}>
      {/* Page header */}
      <div style={{ marginBottom: '32px' }}>
        <h1
          style={{
            fontSize: '30px',
            fontWeight: 800,
            letterSpacing: '-0.5px',
            color: '#2D3272',
            fontFamily: FONT,
            margin: '0 0 24px 0',
          }}
        >
          Settings
        </h1>

        {/* Tab navigation */}
        <div style={{ display: 'flex', borderBottom: '2px solid #e8edf2' }}>
          <Link
            href="/settings?tab=template"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              minHeight: '44px',
              padding: '0 16px',
              fontSize: '14px',
              fontWeight: 700,
              fontFamily: FONT,
              textDecoration: 'none',
              marginBottom: '-2px',
              borderBottom: activeTab === 'template' ? '2px solid #2D8FBF' : '2px solid transparent',
              color: activeTab === 'template' ? '#2D8FBF' : '#5B7FA6',
            }}
          >
            Template
          </Link>
          <Link
            href="/settings?tab=team"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              minHeight: '44px',
              padding: '0 16px',
              fontSize: '14px',
              fontWeight: 700,
              fontFamily: FONT,
              textDecoration: 'none',
              marginBottom: '-2px',
              borderBottom: activeTab === 'team' ? '2px solid #2D8FBF' : '2px solid transparent',
              color: activeTab === 'team' ? '#2D8FBF' : '#5B7FA6',
            }}
          >
            Team
          </Link>
        </div>
      </div>

      {/* Template tab */}
      {activeTab === 'template' && (
        <div style={{ maxWidth: '672px' }}>
          <div style={{ marginBottom: '24px' }}>
            <h2
              style={{
                fontSize: '17px',
                fontWeight: 800,
                color: '#2D3272',
                fontFamily: FONT,
                margin: '0 0 4px 0',
              }}
            >
              Audit Template
            </h2>
            <p style={{ fontSize: '14px', color: '#5B7FA6', margin: 0 }}>
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
            <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e8edf2', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', padding: '32px', textAlign: 'center' }}>
              <p style={{ fontSize: '14px', fontWeight: 600, color: '#2D3272', fontFamily: FONT, marginBottom: '4px' }}>
                No template found
              </p>
              <p style={{ fontSize: '13px', color: '#5B7FA6', margin: 0 }}>
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
