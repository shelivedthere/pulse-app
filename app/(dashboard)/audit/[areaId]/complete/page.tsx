import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase/server'

interface Props {
  params: Promise<{ areaId: string }>
  searchParams: Promise<{ auditId?: string }>
}

export default async function AuditCompletePage({ params, searchParams }: Props) {
  const { areaId } = await params
  const { auditId } = await searchParams

  if (!auditId) redirect('/dashboard')

  const supabase = await createServerSupabaseClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('org_id')
    .eq('id', user.id)
    .single()

  if (!profile?.org_id) redirect('/onboarding')

  const [{ data: audit }, { data: area }, { count: actionCount }] = await Promise.all([
    supabase
      .from('audits')
      .select('id, score, ai_summary, submitted_at')
      .eq('id', auditId)
      .eq('org_id', profile.org_id)
      .single(),
    supabase
      .from('areas')
      .select('name')
      .eq('id', areaId)
      .eq('org_id', profile.org_id)
      .single(),
    supabase
      .from('action_items')
      .select('id', { count: 'exact', head: true })
      .eq('audit_id', auditId),
  ])

  if (!audit) redirect('/dashboard')

  const score = audit.score ?? 0
  const scoreColor = score >= 80 ? '#2DA870' : score >= 60 ? '#F5A623' : '#E53935'
  const scoreLabel = score >= 80 ? 'Good' : score >= 60 ? 'Needs Improvement' : 'Critical'

  const auditDate = new Date(audit.submitted_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      {/* Success header */}
      <div className="text-center mb-8">
        <div
          className="inline-flex items-center justify-center w-16 h-16 rounded-2xl text-3xl mb-4"
          style={{ background: '#EBF6F0' }}
        >
          ✅
        </div>
        <h1
          className="text-2xl font-extrabold tracking-tight mb-1"
          style={{ color: '#2D3272', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
        >
          Audit Complete
        </h1>
        <p className="text-sm" style={{ color: '#5B7FA6' }}>
          {area?.name ?? 'Area'} · {auditDate}
        </p>
      </div>

      {/* Score card */}
      <div
        className="bg-white rounded-2xl border shadow-sm p-8 flex flex-col items-center gap-3 mb-4"
        style={{ borderColor: scoreColor + '40' }}
      >
        <div
          className="text-6xl font-extrabold tabular-nums"
          style={{ color: scoreColor, fontFamily: "'Plus Jakarta Sans', sans-serif" }}
        >
          {score.toFixed(1)}%
        </div>
        <span
          className="text-sm font-bold px-3 py-1 rounded-full"
          style={{
            background: scoreColor + '20',
            color: scoreColor,
            fontFamily: "'Plus Jakarta Sans', sans-serif",
          }}
        >
          {scoreLabel}
        </span>
      </div>

      {/* AI Summary */}
      {audit.ai_summary ? (
        <div className="bg-white rounded-xl border border-[#e8edf2] shadow-sm p-6 mb-4">
          <p
            className="text-xs font-bold uppercase tracking-wider mb-3"
            style={{ color: '#5BB8D4', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            AI Summary
          </p>
          <p className="text-sm leading-relaxed" style={{ color: '#252850' }}>
            {audit.ai_summary}
          </p>
        </div>
      ) : null}

      {/* Action items callout */}
      {(actionCount ?? 0) > 0 && (
        <div className="bg-white rounded-xl border border-[#e8edf2] shadow-sm p-5 mb-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p
                className="text-sm font-bold mb-0.5"
                style={{ color: '#2D3272', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                {actionCount} action {actionCount === 1 ? 'item' : 'items'} created
              </p>
              <p className="text-sm" style={{ color: '#5B7FA6' }}>
                AI-enhanced descriptions, due in 14 days.
              </p>
            </div>
            <span
              className="flex-shrink-0 text-xs font-bold px-2.5 py-1 rounded-full"
              style={{ background: '#FDECEA', color: '#C62828', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              Open
            </span>
          </div>
        </div>
      )}

      {/* CTAs */}
      <div className="flex flex-col gap-3 mt-4">
        <Link
          href="/actions"
          className="w-full py-3.5 rounded-xl text-sm font-bold text-white text-center block"
          style={{ background: '#2D8FBF', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
        >
          View Action Items
        </Link>
        <Link
          href={`/audit/${areaId}`}
          className="w-full py-3.5 rounded-xl text-sm font-semibold text-center block border border-[#d1dae6]"
          style={{ color: '#252850', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
        >
          Start Another Audit
        </Link>
        <Link
          href="/dashboard"
          className="w-full py-3.5 rounded-xl text-sm font-semibold text-center block"
          style={{ color: '#5B7FA6', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  )
}
