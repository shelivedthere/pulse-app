import Link from 'next/link'
import NavClient from '@/components/dashboard/NavClient'
import NavLogo from '@/components/dashboard/NavLogo'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  let isAdmin = false
  let displayName: string | null = null
  let avatarEmoji: string | null = null
  let orgLogoUrl: string | null = null
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('org_id, role, display_name, avatar_emoji')
      .eq('id', user.id)
      .single()
    isAdmin = profile?.role === 'admin'
    displayName = profile?.display_name ?? null
    avatarEmoji = profile?.avatar_emoji ?? null

    if (profile?.org_id) {
      const { data: org } = await supabase
        .from('organizations')
        .select('logo_url')
        .eq('id', profile.org_id)
        .single()
      orgLogoUrl = org?.logo_url ?? null
    }
  }

  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      {/* Navbar */}
      <nav
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          background: '#ffffff',
          borderBottom: '1px solid #e5e7eb',
        }}
      >
        <div
          style={{
            maxWidth: '1120px',
            margin: '0 auto',
            padding: '0 24px',
            display: 'flex',
            alignItems: 'stretch',
            justifyContent: 'space-between',
            height: '64px',
            position: 'relative',
          }}
        >
          {/* Logo */}
          <Link
            href="/dashboard"
            style={{
              display: 'flex',
              alignItems: 'center',
              textDecoration: 'none',
            }}
          >
            <NavLogo orgLogoUrl={orgLogoUrl} />
          </Link>

          {/* Nav links, user info, sign out — client component for active states + mobile */}
          <NavClient isAdmin={isAdmin} userEmail={user?.email ?? ''} userDisplayName={displayName} userAvatarEmoji={avatarEmoji} />
        </div>
      </nav>

      {/* Page content */}
      <main>
        <div style={{
          paddingLeft: '1rem',
          paddingRight: '1rem',
          maxWidth: '64rem',
          marginLeft: 'auto',
          marginRight: 'auto',
        }}>
          {children}
        </div>
      </main>
    </div>
  )
}
