import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import ActionItemList from '@/components/actions/ActionItemList'

interface Props {
  searchParams: Promise<{ area?: string }>
}

export default async function ActionsPage({ searchParams }: Props) {
  const { area: initialAreaFilter } = await searchParams
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
  const isAdmin = profile.role === 'admin'

  // Fetch areas for the filter dropdown
  const { data: areas } = await supabase
    .from('areas')
    .select('id, name')
    .eq('org_id', orgId)
    .order('name', { ascending: true })

  // For contributors: scope to areas where they've conducted audits
  let allowedAreaIds: string[] | null = null
  if (!isAdmin) {
    const { data: conducted } = await supabase
      .from('audits')
      .select('area_id')
      .eq('org_id', orgId)
      .eq('conducted_by', user.id)

    allowedAreaIds = [...new Set((conducted ?? []).map(a => a.area_id))]
  }

  // Fetch action items — join area name via separate map to keep types clean
  let itemsQuery = supabase
    .from('action_items')
    .select('id, description, owner_name, due_date, status, area_id, created_at')
    .eq('org_id', orgId)
    .order('created_at', { ascending: false })

  if (allowedAreaIds !== null) {
    // Contributor with no areas gets an empty result
    if (allowedAreaIds.length === 0) {
      return (
        <div className="max-w-[1120px] mx-auto px-6 py-10">
          <PageHeader isAdmin={false} />
          <EmptyState message="You haven't conducted any audits yet. Start an audit to generate action items." />
        </div>
      )
    }
    itemsQuery = itemsQuery.in('area_id', allowedAreaIds)
  }

  const { data: rawItems } = await itemsQuery

  // Build area name lookup
  const areaMap = new Map<string, string>()
  for (const a of areas ?? []) areaMap.set(a.id, a.name)

  const items = (rawItems ?? []).map(item => ({
    ...item,
    area_name: areaMap.get(item.area_id) ?? 'Unknown',
  }))

  return (
    <div className="max-w-[1120px] mx-auto px-6 py-10">
      <PageHeader isAdmin={isAdmin} />
      <ActionItemList
        initialItems={items}
        areas={areas ?? []}
        orgId={orgId}
        initialAreaFilter={initialAreaFilter ?? 'all'}
      />
    </div>
  )
}

function PageHeader({ isAdmin }: { isAdmin: boolean }) {
  return (
    <div className="mb-8">
      <h1
        className="text-3xl font-extrabold tracking-tight"
        style={{ color: '#2D3272', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
      >
        Action Items
      </h1>
      <p className="text-sm mt-1" style={{ color: '#5B7FA6' }}>
        {isAdmin
          ? 'All findings across your organization.'
          : 'Findings from your areas.'}
      </p>
    </div>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="bg-white rounded-xl border border-[#e8edf2] shadow-sm p-10 text-center">
      <p
        className="text-sm font-semibold mb-1"
        style={{ color: '#2D3272', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
      >
        {message}
      </p>
    </div>
  )
}
