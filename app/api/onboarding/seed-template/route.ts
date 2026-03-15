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
  // Verify the caller is an authenticated user
  const authClient = await createServerSupabaseClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { orgId } = await req.json() as { orgId?: string }
  if (!orgId) {
    return NextResponse.json({ error: 'orgId is required' }, { status: 400 })
  }

  // Use the service role client — bypasses RLS entirely, so no timing
  // issues with the freshly-set admin role on the profile row.
  const service = createServiceSupabaseClient()

  // ── Guard: check whether a template already exists for this org ──
  // The database trigger (on_org_created) may have already seeded it.
  // If it did, we return success immediately to avoid creating duplicates.
  const { data: existing, error: existingError } = await service
    .from('audit_templates')
    .select('id')
    .eq('org_id', orgId)

  if (existingError) {
    console.error('[seed-template] Error checking existing templates:', existingError)
    return NextResponse.json({ error: existingError.message }, { status: 500 })
  }

  if (existing && existing.length > 0) {
    console.log(`[seed-template] Template already exists for org ${orgId} (${existing.length} row(s)) — skipping insert`)
    return NextResponse.json({ seeded: false, reason: 'already_exists', templateId: existing[0].id })
  }

  // ── Step 1: Create the audit template ────────────────────────────
  const { data: template, error: templateError } = await service
    .from('audit_templates')
    .insert({ org_id: orgId, name: 'Default 6S Template', created_by: user.id })
    .select('id')
    .single()

  if (templateError || !template) {
    console.error('[seed-template] Failed to insert audit_template:', templateError)
    return NextResponse.json({ error: templateError?.message ?? 'Template insert failed' }, { status: 500 })
  }

  console.log(`[seed-template] Created audit_template ${template.id} for org ${orgId}`)

  // ── Step 2: Seed the 18 default items ────────────────────────────
  const { error: itemsError } = await service
    .from('template_items')
    .insert(
      DEFAULT_ITEMS.map(item => ({
        template_id: template.id,
        org_id: orgId,
        category: item.category,
        description: item.description,
        sort_order: item.sort_order,
        is_default: true,
      }))
    )

  if (itemsError) {
    console.error('[seed-template] Failed to insert template_items:', itemsError)
    return NextResponse.json({ error: itemsError.message }, { status: 500 })
  }

  console.log(`[seed-template] Seeded 18 default items for template ${template.id}`)
  return NextResponse.json({ seeded: true, templateId: template.id })
}
