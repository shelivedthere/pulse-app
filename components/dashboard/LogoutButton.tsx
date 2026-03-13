'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LogoutButton() {
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <button
      onClick={handleLogout}
      className="text-sm font-medium transition"
      style={{ color: '#5B7FA6', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
      onMouseEnter={e => (e.currentTarget.style.color = '#2D3272')}
      onMouseLeave={e => (e.currentTarget.style.color = '#5B7FA6')}
    >
      Sign out
    </button>
  )
}
