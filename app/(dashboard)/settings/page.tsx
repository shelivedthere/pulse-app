import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import TemplateBuilder from '@/components/settings/TemplateBuilder'

export default async function SettingsPage() {
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
          <span
            className="px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px"
            style={{
              color: '#2D3272',
              borderColor: '#2D8FBF',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}
          >
            Template
          </span>
          <span
            className="px-4 py-2.5 text-sm font-semibold cursor-default"
            style={{ color: '#B0B8C9', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            Team
          </span>
        </div>
      </div>

      {/* Template section */}
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
    </div>
  )
}
