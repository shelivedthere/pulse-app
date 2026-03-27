'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const FONT = "'Plus Jakarta Sans', sans-serif"
const AVATARS = ['🌊', '🏄', '🐚', '🌴', '⛱️', '🐠', '☀️', '🌅', '🏖️', '🦀', '🐬', '🌺']

interface Props {
  userId: string
  initialDisplayName: string
  initialAvatarEmoji: string | null
  email: string
  role: 'admin' | 'contributor'
}

export default function ProfileClient({ userId, initialDisplayName, initialAvatarEmoji, email, role }: Props) {
  const [displayName, setDisplayName] = useState(initialDisplayName)
  const [avatarEmoji, setAvatarEmoji] = useState<string | null>(initialAvatarEmoji)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const initial = (displayName || email)[0]?.toUpperCase() ?? '?'

  async function handleAvatarSelect(emoji: string) {
    const next = avatarEmoji === emoji ? null : emoji
    setAvatarEmoji(next)
    try {
      const supabase = createClient()
      await supabase.from('profiles').update({ avatar_emoji: next }).eq('id', userId)
    } catch { /* ignore — UI is already updated optimistically */ }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setSaveError(null)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('profiles')
        .update({ display_name: displayName.trim() || null })
        .eq('id', userId)
      if (error) throw error
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch {
      setSaveError('Failed to save. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ maxWidth: '480px' }}>
      {/* Large avatar display */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '28px' }}>
        <div style={{
          width: '80px', height: '80px', borderRadius: '50%',
          background: '#2D8FBF', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
        }}>
          {avatarEmoji
            ? <span style={{ fontSize: '2.5rem', lineHeight: 1 }}>{avatarEmoji}</span>
            : <span style={{ fontSize: '2rem', fontWeight: 700, color: '#ffffff', fontFamily: FONT, lineHeight: 1 }}>{initial}</span>
          }
        </div>
      </div>

      {/* Avatar picker */}
      <div style={{ marginBottom: '32px' }}>
        <p style={{ fontSize: '13px', fontWeight: 600, color: '#2D3272', fontFamily: FONT, margin: '0 0 12px 0' }}>
          Choose your avatar
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 64px)', gap: '10px' }}>
          {AVATARS.map(emoji => (
            <button
              key={emoji}
              type="button"
              onClick={() => handleAvatarSelect(emoji)}
              style={{
                width: '64px', height: '64px', borderRadius: '50%',
                background: avatarEmoji === emoji ? '#2D8FBF' : '#f3f4f6',
                border: avatarEmoji === emoji ? '2px solid #2D8FBF' : '2px solid transparent',
                cursor: 'pointer', fontSize: '1.75rem', lineHeight: 1,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'background 0.15s', outline: 'none',
              }}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>

      {/* Profile form */}
      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '13px', fontWeight: 600, color: '#2D3272', fontFamily: FONT }}>
            Display name
          </label>
          <input
            type="text"
            value={displayName}
            onChange={e => setDisplayName(e.target.value)}
            style={{
              borderRadius: '8px', border: '1px solid #d1dae6', padding: '10px 14px',
              fontSize: '14px', color: '#252850', fontFamily: FONT, outline: 'none',
              background: '#ffffff', boxSizing: 'border-box', width: '100%',
            }}
            onFocus={e => (e.currentTarget.style.borderColor = '#2D8FBF')}
            onBlur={e => (e.currentTarget.style.borderColor = '#d1dae6')}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '13px', fontWeight: 600, color: '#2D3272', fontFamily: FONT }}>
            Email address
          </label>
          <input
            type="email"
            value={email}
            readOnly
            style={{
              borderRadius: '8px', border: '1px solid #d1dae6', padding: '10px 14px',
              fontSize: '14px', color: '#5B7FA6', fontFamily: FONT,
              background: '#f8f9fb', outline: 'none',
              boxSizing: 'border-box', width: '100%', cursor: 'default',
            }}
          />
          <p style={{ fontSize: '12px', color: '#5B7FA6', margin: 0, fontFamily: FONT }}>
            Contact your admin to change your email address
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '13px', fontWeight: 600, color: '#2D3272', fontFamily: FONT }}>
            Role
          </label>
          <div>
            <span style={{
              display: 'inline-block', fontSize: '12px', fontWeight: 700,
              borderRadius: '999px', padding: '4px 12px',
              background: role === 'admin' ? '#2D8FBF' : '#5B7FA6',
              color: '#ffffff', fontFamily: FONT,
            }}>
              {role === 'admin' ? 'Admin' : 'Contributor'}
            </span>
          </div>
        </div>

        {saveError && (
          <p style={{
            fontSize: '13px', borderRadius: '8px', background: '#fef2f2',
            border: '1px solid #fca5a5', color: '#dc2626', padding: '12px 16px', margin: 0,
          }}>
            {saveError}
          </p>
        )}

        <button
          type="submit"
          disabled={saving}
          style={{
            width: '100%', padding: '11px', borderRadius: '8px',
            background: saved ? '#2DA870' : '#2D8FBF',
            color: '#ffffff', fontSize: '14px', fontWeight: 700,
            fontFamily: FONT, border: 'none',
            cursor: saving ? 'not-allowed' : 'pointer',
            opacity: saving ? 0.7 : 1,
            transition: 'background 0.3s',
          }}
        >
          {saving ? 'Saving…' : saved ? 'Saved ✓' : 'Save changes'}
        </button>
      </form>

      <div style={{ marginTop: '20px', textAlign: 'center' }}>
        <a
          href="/auth/reset-password"
          style={{ color: '#2D8FBF', fontSize: '14px', fontWeight: 600, textDecoration: 'none', fontFamily: FONT }}
        >
          Change password →
        </a>
      </div>
    </div>
  )
}
