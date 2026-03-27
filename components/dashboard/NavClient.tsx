'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

const FONT = "'Plus Jakarta Sans', sans-serif"

interface Props {
  isAdmin: boolean
  userEmail: string
  userDisplayName: string | null
  userAvatarEmoji: string | null
}

function truncateDisplay(text: string, max = 20): string {
  return text.length > max ? text.slice(0, max - 1) + '…' : text
}

function NavAvatar({ displayName, email, avatarEmoji, size = 28 }: {
  displayName: string | null
  email: string
  avatarEmoji: string | null
  size?: number
}) {
  const initial = (displayName || email)[0]?.toUpperCase() ?? '?'
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: '#2D8FBF', display: 'flex',
      alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    }}>
      {avatarEmoji
        ? <span style={{ fontSize: Math.round(size * 0.55), lineHeight: 1 }}>{avatarEmoji}</span>
        : <span style={{ fontSize: Math.round(size * 0.42), fontWeight: 700, color: '#ffffff', fontFamily: FONT, lineHeight: 1 }}>{initial}</span>
      }
    </div>
  )
}

export default function NavClient({ isAdmin, userEmail, userDisplayName, userAvatarEmoji }: Props) {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const hamburgerRef = useRef<HTMLButtonElement>(null)
  const mobileMenuRef = useRef<HTMLDivElement>(null)

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

  useEffect(() => {
    function checkWidth() {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      if (!mobile) setMobileOpen(false)
    }
    checkWidth()
    window.addEventListener('resize', checkWidth)
    return () => window.removeEventListener('resize', checkWidth)
  }, [])

  useEffect(() => {
    if (!mobileOpen) return
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node
      if (
        mobileMenuRef.current?.contains(target) ||
        hamburgerRef.current?.contains(target)
      ) return
      setMobileOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [mobileOpen])

  const displayLabel = truncateDisplay(userDisplayName || userEmail)

  return (
    <>
      {/* Desktop nav */}
      <div style={{ display: isMobile ? 'none' : 'flex', alignItems: 'stretch', gap: '32px' }}>
        {navLinks.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            style={{
              display: 'flex', alignItems: 'center',
              fontSize: '14px', fontWeight: 600, fontFamily: FONT,
              color: isActive(href) ? '#2D8FBF' : '#252850',
              borderBottom: isActive(href) ? '2px solid #2D8FBF' : '2px solid transparent',
              textDecoration: 'none', whiteSpace: 'nowrap',
            }}
          >
            {label}
          </Link>
        ))}

        <div style={{ display: 'flex', alignItems: 'center' }}>
          <span style={{ width: '1px', height: '16px', background: '#e5e7eb', display: 'block' }} />
        </div>

        {/* Avatar + display name — links to /profile */}
        <Link
          href="/profile"
          title={userEmail}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            textDecoration: 'none',
          }}
        >
          <NavAvatar displayName={userDisplayName} email={userEmail} avatarEmoji={userAvatarEmoji} />
          <span style={{ fontSize: '12px', color: '#5B7FA6', fontFamily: FONT, whiteSpace: 'nowrap' }}>
            {displayLabel}
          </span>
        </Link>

        <div style={{ display: 'flex', alignItems: 'center' }}>
          <span style={{ width: '1px', height: '16px', background: '#e5e7eb', display: 'block' }} />
        </div>

        <div style={{ display: 'flex', alignItems: 'center' }}>
          <button
            onClick={handleLogout}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: '14px', fontWeight: 500, color: '#5B7FA6',
              fontFamily: FONT, padding: 0,
            }}
            onMouseEnter={e => (e.currentTarget.style.color = '#2D3272')}
            onMouseLeave={e => (e.currentTarget.style.color = '#5B7FA6')}
          >
            Sign out
          </button>
        </div>
      </div>

      {/* Mobile hamburger */}
      <button
        ref={hamburgerRef}
        onClick={() => setMobileOpen(o => !o)}
        aria-label="Toggle menu"
        style={{
          display: isMobile ? 'flex' : 'none',
          alignItems: 'center', justifyContent: 'center',
          padding: '8px', borderRadius: '8px',
          background: 'none', border: 'none',
          cursor: 'pointer', color: '#2D3272',
        }}
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

      {/* Mobile dropdown */}
      {isMobile && mobileOpen && (
        <div
          ref={mobileMenuRef}
          style={{
            position: 'absolute', top: '100%', left: 0, right: 0,
            background: '#ffffff', borderBottom: '1px solid #e5e7eb',
            boxShadow: '0 8px 24px rgba(45, 50, 114, 0.10)',
            zIndex: 100, display: 'flex', flexDirection: 'column',
          }}
        >
          {navLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              style={{
                display: 'flex', alignItems: 'center',
                minHeight: '52px', padding: '0 24px',
                fontSize: '15px', fontWeight: 600, fontFamily: FONT,
                color: isActive(href) ? '#2D8FBF' : '#252850',
                background: isActive(href) ? '#F0F7FF' : 'transparent',
                textDecoration: 'none',
                borderLeft: isActive(href) ? '3px solid #2D8FBF' : '3px solid transparent',
              }}
            >
              {label}
            </Link>
          ))}

          {/* Profile + sign out footer */}
          <div style={{ borderTop: '1px solid #e5e7eb', padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <Link
              href="/profile"
              onClick={() => setMobileOpen(false)}
              style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}
            >
              <NavAvatar displayName={userDisplayName} email={userEmail} avatarEmoji={userAvatarEmoji} />
              <span title={userEmail} style={{ fontSize: '13px', color: '#252850', fontFamily: FONT, fontWeight: 600 }}>
                {userDisplayName || userEmail}
              </span>
            </Link>
            <button
              onClick={handleLogout}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: '14px', fontWeight: 600, color: '#5B7FA6',
                fontFamily: FONT, padding: 0, textAlign: 'left', minHeight: '44px',
              }}
            >
              Sign out
            </button>
          </div>
        </div>
      )}
    </>
  )
}
