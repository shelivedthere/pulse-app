import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import ScoreTrendChart from '@/components/dashboard/ScoreTrendChart'

interface Props {
  params: Promise<{ areaId: string }>
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatChartLabel(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

function scoreColor(score: number) {
  if (score >= 80) return '#2DA870'
  if (score >= 60) return '#F5D800'
  return '#E53935'
}

export default async function AreaDetailPage({ params }: Props) {
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

  // Fetch last 10 audits in descending order, reverse for chart
  const { data: rawAudits } = await supabase
    .from('audits')
    .select('id, score, submitted_at, ai_summary')
    .eq('area_id', areaId)
    .eq('org_id', orgId)
    .order('submitted_at', { ascending: false })
    .limit(10)

  const audits = (rawAudits ?? []).reverse()

  // Open action item count for this area
  const { count: openItemCount } = await supabase
    .from('action_items')
    .select('id', { count: 'exact', head: true })
    .eq('area_id', areaId)
    .eq('org_id', orgId)
    .eq('status', 'open')

  const chartData = audits
    .filter(a => a.score != null)
    .map(a => ({
      label: formatChartLabel(a.submitted_at),
      score: Number(a.score),
    }))

  const latestAudit = rawAudits?.[0] ?? null
  const latestScore = latestAudit?.score != null ? Number(latestAudit.score) : null
  const latestDate = latestAudit ? formatDate(latestAudit.submitted_at) : null

  return (
    <div className="max-w-[1120px] mx-auto px-6 py-10">
      {/* Back link */}
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm font-semibold mb-6"
        style={{ color: '#5B7FA6', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
      >
        ← Dashboard
      </Link>

      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <p
            className="text-xs font-bold uppercase tracking-wider mb-1"
            style={{ color: '#5B7FA6', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            Area
          </p>
          <h1
            className="text-3xl font-extrabold tracking-tight"
            style={{ color: '#2D3272', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            {area.name}
          </h1>
        </div>
        <Link
          href={`/audit/${areaId}`}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white self-start sm:self-auto"
          style={{ background: '#2D8FBF', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
        >
          Start New Audit →
        </Link>
      </div>

      {/* Latest score badge */}
      {latestScore !== null && (
        <div className="flex items-center gap-4 mb-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider mb-0.5" style={{ color: '#5B7FA6', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Latest Score
            </p>
            <span
              className="text-4xl font-extrabold tabular-nums"
              style={{ color: scoreColor(latestScore), fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              {latestScore.toFixed(1)}%
            </span>
          </div>
          {latestDate && (
            <p className="text-sm self-end pb-1" style={{ color: '#5B7FA6' }}>
              {latestDate}
            </p>
          )}
        </div>
      )}

      {/* Score trend chart */}
      <div className="bg-white rounded-xl border border-[#e8edf2] shadow-sm p-6 mb-5">
        <h2
          className="text-base font-bold mb-5"
          style={{ color: '#2D3272', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
        >
          Score Trend
        </h2>

        {chartData.length < 2 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p
              className="text-sm font-semibold mb-1"
              style={{ color: '#2D3272', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              {chartData.length === 0
                ? 'No audits yet — start your first audit to begin tracking this area'
                : 'Complete at least 2 audits to see your trend'}
            </p>
            <p className="text-sm mb-5" style={{ color: '#5B7FA6' }}>
              {chartData.length === 1
                ? 'You have 1 audit — one more to go.'
                : 'Scores will appear here after each completed audit.'}
            </p>
            <Link
              href={`/audit/${areaId}`}
              className="px-5 py-2.5 rounded-xl text-sm font-bold text-white"
              style={{ background: '#2D8FBF', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              Start Audit
            </Link>
          </div>
        ) : (
          <ScoreTrendChart data={chartData} />
        )}
      </div>

      {/* AI Summary */}
      {latestAudit?.ai_summary && (
        <div className="bg-white rounded-xl border border-[#e8edf2] shadow-sm p-6 mb-5">
          <p
            className="text-xs font-bold uppercase tracking-wider mb-3"
            style={{ color: '#5BB8D4', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            Latest Audit Summary
          </p>
          <p className="text-sm leading-relaxed" style={{ color: '#252850' }}>
            {latestAudit.ai_summary}
          </p>
        </div>
      )}

      {/* Open action items */}
      <div className="bg-white rounded-xl border border-[#e8edf2] shadow-sm p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p
              className="text-sm font-bold mb-0.5"
              style={{ color: '#2D3272', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              {openItemCount ?? 0} open action {(openItemCount ?? 0) === 1 ? 'item' : 'items'}
            </p>
            <p className="text-sm" style={{ color: '#5B7FA6' }}>
              {(openItemCount ?? 0) === 0
                ? 'No open findings — this area is in good shape.'
                : 'Assign owners and track progress to close findings.'}
            </p>
          </div>
          {(openItemCount ?? 0) > 0 && (
            <Link
              href={`/actions?area=${areaId}`}
              className="flex-shrink-0 px-4 py-2 rounded-lg text-sm font-semibold border border-[#d1dae6]"
              style={{ color: '#2D3272', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              View →
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
