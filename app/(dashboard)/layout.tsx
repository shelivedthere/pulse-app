import Link from 'next/link'
import LogoutButton from '@/components/dashboard/LogoutButton'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white border-b border-[#e8edf2]">
        <div
          className="max-w-[1120px] mx-auto px-6 flex items-center justify-between"
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

          {/* Nav links */}
          <div className="flex items-center gap-8">
            <Link
              href="/dashboard"
              className="text-sm font-semibold transition"
              style={{ color: '#252850', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              Dashboard
            </Link>
            <Link
              href="/actions"
              className="text-sm font-semibold transition"
              style={{ color: '#252850', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              Actions
            </Link>
            <Link
              href="/settings"
              className="text-sm font-semibold transition"
              style={{ color: '#252850', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              Settings
            </Link>
          </div>

          {/* Right: sign out */}
          <LogoutButton />
        </div>
      </nav>

      {/* Page content */}
      <main>{children}</main>
    </div>
  )
}
