const pulse = { animation: 'skeletonPulse 1.5s ease-in-out infinite', background: '#e5e7eb' } as const

function Skel({ w, h, radius = 6 }: { w: string | number; h: number; radius?: number }) {
  return (
    <div
      style={{
        ...pulse,
        width: typeof w === 'number' ? `${w}px` : w,
        height: `${h}px`,
        borderRadius: `${radius}px`,
        flexShrink: 0,
      }}
    />
  )
}

export default function DashboardLoading() {
  return (
    <div style={{ maxWidth: '1120px', margin: '0 auto', padding: '40px 16px' }}>
      <style>{`
        @keyframes skeletonPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <Skel w={60} h={12} />
        <div style={{ marginTop: '8px' }}>
          <Skel w={220} h={32} />
        </div>
      </div>

      {/* Summary stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '40px' }}>
        {[0, 1, 2].map(i => (
          <div
            key={i}
            style={{
              background: '#ffffff',
              borderRadius: '12px',
              border: '1px solid #e8edf2',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <Skel w={56} h={32} />
            <Skel w={72} h={12} />
          </div>
        ))}
      </div>

      {/* Section label */}
      <div style={{ marginBottom: '20px' }}>
        <Skel w={48} h={12} />
      </div>

      {/* 2 area card skeletons */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
        {[0, 1].map(i => (
          <div
            key={i}
            style={{
              background: '#ffffff',
              borderRadius: '14px',
              border: '1px solid #e8edf2',
              boxShadow: '0 2px 10px rgba(45,50,114,0.08)',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            {/* Title */}
            <Skel w={128} h={22} />
            {/* Score */}
            <Skel w={96} h={40} />
            {/* Date */}
            <Skel w={160} h={14} />
            {/* Buttons */}
            <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
              <Skel w={96} h={36} radius={8} />
              <Skel w={88} h={36} radius={8} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
