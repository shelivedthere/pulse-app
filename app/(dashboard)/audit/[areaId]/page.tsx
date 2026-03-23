import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import AuditForm from '@/components/audit/AuditForm'

interface Props {
  params: Promise<{ areaId: string }>
}

export default async function AuditPage({ params }: Props) {
  const { areaId } = await params
  const supabase = await createServerSupabaseClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('org_id, role, assigned_area_id')
    .eq('id', user.id)
    .single()

  if (!profile?.org_id) redirect('/onboarding')

  const orgId: string = profile.org_id
  const isAdmin = profile.role === 'admin'

  // For contributors: verify they're assigned to this area
  if (!isAdmin && profile.assigned_area_id !== areaId) {
    redirect('/dashboard')
  }

  // Verify area belongs to this org
  const { data: area } = await supabase
    .from('areas')
    .select('id, name')
    .eq('id', areaId)
    .eq('org_id', orgId)
    .single()

  if (!area) redirect('/dashboard')

  // Fetch the org's audit template
  const { data: template } = await supabase
    .from('audit_templates')
    .select('id')
    .eq('org_id', orgId)
    .single()

  if (!template) redirect('/settings')

  // Fetch all template items
  const { data: templateItems } = await supabase
    .from('template_items')
    .select('id, category, description, sort_order')
    .eq('template_id', template.id)
    .order('sort_order', { ascending: true })

  // Fetch area-level overrides
  const { data: areaOverrides } = await supabase
    .from('area_template_items')
    .select('template_item_id, is_active')
    .eq('area_id', areaId)

  const overrideMap = new Map<string, boolean>()
  for (const override of areaOverrides ?? []) {
    overrideMap.set(override.template_item_id, override.is_active)
  }

  // Only pass active items to the form
  const activeItems = (templateItems ?? []).filter(item =>
    overrideMap.has(item.id) ? overrideMap.get(item.id)! : true
  )

  return (
    <div style={{ maxWidth: '672px', margin: '0 auto', padding: '32px 0' }}>
      {/* Back link */}
      <Link
        href="/dashboard"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '14px',
          fontWeight: 600,
          color: '#5B7FA6',
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          textDecoration: 'none',
          marginBottom: '20px',
        }}
      >
        ← Back to Dashboard
      </Link>

      {/* Page title */}
      <div style={{ marginBottom: '24px' }}>
        <h1
          style={{
            margin: 0,
            fontSize: '24px',
            fontWeight: 800,
            letterSpacing: '-0.02em',
            color: '#2D3272',
            fontFamily: "'Plus Jakarta Sans', sans-serif",
          }}
        >
          {area.name}
        </h1>
        <p
          style={{
            margin: '4px 0 0',
            fontSize: '13px',
            fontWeight: 600,
            color: '#5B7FA6',
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
          }}
        >
          6S Audit
        </p>
      </div>

      {activeItems.length === 0 ? (
        <div
          style={{
            background: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #e8edf2',
            boxShadow: '0 1px 4px rgba(45,50,114,0.06)',
            padding: '32px',
            textAlign: 'center',
          }}
        >
          <p
            style={{
              fontSize: '14px',
              fontWeight: 600,
              color: '#2D3272',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              marginBottom: '6px',
            }}
          >
            No active checklist items
          </p>
          <p style={{ fontSize: '14px', color: '#5B7FA6', margin: '0 0 16px' }}>
            Enable items in the area checklist settings before running an audit.
          </p>
          <Link
            href={`/areas/${areaId}/settings`}
            style={{
              display: 'inline-block',
              padding: '8px 16px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 600,
              background: '#2D8FBF',
              color: '#ffffff',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              textDecoration: 'none',
            }}
          >
            Customize Checklist
          </Link>
        </div>
      ) : (
        <AuditForm
          areaId={areaId}
          orgId={orgId}
          userId={user.id}
          areaName={area.name}
          items={activeItems}
        />
      )}
    </div>
  )
}
