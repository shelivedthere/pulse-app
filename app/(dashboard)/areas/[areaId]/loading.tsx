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

export default function AreaDetailLoading() {
  return (
    <div style={{ maxWidth: '1120px', margin: '0 auto', padding: '40px 16px' }}>
      <style>{`
        @keyframes skeletonPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>

      {/* Back link */}
      <div style={{ marginBottom: '24px' }}>
        <Skel w={140} h={14} />
      </div>

      {/* Page header: name + badge + button */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', marginBottom: '32px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <Skel w={200} h={32} />
            <Skel w={72} h={32} radius={10} />
          </div>
          <Skel w={160} h={14} />
        </div>
        <Skel w={140} h={40} radius={12} />
      </div>

      {/* Score trend chart card */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: '12px',
          border: '1px solid #e8edf2',
          padding: '24px',
          marginBottom: '20px',
        }}
      >
        <div style={{ marginBottom: '20px' }}>
          <Skel w={100} h={16} />
        </div>
        <Skel w="100%" h={256} radius={8} />
      </div>

      {/* AI summary card */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: '12px',
          border: '1px solid #e8edf2',
          padding: '24px',
          marginBottom: '20px',
        }}
      >
        <Skel w="100%" h={96} radius={8} />
      </div>

      {/* Action items card */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: '12px',
          border: '1px solid #e8edf2',
          padding: '20px 24px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <Skel w={160} h={16} />
          <Skel w={24} h={22} radius={999} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {[0, 1, 2].map(i => (
            <Skel key={i} w="100%" h={48} radius={10} />
          ))}
        </div>
      </div>
    </div>
  )
}
