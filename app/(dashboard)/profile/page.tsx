import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import ProfileClient from '@/components/profile/ProfileClient'

const FONT = "'Plus Jakarta Sans', sans-serif"

export default async function ProfilePage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, avatar_emoji, role')
    .eq('id', user.id)
    .single()

  return (
    <div style={{ maxWidth: '1120px', margin: '0 auto', padding: '40px 24px' }}>
      <h1
        style={{
          color: '#2D3272',
          fontFamily: FONT,
          fontSize: '1.875rem',
          fontWeight: 800,
          letterSpacing: '-0.025em',
          margin: '0 0 32px 0',
        }}
      >
        My Profile
      </h1>
      <ProfileClient
        userId={user.id}
        initialDisplayName={profile?.display_name ?? ''}
        initialAvatarEmoji={profile?.avatar_emoji ?? null}
        email={user.email ?? ''}
        role={(profile?.role ?? 'contributor') as 'admin' | 'contributor'}
      />
    </div>
  )
}
