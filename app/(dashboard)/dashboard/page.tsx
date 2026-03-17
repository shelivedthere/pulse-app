import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import AreaList from '@/components/dashboard/AreaList'

function fmt(n: number | null, decimals = 1) {
  return n == null ? '--' : n.toFixed(decimals)
}

interface Props {
  searchParams: Promise<{ notice?: string }>
}

export default async function DashboardPage({ searchParams }: Props) {
  const { notice } = await searchParams
  const supabase = await createServerSupabaseClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('org_id, full_name, role, assigned_area_id')
    .eq('id', user.id)
    .single()

  if (!profile?.org_id) redirect('/onboarding')

  const orgId: string = profile.org_id
  const isAdmin = profile.role === 'admin'

  // Build the areas query — contributors see only their assigned area
  const areasQuery = supabase
    .from('areas')
    .select('id, name, created_at')
    .eq('org_id', orgId)
    .order('created_at', { ascending: true })

  if (!isAdmin && profile.assigned_area_id) {
    areasQuery.eq('id', profile.assigned_area_id)
  }

  // Fetch org, areas, and all audit/action data in parallel
  const [
    { data: org },
    { data: allAreas },
    { data: allAudits },
    { data: openItems },
  ] = await Promise.all([
    supabase
      .from('organizations')
      .select('id, name')
      .eq('id', orgId)
      .single(),
    areasQuery,
    supabase
      .from('audits')
      .select('area_id, score, submitted_at')
      .eq('org_id', orgId)
      .order('submitted_at', { ascending: false }),
    supabase
      .from('action_items')
      .select('area_id')
      .eq('org_id', orgId)
      .eq('status', 'open'),
  ])

  // Contributors with no assigned_area_id see an empty list
  const areas = isAdmin
    ? (allAreas ?? [])
    : profile.assigned_area_id ? (allAreas ?? []) : []

  // ── Build per-area lookup maps ──────────────────────────────
  const latestAuditMap = new Map<string, { score: number | null; submitted_at: string }>()
  for (const audit of allAudits ?? []) {
    if (!latestAuditMap.has(audit.area_id)) {
      latestAuditMap.set(audit.area_id, audit)
    }
  }

  const openItemsMap = new Map<string, number>()
  for (const item of openItems ?? []) {
    openItemsMap.set(item.area_id, (openItemsMap.get(item.area_id) ?? 0) + 1)
  }

  // ── Summary stats (scoped to visible areas) ──────────────────
  const visibleAreaIds = new Set(areas.map(a => a.id))

  const latestScores = [...latestAuditMap.entries()]
    .filter(([id]) => visibleAreaIds.has(id))
    .map(([, a]) => a.score)
    .filter((s): s is number => s != null)

  const avgScore =
    latestScores.length > 0
      ? latestScores.reduce((sum, s) => sum + s, 0) / latestScores.length
      : null

  const totalOpenItems = [...openItemsMap.entries()]
    .filter(([id]) => visibleAreaIds.has(id))
    .reduce((sum, [, count]) => sum + count, 0)

  const startOfMonth = new Date(
    new Date().getFullYear(),
    new Date().getMonth(),
    1
  ).toISOString()
  const areasAuditedThisMonth = new Set(
    (allAudits ?? [])
      .filter(a => a.submitted_at >= startOfMonth && visibleAreaIds.has(a.area_id))
      .map(a => a.area_id)
  ).size

  // ── Enrich areas ─────────────────────────────────────────────
  const enrichedAreas = areas.map(area => ({
    ...area,
    latestScore: latestAuditMap.get(area.id)?.score ?? null,
    lastAuditDate: latestAuditMap.get(area.id)?.submitted_at ?? null,
    openItemCount: openItemsMap.get(area.id) ?? 0,
  }))

  // ── Getting Started checklist (admin only) ────────────────────
  const hasAreas = (allAreas ?? []).length > 0
  const hasAudit = (allAudits ?? []).length > 0
  const showGettingStarted = isAdmin && (!hasAreas || !hasAudit)

  return (
    <div className="max-w-[1120px] mx-auto py-10">
      {/* Getting Started banner */}
      {showGettingStarted && (
        <div
          className="mb-8 rounded-xl border px-6 py-5"
          style={{ background: '#F0F7FF', borderColor: '#C2DCF5' }}
        >
          <p
            className="text-sm font-extrabold mb-3"
            style={{ color: '#2D3272', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            Getting Started
          </p>
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 text-sm" style={{ color: '#252850' }}>
              <span style={{ color: '#2DA870' }}>✓</span>
              <span style={{ textDecoration: 'line-through', color: '#5B7FA6' }}>Create your organization</span>
            </div>
            <div className="flex items-center gap-2 text-sm" style={{ color: '#252850' }}>
              {hasAreas
                ? <><span style={{ color: '#2DA870' }}>✓</span><span style={{ textDecoration: 'line-through', color: '#5B7FA6' }}>Add your first area</span></>
                : <><span style={{ color: '#B0B8C9' }}>☐</span><span>Add your first area</span></>
              }
            </div>
            <div className="flex items-center gap-2 text-sm" style={{ color: '#252850' }}>
              {hasAudit
                ? <><span style={{ color: '#2DA870' }}>✓</span><span style={{ textDecoration: 'line-through', color: '#5B7FA6' }}>Conduct your first audit</span></>
                : <><span style={{ color: '#B0B8C9' }}>☐</span><span>Conduct your first audit</span></>
              }
            </div>
          </div>
          {!hasAreas && (
            <div className="mt-4">
              <span
                className="text-xs font-semibold"
                style={{ color: '#2D8FBF', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                Start by adding an area below ↓
              </span>
            </div>
          )}
          {hasAreas && !hasAudit && (
            <div className="mt-4">
              <Link
                href={`/audit/${(allAreas ?? [])[0]?.id}`}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white"
                style={{ background: '#2D8FBF', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                Start your first audit →
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Settings access notice for contributors */}
      {notice === 'settings-admin-only' && (
        <div
          className="mb-6 rounded-xl border px-5 py-4 text-sm font-semibold"
          style={{
            background: '#FFF8E6',
            borderColor: '#F5D800',
            color: '#252850',
            fontFamily: "'Plus Jakarta Sans', sans-serif",
          }}
        >
          Settings are only available to administrators.
        </div>
      )}

      {/* Page header */}
      <div className="mb-8">
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

      {/* Summary bar */}
      {enrichedAreas.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-10">
          {[
            {
              label: 'Avg Score',
              value: avgScore != null ? `${fmt(avgScore)}%` : '--',
              color: avgScore == null
                ? '#5B7FA6'
                : avgScore >= 80 ? '#2DA870'
                : avgScore >= 60 ? '#F5D800'
                : '#E53935',
            },
            {
              label: 'Open Items',
              value: String(totalOpenItems),
              color: totalOpenItems > 0 ? '#E53935' : '#2DA870',
            },
            {
              label: 'Audited This Month',
              value: String(areasAuditedThisMonth),
              color: '#2D3272',
            },
          ].map(stat => (
            <div
              key={stat.label}
              className="bg-white rounded-xl border border-[#e8edf2] shadow-sm px-4 py-4 text-center"
            >
              <div
                className="text-2xl font-extrabold tabular-nums mb-0.5"
                style={{ color: stat.color, fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                {stat.value}
              </div>
              <div
                className="text-xs font-semibold"
                style={{ color: '#5B7FA6', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Areas section */}
      <section>
        <h2
          className="text-base font-bold uppercase tracking-wider mb-5"
          style={{ color: '#5B7FA6', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
        >
          Areas
        </h2>
        <AreaList
          initialAreas={enrichedAreas}
          orgId={orgId}
          userId={user.id}
          isAdmin={isAdmin}
        />
      </section>
    </div>
  )
}
