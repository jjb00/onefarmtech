export default function AdminRouteLoading({label}: {label: string}) {
  return (
    <div role="status" aria-live="polite" aria-busy="true" className="min-h-screen bg-[#f4f8ef] p-5 md:p-8 lg:p-12">
      <div className="mx-auto max-w-6xl animate-pulse">
        <div className="h-28 rounded-2xl border border-[#102015]/10 bg-white" />
        <p className="mt-5 font-black text-[#405348]">Loading {label}…</p>
        <div className="mt-4 grid gap-4 md:grid-cols-2"><div className="h-48 rounded-2xl bg-white" /><div className="h-48 rounded-2xl bg-white" /></div>
      </div>
    </div>
  );
}
