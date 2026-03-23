import Link from 'next/link'
import NavClient from '@/components/dashboard/NavClient'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  let isAdmin = false
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    isAdmin = profile?.role === 'admin'
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
            <span
              style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                color: '#2D3272',
                fontWeight: 800,
                fontSize: '20px',
                letterSpacing: '-0.02em',
                lineHeight: 1,
              }}
            >
              Pulse
              <span
                style={{
                  display: 'inline-block',
                  width: '7px',
                  height: '7px',
                  borderRadius: '50%',
                  background: '#F5D800',
                  marginLeft: '2px',
                  marginBottom: '2px',
                  verticalAlign: 'middle',
                }}
              />
            </span>
          </Link>

          {/* Nav links, user email, sign out — client component for active states + mobile */}
          <NavClient isAdmin={isAdmin} userEmail={user?.email ?? ''} />
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
