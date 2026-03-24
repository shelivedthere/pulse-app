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

export default function ActionsLoading() {
  return (
    <div style={{ maxWidth: '1120px', margin: '0 auto', padding: '40px 24px' }}>
      <style>{`
        @keyframes skeletonPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>

      {/* Page header */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <Skel w={160} h={32} />
          <Skel w={32} h={22} radius={999} />
        </div>
        <Skel w={220} h={14} />
      </div>

      {/* Filter bar */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
        <Skel w={120} h={38} radius={8} />
        <Skel w={120} h={38} radius={8} />
      </div>

      {/* 3 action item card skeletons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {[0, 1, 2].map(i => (
          <div
            key={i}
            style={{
              background: '#ffffff',
              borderRadius: '12px',
              border: '1px solid #e8edf2',
              borderLeft: '4px solid #e5e7eb',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
            }}
          >
            {/* Top row: area badge + status */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Skel w={80} h={24} radius={999} />
              <Skel w={96} h={28} radius={8} />
            </div>
            {/* Description */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <Skel w="100%" h={14} />
              <Skel w="75%" h={14} />
            </div>
            {/* Owner + due date */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <Skel w="100%" h={36} radius={8} />
              <Skel w={120} h={14} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
