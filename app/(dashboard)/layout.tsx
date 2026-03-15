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
      <nav className="sticky top-0 z-50 bg-white border-b border-[#e8edf2] relative">
        <div
          className="max-w-[1120px] mx-auto px-6 flex items-stretch justify-between"
          style={{ height: '64px' }}
        >
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center">
            <span
              className="font-extrabold text-xl tracking-tight"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: '#2D3272' }}
            >
              Pulse
              <span
                className="inline-block w-2 h-2 rounded-full ml-0.5 mb-0.5 align-middle"
                style={{ background: '#F5D800' }}
              />
            </span>
          </Link>

          {/* Nav links, user email, sign out — client component for active states + mobile */}
          <NavClient isAdmin={isAdmin} userEmail={user?.email ?? ''} />
        </div>
      </nav>

      {/* Page content */}
      <main>{children}</main>
    </div>
  )
}
