import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import ScoreTrendChart from '@/components/dashboard/ScoreTrendChart'
import AreaActionItems from '@/components/actions/AreaActionItems'

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
  return '#ef4444'
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

  const isAdmin = profile?.role === 'admin'

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

  // Open action items for this area (up to 3 for display)
  const { data: openItems, count: openItemCount } = await supabase
    .from('action_items')
    .select('id, description, status, audit_id', { count: 'exact' })
    .eq('area_id', areaId)
    .eq('org_id', orgId)
    .eq('status', 'open')
    .order('created_at', { ascending: false })
    .limit(3)

  const chartData = audits
    .filter(a => a.score != null)
    .map(a => ({
      label: formatChartLabel(a.submitted_at),
      score: Number(a.score),
    }))

  const latestAudit = rawAudits?.[0] ?? null
  const latestScore = latestAudit?.score != null ? Number(latestAudit.score) : null
  const latestDate = latestAudit ? formatDate(latestAudit.submitted_at) : null
  const openCount = openItemCount ?? 0

  return (
    <div style={{ maxWidth: '1120px', margin: '0 auto', padding: '40px 16px' }}>

      {/* Back link */}
      <Link
        href="/dashboard"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          color: '#2D8FBF',
          fontSize: '14px',
          fontWeight: 600,
          textDecoration: 'none',
          marginBottom: '24px',
          fontFamily: "'Plus Jakarta Sans', sans-serif",
        }}
      >
        ← Back to Dashboard
      </Link>

      {/* Page header */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', marginBottom: '32px' }}>
        <div>
          {/* Area name + score badge row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
            <h1
              style={{
                fontSize: '30px',
                fontWeight: 800,
                letterSpacing: '-0.5px',
                color: '#2D3272',
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                margin: 0,
              }}
            >
              {area.name}
            </h1>
            {latestScore !== null && (
              <span
                style={{
                  fontSize: '22px',
                  fontWeight: 800,
                  color: scoreColor(latestScore),
                  background: `${scoreColor(latestScore)}18`,
                  borderRadius: '10px',
                  padding: '4px 14px',
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  letterSpacing: '-0.3px',
                }}
              >
                {latestScore.toFixed(1)}%
              </span>
            )}
          </div>
          {/* Last audited date */}
          {latestDate && (
            <p style={{ color: '#5B7FA6', fontSize: '13px', marginTop: '6px', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Last audited: {latestDate}
            </p>
          )}
        </div>
        <Link
          href={`/audit/${areaId}`}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 20px',
            borderRadius: '12px',
            fontSize: '14px',
            fontWeight: 700,
            color: '#ffffff',
            background: '#2D8FBF',
            textDecoration: 'none',
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            flexShrink: 0,
          }}
        >
          Start New Audit →
        </Link>
      </div>

      {/* Score trend chart */}
      <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e8edf2', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', padding: '24px', marginBottom: '20px' }}>
        <h2
          style={{
            fontSize: '15px',
            fontWeight: 700,
            color: '#2D3272',
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            margin: '0 0 20px 0',
          }}
        >
          Score Trend
        </h2>

        {chartData.length < 2 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 16px', textAlign: 'center' }}>
            {chartData.length === 0 && (
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '14px',
                  background: '#EBF0F8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '24px',
                  marginBottom: '16px',
                }}
              >
                📋
              </div>
            )}
            <p
              style={{
                fontSize: '15px',
                fontWeight: 700,
                color: '#2D3272',
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                marginBottom: '6px',
              }}
            >
              {chartData.length === 0 ? 'No audits yet' : 'Complete at least 2 audits to see your score trend'}
            </p>
            <p style={{ fontSize: '13px', color: '#5B7FA6', marginBottom: '20px', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              {chartData.length === 0
                ? 'Start your first audit to begin tracking this area'
                : 'You have 1 audit — one more to go.'}
            </p>
            <Link
              href={`/audit/${areaId}`}
              style={{
                padding: '10px 20px',
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: 700,
                color: '#ffffff',
                background: '#2D8FBF',
                textDecoration: 'none',
                fontFamily: "'Plus Jakarta Sans', sans-serif",
              }}
            >
              Start Audit →
            </Link>
          </div>
        ) : (
          <ScoreTrendChart data={chartData} />
        )}
      </div>

      {/* AI Summary */}
      {latestAudit?.ai_summary && (
        <div
          style={{
            background: 'rgba(91, 184, 212, 0.12)',
            borderRadius: '12px',
            border: '1px solid rgba(91, 184, 212, 0.25)',
            padding: '20px 24px',
            marginBottom: '20px',
          }}
        >
          <p
            style={{
              fontSize: '11px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: '#2D8FBF',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              marginBottom: '10px',
            }}
          >
            ✨ Latest Audit Summary
          </p>
          <p style={{ fontSize: '14px', lineHeight: '1.65', color: '#252850', fontFamily: "'Plus Jakarta Sans', sans-serif", margin: 0 }}>
            {latestAudit.ai_summary}
          </p>
        </div>
      )}

      {/* Open action items */}
      <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e8edf2', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', padding: '20px 24px' }}>
        {/* Section title + count badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <h2
            style={{
              fontSize: '15px',
              fontWeight: 700,
              color: '#2D3272',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              margin: 0,
            }}
          >
            Open Action Items
          </h2>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: '22px',
              height: '22px',
              padding: '0 7px',
              borderRadius: '999px',
              fontSize: '12px',
              fontWeight: 700,
              color: '#ffffff',
              background: openCount > 0 ? '#ef4444' : '#2DA870',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}
          >
            {openCount}
          </span>
        </div>

        <AreaActionItems
          initialItems={openItems ?? []}
          isAdmin={isAdmin}
        />

        {/* View all link */}
        {openCount > 0 && (
          <div style={{ marginTop: '16px' }}>
            <Link
              href={`/actions?area=${areaId}`}
              style={{
                fontSize: '13px',
                fontWeight: 600,
                color: '#2D8FBF',
                textDecoration: 'none',
                fontFamily: "'Plus Jakarta Sans', sans-serif",
              }}
            >
              View all action items →
            </Link>
          </div>
        )}
      </div>

    </div>
  )
}
