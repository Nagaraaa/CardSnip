"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="min-h-screen bg-[#05060a] text-zinc-100">
      <div className="mx-auto flex min-h-screen max-w-5xl items-center justify-center px-6">
        <section className="w-full max-w-lg rounded-2xl border border-red-300/15 bg-white/[0.035] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.35)]">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-red-200">Erreur interface</p>
          <h1 className="mt-3 text-2xl font-semibold text-white">CardSnip n&apos;a pas pu afficher cette vue.</h1>
          <p className="mt-3 text-sm leading-6 text-zinc-400">
            Relance l&apos;affichage. Si l&apos;erreur revient, vérifie que FastAPI et Next.js sont bien lancés.
          </p>
          <p className="mt-4 rounded-xl border border-white/10 bg-black/30 p-3 text-xs text-zinc-500">
            {error.message || "Erreur React non détaillée."}
          </p>
          <button
            type="button"
            onClick={reset}
            className="mt-5 rounded-lg bg-violet-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-400"
          >
            Réessayer
          </button>
        </section>
      </div>
    </main>
  );
}
