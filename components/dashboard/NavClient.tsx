'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Props {
  isAdmin: boolean
  userEmail: string
}

export default function NavClient({ isAdmin, userEmail }: Props) {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  const isActive = (href: string) =>
    pathname === href || (href !== '/dashboard' && pathname.startsWith(href))

  const navLinks = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/actions', label: 'Actions' },
    ...(isAdmin ? [{ href: '/settings', label: 'Settings' }] : []),
  ]

  return (
    <>
      {/* Desktop nav links + user info */}
      <div className="hidden sm:flex items-stretch gap-8">
        {navLinks.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center text-sm font-semibold border-b-2 transition-colors"
            style={{
              color: isActive(href) ? '#2D8FBF' : '#252850',
              borderColor: isActive(href) ? '#2D8FBF' : 'transparent',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}
          >
            {label}
          </Link>
        ))}

        {/* Separator */}
        <div className="flex items-center">
          <span className="w-px h-4 bg-[#e8edf2]" />
        </div>

        {/* User email */}
        <div className="flex items-center">
          <span
            className="text-xs truncate max-w-[180px]"
            style={{ color: '#5B7FA6', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            title={userEmail}
          >
            {userEmail}
          </span>
        </div>

        {/* Sign out */}
        <div className="flex items-center">
          <button
            onClick={handleLogout}
            className="text-sm font-medium transition"
            style={{ color: '#5B7FA6', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            onMouseEnter={e => (e.currentTarget.style.color = '#2D3272')}
            onMouseLeave={e => (e.currentTarget.style.color = '#5B7FA6')}
          >
            Sign out
          </button>
        </div>
      </div>

      {/* Mobile hamburger */}
      <button
        className="sm:hidden flex items-center justify-center p-2 rounded-lg"
        onClick={() => setMobileOpen(o => !o)}
        aria-label="Toggle menu"
        style={{ color: '#2D3272' }}
      >
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
          {mobileOpen ? (
            <>
              <path d="M5 5L17 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <path d="M17 5L5 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </>
          ) : (
            <>
              <path d="M3 6h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <path d="M3 11h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <path d="M3 16h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </>
          )}
        </svg>
      </button>

      {/* Mobile dropdown menu */}
      {mobileOpen && (
        <div
          className="sm:hidden absolute top-full left-0 right-0 bg-white border-b border-[#e8edf2] shadow-md px-6 py-5 flex flex-col gap-4"
          style={{ zIndex: 100 }}
        >
          {navLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              className="text-sm font-semibold"
              style={{
                color: isActive(href) ? '#2D8FBF' : '#252850',
                fontFamily: "'Plus Jakarta Sans', sans-serif",
              }}
            >
              {label}
            </Link>
          ))}
          <div className="border-t border-[#e8edf2] pt-4 flex flex-col gap-3">
            <span
              className="text-xs truncate"
              style={{ color: '#5B7FA6', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              {userEmail}
            </span>
            <button
              onClick={handleLogout}
              className="text-sm font-semibold text-left"
              style={{ color: '#5B7FA6', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              Sign out
            </button>
          </div>
        </div>
      )}
    </>
  )
}
