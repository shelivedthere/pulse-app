import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createServiceSupabaseClient } from '@/lib/supabase/service'
import AcceptInviteButton from './AcceptInviteButton'

interface Props {
  params: Promise<{ token: string }>
}

export default async function InvitePage({ params }: Props) {
  const { token } = await params

  // Look up invitation using service role (invited user has no org_id yet)
  const service = createServiceSupabaseClient()
  const { data: invitation } = await service
    .from('invitations')
    .select('id, org_id, area_id, email, accepted_at')
    .eq('token', token)
    .single()

  // Invalid token
  if (!invitation) {
    return (
      <InviteShell>
        <h1 className="text-2xl font-extrabold mb-2" style={{ color: '#2D3272', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          Invalid invitation
        </h1>
        <p className="text-sm" style={{ color: '#5B7FA6' }}>
          This invitation link is invalid or has expired. Please ask the administrator to send a new one.
        </p>
      </InviteShell>
    )
  }

  // Already accepted
  if (invitation.accepted_at) {
    return (
      <InviteShell>
        <h1 className="text-2xl font-extrabold mb-2" style={{ color: '#2D3272', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          Already accepted
        </h1>
        <p className="text-sm mb-6" style={{ color: '#5B7FA6' }}>
          This invitation has already been accepted.
        </p>
        <Link
          href="/dashboard"
          className="inline-block px-6 py-3 rounded-xl text-sm font-bold text-white"
          style={{ background: '#2D8FBF', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
        >
          Go to Dashboard →
        </Link>
      </InviteShell>
    )
  }

  // Fetch org and area names for display
  const [{ data: org }, { data: area }] = await Promise.all([
    service.from('organizations').select('name').eq('id', invitation.org_id).single(),
    service.from('areas').select('name').eq('id', invitation.area_id).single(),
  ])

  // Check if current user is signed in
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  const signupUrl = `/signup?invite=${token}&email=${encodeURIComponent(invitation.email)}`

  return (
    <InviteShell>
      <p
        className="text-xs font-bold uppercase tracking-wider mb-3"
        style={{ color: '#5BB8D4', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
      >
        You're invited
      </p>
      <h1
        className="text-2xl font-extrabold mb-2 tracking-tight"
        style={{ color: '#2D3272', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
      >
        Join {org?.name ?? 'Pulse'}
      </h1>
      <p className="text-sm mb-2" style={{ color: '#5B7FA6' }}>
        You've been invited to join as a contributor for the{' '}
        <strong style={{ color: '#252850' }}>{area?.name ?? 'assigned area'}</strong>.
      </p>
      <p className="text-sm mb-8" style={{ color: '#5B7FA6' }}>
        Invitation for: <strong style={{ color: '#252850' }}>{invitation.email}</strong>
      </p>

      {user ? (
        user.email?.toLowerCase() === invitation.email.toLowerCase() ? (
          <AcceptInviteButton token={token} />
        ) : (
          <div>
            <p
              className="text-sm rounded-xl bg-[#FFF8E6] border border-[#F5D800] px-4 py-3 mb-4"
              style={{ color: '#252850', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              You're signed in as <strong>{user.email}</strong>, but this invitation was sent to{' '}
              <strong>{invitation.email}</strong>. Please sign in with the correct email to continue.
            </p>
            <Link
              href={`/login?redirect=/invite/${token}`}
              className="inline-block px-5 py-2.5 rounded-xl text-sm font-bold text-white"
              style={{ background: '#2D8FBF', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              Sign in with {invitation.email}
            </Link>
          </div>
        )
      ) : (
        <div className="flex flex-col gap-3">
          <Link
            href={signupUrl}
            className="inline-block px-6 py-3 rounded-xl text-sm font-bold text-white text-center"
            style={{ background: '#2D8FBF', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            Create account to accept →
          </Link>
          <Link
            href={`/login?redirect=/invite/${token}`}
            className="inline-block px-6 py-3 rounded-xl text-sm font-semibold border border-[#d1dae6] text-center"
            style={{ color: '#2D3272', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            Already have an account? Sign in
          </Link>
        </div>
      )}
    </InviteShell>
  )
}

function InviteShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F5F7FA] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <a href="/" className="inline-block">
            <span
              className="font-extrabold text-2xl tracking-tight"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: '#2D3272' }}
            >
              Pulse
              <span
                className="inline-block w-2.5 h-2.5 rounded-full ml-0.5 mb-0.5 align-middle"
                style={{ background: '#F5D800' }}
              />
            </span>
          </a>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-[#e8edf2] px-8 py-10">
          {children}
        </div>
      </div>
    </div>
  )
}
