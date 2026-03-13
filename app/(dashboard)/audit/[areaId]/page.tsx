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
    .select('org_id, role')
    .eq('id', user.id)
    .single()

  if (!profile?.org_id) redirect('/onboarding')

  const orgId: string = profile.org_id

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
    <div className="max-w-2xl mx-auto px-4 py-8">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm font-semibold mb-6"
        style={{ color: '#5B7FA6', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
      >
        ← Dashboard
      </Link>

      <div className="mb-6">
        <p
          className="text-xs font-bold uppercase tracking-wider mb-1"
          style={{ color: '#5B7FA6', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
        >
          6S Audit
        </p>
        <h1
          className="text-2xl font-extrabold tracking-tight"
          style={{ color: '#2D3272', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
        >
          {area.name}
        </h1>
      </div>

      {activeItems.length === 0 ? (
        <div className="bg-white rounded-xl border border-[#e8edf2] shadow-sm p-8 text-center">
          <p
            className="text-sm font-semibold mb-1"
            style={{ color: '#2D3272', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            No active checklist items
          </p>
          <p className="text-sm" style={{ color: '#5B7FA6' }}>
            Enable items in the area checklist settings before running an audit.
          </p>
          <Link
            href={`/areas/${areaId}/settings`}
            className="inline-block mt-4 px-4 py-2 rounded-lg text-sm font-semibold text-white"
            style={{ background: '#2D8FBF', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
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
