import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createServiceSupabaseClient } from '@/lib/supabase/service'

const DEFAULT_ITEMS = [
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
] as const

export async function POST(req: Request) {
  try {
    // ── Auth: verify the caller has a valid session ───────────────
    // createServerSupabaseClient reads cookies() from next/headers,
    // which is reliable inside a Route Handler.
    const authClient = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await authClient.auth.getUser()

    if (authError || !user) {
      console.error('[create-org] Auth check failed:', authError)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.log('[create-org] Auth OK — user:', user.id)

    const { orgName } = await req.json() as { orgName?: string }
    if (!orgName?.trim()) {
      return NextResponse.json({ error: 'orgName is required' }, { status: 400 })
    }

    // All subsequent DB writes use the service role key so RLS never
    // blocks any step — no timing issues, no policy edge cases.
    const service = createServiceSupabaseClient()

    // ── Step 1: Create the organization ──────────────────────────
    const { data: org, error: orgError } = await service
      .from('organizations')
      .insert({ name: orgName.trim(), created_by: user.id })
      .select('id')
      .single()

    if (orgError || !org) {
      console.error('[create-org] Step 1 FAILED — org insert:', orgError)
      return NextResponse.json({ error: orgError?.message ?? 'Failed to create organization' }, { status: 500 })
    }
    console.log('[create-org] Step 1 OK — org id:', org.id)

    // ── Step 2: Link the user's profile to the org as admin ───────
    const { error: profileError } = await service
      .from('profiles')
      .update({ org_id: org.id, role: 'admin' })
      .eq('id', user.id)

    if (profileError) {
      console.error('[create-org] Step 2 FAILED — profile update:', profileError)
      return NextResponse.json({ error: profileError.message }, { status: 500 })
    }
    console.log('[create-org] Step 2 OK — profile linked as admin')

    // ── Step 3: Create the audit template ────────────────────────
    const { data: template, error: templateError } = await service
      .from('audit_templates')
      .insert({ org_id: org.id, name: 'Default 6S Template', created_by: user.id })
      .select('id')
      .single()

    if (templateError || !template) {
      console.error('[create-org] Step 3 FAILED — template insert:', templateError)
      return NextResponse.json({ error: templateError?.message ?? 'Failed to create template' }, { status: 500 })
    }
    console.log('[create-org] Step 3 OK — template id:', template.id)

    // ── Step 4: Seed the 18 default items ────────────────────────
    const { error: itemsError } = await service
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
      console.error('[create-org] Step 4 FAILED — template_items insert:', itemsError)
      return NextResponse.json({ error: itemsError.message }, { status: 500 })
    }
    console.log('[create-org] Step 4 OK — 18 items seeded for template', template.id)

    return NextResponse.json({ orgId: org.id, templateId: template.id })

  } catch (err) {
    console.error('[create-org] Unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
