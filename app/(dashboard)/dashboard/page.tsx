import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import AreaList from '@/components/dashboard/AreaList'

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('org_id, full_name, role')
    .eq('id', user.id)
    .single()

  // No org means onboarding wasn't completed
  if (!profile?.org_id) redirect('/onboarding')

  const orgId: string = profile.org_id

  const [{ data: org }, { data: areas }] = await Promise.all([
    supabase
      .from('organizations')
      .select('id, name')
      .eq('id', orgId)
      .single(),
    supabase
      .from('areas')
      .select('id, name, created_at')
      .eq('org_id', orgId)
      .order('created_at', { ascending: true }),
  ])

  return (
    <div className="max-w-[1120px] mx-auto px-6 py-10">
      {/* Page header */}
      <div className="mb-10">
        <p
          className="text-xs font-bold uppercase tracking-wider mb-1"
          style={{ color: '#5B7FA6', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
        >
          Organization
        </p>
        <h1
          className="text-3xl font-extrabold tracking-tight"
          style={{ color: '#2D3272', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
        >
          {org?.name ?? 'Dashboard'}
        </h1>
      </div>

      {/* Areas section */}
      <section>
        <h2
          className="text-base font-bold uppercase tracking-wider mb-5"
          style={{ color: '#5B7FA6', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
        >
          Areas
        </h2>
        <AreaList
          initialAreas={areas ?? []}
          orgId={orgId}
          userId={user.id}
        />
      </section>
    </div>
  )
}
