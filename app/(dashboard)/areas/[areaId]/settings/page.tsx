import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import AreaChecklist from '@/components/settings/AreaChecklist'

interface Props {
  params: Promise<{ areaId: string }>
}

export default async function AreaSettingsPage({ params }: Props) {
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
  if (profile.role !== 'admin') redirect('/dashboard')

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

  // Fetch all template items for this org
  const { data: templateItems } = await supabase
    .from('template_items')
    .select('id, category, description, sort_order, is_default')
    .eq('template_id', template.id)
    .order('sort_order', { ascending: true })

  // Fetch area-level overrides
  const { data: areaOverrides } = await supabase
    .from('area_template_items')
    .select('template_item_id, is_active')
    .eq('area_id', areaId)

  // Build a lookup of overrides by template_item_id
  const overrideMap = new Map<string, boolean>()
  for (const override of areaOverrides ?? []) {
    overrideMap.set(override.template_item_id, override.is_active)
  }

  // Merge: missing row means is_active = true (default on)
  const items = (templateItems ?? []).map(item => ({
    ...item,
    is_active: overrideMap.has(item.id) ? overrideMap.get(item.id)! : true,
  }))

  return (
    <div className="max-w-[1120px] mx-auto py-10">
{/* Back link */}
      <Link
        href={`/areas/${areaId}`}
        className="inline-flex items-center gap-1.5 text-sm font-semibold mb-6"
        style={{ color: '#5B7FA6', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
      >
        ← {area.name}
      </Link>

      {/* Page header */}
      <div className="mb-8">
        <h1
          className="text-3xl font-extrabold tracking-tight mb-1"
          style={{ color: '#2D3272', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
        >
          {area.name}
        </h1>
        <p className="text-sm" style={{ color: '#5B7FA6' }}>
          Customize which checklist items appear when auditing this area.
        </p>
      </div>

      {/* Checklist */}
      <div className="max-w-2xl">
        <AreaChecklist
          initialItems={items}
          areaId={areaId}
          orgId={orgId}
        />
      </div>
    </div>
  )
}
