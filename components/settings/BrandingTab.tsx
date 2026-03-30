'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

const FONT = "'Plus Jakarta Sans', sans-serif"
const MAX_BYTES = 2 * 1024 * 1024
const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/svg+xml']

interface Props {
  orgId: string
  currentLogoUrl: string | null
}

export default function BrandingTab({ orgId, currentLogoUrl }: Props) {
  const [logoUrl, setLogoUrl] = useState<string | null>(currentLogoUrl)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    setError(null)
    setSuccess(false)
    const file = e.target.files?.[0]
    if (!file) return

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError('Please select a PNG, JPG, or SVG file.')
      e.target.value = ''
      return
    }
    if (file.size > MAX_BYTES) {
      setError('File must be under 2MB.')
      e.target.value = ''
      return
    }

    setSelectedFile(file)
    const reader = new FileReader()
    reader.onload = ev => setPreviewUrl(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  async function handleSave() {
    if (!selectedFile) return
    setUploading(true)
    setError(null)
    setSuccess(false)

    try {
      const supabase = createClient()
      const ext = selectedFile.name.split('.').pop()?.toLowerCase() ?? 'png'
      const path = `${orgId}/logo.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('org-logos')
        .upload(path, selectedFile, { upsert: true, contentType: selectedFile.type })

      if (uploadError) throw new Error(uploadError.message)

      const { data: { publicUrl } } = supabase.storage
        .from('org-logos')
        .getPublicUrl(path)

      const res = await fetch('/api/org/logo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logo_url: publicUrl }),
      })

      if (!res.ok) {
        const body = await res.json() as { error?: string }
        throw new Error(body.error ?? 'Failed to save logo URL.')
      }

      setLogoUrl(publicUrl)
      setPreviewUrl(null)
      setSelectedFile(null)
      setSuccess(true)
      if (fileInputRef.current) fileInputRef.current.value = ''
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  function handleCancel() {
    setPreviewUrl(null)
    setSelectedFile(null)
    setError(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function handleRemove() {
    setError(null)
    setSuccess(false)

    try {
      const res = await fetch('/api/org/logo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logo_url: null }),
      })

      if (!res.ok) {
        const body = await res.json() as { error?: string }
        throw new Error(body.error ?? 'Failed to remove logo.')
      }

      setLogoUrl(null)
      setPreviewUrl(null)
      setSelectedFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove logo.')
    }
  }

  const displayUrl = previewUrl ?? logoUrl

  return (
    <div style={{ maxWidth: '480px' }}>

      {/* Section heading */}
      <div style={{ marginBottom: '24px' }}>
        <h2
          style={{
            fontSize: '17px',
            fontWeight: 800,
            color: '#2D3272',
            fontFamily: FONT,
            margin: '0 0 4px 0',
          }}
        >
          Company Logo
        </h2>
        <p style={{ fontSize: '14px', color: '#5B7FA6', margin: 0 }}>
          Your logo appears in the navigation and on audit reports.
        </p>
      </div>

      {/* Logo preview */}
      <div style={{ marginBottom: '20px' }}>
        {displayUrl ? (
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px 24px',
              background: '#F5F7FA',
              border: '1.5px solid #e8edf2',
              borderRadius: '12px',
            }}
          >
            <img
              src={displayUrl}
              alt="Logo preview"
              style={{
                maxWidth: '200px',
                maxHeight: '80px',
                objectFit: 'contain',
                display: 'block',
              }}
            />
          </div>
        ) : (
          <div
            style={{
              display: 'inline-flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              padding: '28px 40px',
              background: '#F5F7FA',
              border: '2px dashed #d1dbe6',
              borderRadius: '12px',
            }}
          >
            {/* Camera icon */}
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#5B7FA6"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
            <span style={{ fontSize: '13px', color: '#5B7FA6', fontFamily: FONT }}>
              No logo uploaded yet
            </span>
          </div>
        )}
      </div>

      {/* Buttons */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '10px',
          alignItems: 'center',
          marginBottom: '12px',
        }}
      >
        <button
          onClick={() => {
            setSuccess(false)
            fileInputRef.current?.click()
          }}
          disabled={uploading}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '10px 18px',
            minHeight: '44px',
            background: '#2D8FBF',
            color: '#ffffff',
            borderRadius: '10px',
            border: 'none',
            cursor: uploading ? 'not-allowed' : 'pointer',
            fontSize: '14px',
            fontWeight: 700,
            fontFamily: FONT,
            opacity: uploading ? 0.65 : 1,
          }}
        >
          Upload Logo
        </button>

        {selectedFile && !uploading && (
          <>
            <button
              onClick={handleSave}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '10px 18px',
                minHeight: '44px',
                background: '#2DA870',
                color: '#ffffff',
                borderRadius: '10px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 700,
                fontFamily: FONT,
              }}
            >
              Save Logo
            </button>
            <button
              onClick={handleCancel}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '10px 16px',
                minHeight: '44px',
                background: 'none',
                color: '#5B7FA6',
                borderRadius: '10px',
                border: '1.5px solid #d1dbe6',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 600,
                fontFamily: FONT,
              }}
            >
              Cancel
            </button>
          </>
        )}

        {uploading && (
          <span style={{ fontSize: '14px', color: '#2D8FBF', fontFamily: FONT, fontWeight: 600 }}>
            Uploading…
          </span>
        )}

        {logoUrl && !selectedFile && !uploading && (
          <button
            onClick={handleRemove}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '10px 16px',
              minHeight: '44px',
              background: 'none',
              color: '#ef4444',
              borderRadius: '10px',
              border: '1.5px solid #fecaca',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 600,
              fontFamily: FONT,
            }}
          >
            Remove
          </button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".png,.jpg,.jpeg,.svg"
        style={{ display: 'none' }}
        onChange={handleFileSelect}
      />

      <p style={{ fontSize: '12px', color: '#5B7FA6', fontFamily: FONT, margin: '0 0 12px 0' }}>
        PNG, JPG, or SVG · max 2MB
      </p>

      {error && (
        <div
          style={{
            padding: '12px 16px',
            background: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '8px',
            fontSize: '14px',
            color: '#dc2626',
            fontFamily: FONT,
          }}
        >
          {error}
        </div>
      )}

      {success && (
        <div
          style={{
            padding: '12px 16px',
            background: '#f0fdf4',
            border: '1px solid #bbf7d0',
            borderRadius: '8px',
            fontSize: '14px',
            color: '#16a34a',
            fontFamily: FONT,
          }}
        >
          Logo saved. Refresh the page to see it in the nav.
        </div>
      )}
    </div>
  )
}
