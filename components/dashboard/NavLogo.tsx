'use client'

import { useState } from 'react'

const FONT = "'Plus Jakarta Sans', sans-serif"

interface Props {
  orgLogoUrl: string | null
}

export default function NavLogo({ orgLogoUrl }: Props) {
  const [imgFailed, setImgFailed] = useState(false)

  if (orgLogoUrl && !imgFailed) {
    return (
      <img
        src={orgLogoUrl}
        alt="Company logo"
        onError={() => setImgFailed(true)}
        style={{
          maxHeight: '36px',
          width: 'auto',
          display: 'block',
          objectFit: 'contain',
        }}
      />
    )
  }

  return (
    <span
      style={{
        fontFamily: FONT,
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
  )
}
