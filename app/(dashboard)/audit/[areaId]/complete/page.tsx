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

  const scoreColor = score >= 80 ? '#2DA870' : score >= 60 ? '#F5D800' : '#ef4444'
  const scoreTextColor = score >= 60 && score < 80 ? '#252850' : scoreColor

  const scoreLabel =
    score >= 90 ? 'Excellent ✓' :
    score >= 80 ? 'Good' :
    score >= 60 ? 'Needs Attention' :
    'Action Required'

  const auditDate = new Date(audit.submitted_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  const actions = actionCount ?? 0

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        padding: '40px 16px',
        backgroundColor: '#f4f6f9',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '480px',
          backgroundColor: '#ffffff',
          borderRadius: '20px',
          boxShadow: '0 4px 24px rgba(45, 50, 114, 0.10)',
          padding: '40px 32px 36px',
        }}
      >
        {/* Top icon + heading */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: '#EBF6F0',
              fontSize: '28px',
              marginBottom: '16px',
            }}
          >
            ✓
          </div>
          <h1
            style={{
              fontSize: '1.5rem',
              fontWeight: 800,
              color: '#2D3272',
              margin: '0 0 4px',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}
          >
            Audit Complete
          </h1>
        </div>

        {/* Score */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div
            style={{
              fontSize: '5rem',
              fontWeight: 700,
              color: scoreTextColor,
              lineHeight: 1,
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              marginBottom: '10px',
            }}
          >
            {score.toFixed(1)}%
          </div>
          <div
            style={{
              fontSize: '1rem',
              fontWeight: 700,
              color: scoreTextColor,
              marginBottom: '8px',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}
          >
            {scoreLabel}
          </div>
          <div style={{ fontSize: '0.85rem', color: '#5B7FA6' }}>
            {area?.name ?? 'Area'} · {auditDate}
          </div>
        </div>

        {/* AI Summary */}
        {audit.ai_summary ? (
          <div
            style={{
              backgroundColor: 'rgba(91, 184, 212, 0.12)',
              borderRadius: '12px',
              padding: '18px 20px',
              marginBottom: '20px',
            }}
          >
            <p
              style={{
                fontSize: '0.7rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: '#2D8FBF',
                margin: '0 0 10px',
                fontFamily: "'Plus Jakarta Sans', sans-serif",
              }}
            >
              ✨ AI Summary
            </p>
            <p
              style={{
                fontSize: '0.9rem',
                lineHeight: 1.6,
                color: '#252850',
                margin: 0,
              }}
            >
              {audit.ai_summary}
            </p>
          </div>
        ) : null}

        {/* Action Items */}
        <div
          style={{
            borderRadius: '12px',
            border: '1px solid #e8edf2',
            padding: '18px 20px',
            marginBottom: '28px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '14px',
          }}
        >
          <span
            style={{
              flexShrink: 0,
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              backgroundColor: '#EBF6F0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '14px',
              color: '#2DA870',
              fontWeight: 700,
            }}
          >
            ✓
          </span>
          <div>
            {actions > 0 ? (
              <>
                <p
                  style={{
                    fontSize: '0.95rem',
                    fontWeight: 700,
                    color: '#2D3272',
                    margin: '0 0 4px',
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                  }}
                >
                  {actions} action {actions === 1 ? 'item' : 'items'} created
                </p>
                <p style={{ fontSize: '0.85rem', color: '#5B7FA6', margin: 0 }}>
                  AI-enhanced descriptions ready to assign
                </p>
              </>
            ) : (
              <p
                style={{
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  color: '#2D3272',
                  margin: 0,
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                }}
              >
                🎉 No findings — great audit!
              </p>
            )}
          </div>
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <Link
            href="/actions"
            style={{
              display: 'block',
              width: '100%',
              minHeight: '52px',
              backgroundColor: '#2D8FBF',
              color: '#ffffff',
              borderRadius: '12px',
              textAlign: 'center',
              fontWeight: 700,
              fontSize: '0.95rem',
              textDecoration: 'none',
              lineHeight: '52px',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              boxSizing: 'border-box',
            }}
          >
            View Action Items →
          </Link>
          <Link
            href="/dashboard"
            style={{
              display: 'block',
              width: '100%',
              minHeight: '52px',
              backgroundColor: '#ffffff',
              color: '#2D8FBF',
              border: '2px solid #2D8FBF',
              borderRadius: '12px',
              textAlign: 'center',
              fontWeight: 600,
              fontSize: '0.95rem',
              textDecoration: 'none',
              lineHeight: '48px',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              boxSizing: 'border-box',
            }}
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
