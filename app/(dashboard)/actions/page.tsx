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
    .select('org_id, role, assigned_area_id')
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

  // Fetch team members for owner dropdown
  const { data: teamMembers } = await supabase
    .from('profiles')
    .select('id, email, full_name')
    .eq('org_id', orgId)
    .order('full_name', { ascending: true })

  // For contributors: scope to their assigned area
  let allowedAreaIds: string[] | null = null
  if (!isAdmin) {
    allowedAreaIds = profile.assigned_area_id ? [profile.assigned_area_id] : []
  }

  // Fetch action items — join area name via separate map to keep types clean
  let itemsQuery = supabase
    .from('action_items')
    .select('id, description, owner_name, due_date, status, area_id, created_at, audit_id')
    .eq('org_id', orgId)
    .order('created_at', { ascending: false })

  if (allowedAreaIds !== null) {
    // Contributor with no areas gets an empty result
    if (allowedAreaIds.length === 0) {
      return (
        <div style={{ maxWidth: '1120px', margin: '0 auto', padding: '40px 24px' }}>
          <PageHeader isAdmin={false} totalCount={0} />
          <EmptyState message="You haven't been assigned to any areas yet. Contact your administrator to get access." />
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
    <div style={{ maxWidth: '1120px', margin: '0 auto', padding: '40px 24px' }}>
      <PageHeader isAdmin={isAdmin} totalCount={items.length} />
      <ActionItemList
        initialItems={items}
        areas={areas ?? []}
        orgId={orgId}
        initialAreaFilter={initialAreaFilter ?? 'all'}
        teamMembers={teamMembers ?? []}
      />
    </div>
  )
}

function PageHeader({ isAdmin, totalCount }: { isAdmin: boolean; totalCount: number }) {
  return (
    <div style={{ marginBottom: '32px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
        <h1
          style={{
            color: '#2D3272',
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: '1.875rem',
            fontWeight: 800,
            letterSpacing: '-0.025em',
            margin: 0,
          }}
        >
          Action Items
        </h1>
        <span
          style={{
            backgroundColor: '#2D8FBF',
            color: '#ffffff',
            fontSize: '0.75rem',
            fontWeight: 700,
            padding: '3px 10px',
            borderRadius: '999px',
            fontFamily: "'Plus Jakarta Sans', sans-serif",
          }}
        >
          {totalCount}
        </span>
      </div>
      <p style={{ color: '#5B7FA6', fontSize: '0.875rem', margin: 0 }}>
        {isAdmin
          ? 'All findings across your organization'
          : 'Findings from your areas'}
      </p>
    </div>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <div
      style={{
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        border: '1px solid #e8edf2',
        boxShadow: '0 1px 4px rgba(45, 50, 114, 0.06)',
        padding: '40px',
        textAlign: 'center',
      }}
    >
      <p
        style={{
          fontSize: '0.875rem',
          fontWeight: 600,
          color: '#2D3272',
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          margin: 0,
        }}
      >
        {message}
      </p>
    </div>
  )
}
