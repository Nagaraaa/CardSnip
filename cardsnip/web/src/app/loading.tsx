export default function Loading() {
  return (
    <main className="min-h-screen bg-[#05060a] text-zinc-100">
      <div className="mx-auto flex min-h-screen max-w-5xl items-center justify-center px-6">
        <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/[0.035] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.35)]">
          <div className="h-2 w-28 rounded-full bg-violet-400/70" />
          <div className="mt-6 space-y-3">
            <div className="h-4 w-3/4 animate-pulse rounded-full bg-white/10" />
            <div className="h-4 w-1/2 animate-pulse rounded-full bg-white/10" />
            <div className="h-20 animate-pulse rounded-xl bg-white/[0.06]" />
          </div>
          <p className="mt-5 text-sm text-zinc-400">Chargement de CardSnip...</p>
        </div>
      </div>
    </main>
  );
}
