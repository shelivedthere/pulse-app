// Placeholder — F03 (Organization & Area Management) builds this out fully.
// New users land here after signup to create their organization.
export default function OnboardingPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F5F7FA] px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-[#e8edf2] px-8 py-12 text-center">
        <span
          className="inline-block font-extrabold text-2xl tracking-tight mb-6"
          style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: '#2D3272' }}
        >
          Pulse
          <span
            className="inline-block w-2.5 h-2.5 rounded-full ml-0.5 mb-0.5 align-middle"
            style={{ background: '#F5D800' }}
          />
        </span>
        <h1
          className="text-xl font-extrabold mb-3 tracking-tight"
          style={{ color: '#2D3272', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
        >
          Let&apos;s set up your organization
        </h1>
        <p className="text-sm" style={{ color: '#5B7FA6', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          This is where you&apos;ll name your org and add your first areas. Coming in the next step.
        </p>
      </div>
    </div>
  )
}
