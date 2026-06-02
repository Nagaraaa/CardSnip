"use client";

import Link from "next/link";

const floatingCards = [
  { label: "ETB", color: "from-violet-400 to-fuchsia-500", position: "left-[3%] top-[12%]", delay: "0s" },
  { label: "151", color: "from-sky-300 to-violet-400", position: "right-[12%] top-[14%]", delay: "1.3s" },
  { label: "EX", color: "from-emerald-300 to-cyan-400", position: "left-[5%] bottom-[7%]", delay: "0.7s" },
  { label: "SR", color: "from-amber-200 to-rose-400", position: "right-[18%] bottom-[16%]", delay: "1.9s" },
];

const featureCards = [
  {
    title: "Prix observés",
    text: "Suivi local des checks avec prix cible, variation et historique prêt pour les vraies données.",
  },
  {
    title: "Stock surveillé",
    text: "Statuts boutique, retours en stock et alertes propres sans scraping réel dans cette phase.",
  },
  {
    title: "Mode admin MVP",
    text: "Un compte local déjà connecté pour piloter le dashboard sans auth complexe pour l’instant.",
  },
];

function BrandWordmark() {
  return (
    <span className="cardsnip-wordmark relative inline-flex items-baseline text-2xl font-black tracking-tight text-white">
      <span>Card</span>
      <span className="cardsnip-wordmark-accent ml-0.5">Snip</span>
    </span>
  );
}

function MiniCard({ label, color, position, delay }: (typeof floatingCards)[number]) {
  return (
    <div
      className={`pointer-events-none absolute z-0 hidden h-28 w-20 rotate-6 rounded-2xl border border-white/20 bg-gradient-to-br ${color} p-1 opacity-60 shadow-[0_24px_80px_rgba(124,58,237,0.22)] blur-[0.1px] sm:block ${position}`}
      style={{ animation: `cardFloat 7s ease-in-out ${delay} infinite` }}
    >
      <div className="grid h-full place-items-center rounded-xl border border-white/30 bg-black/25 text-lg font-black tracking-[0.18em] text-white">
        {label}
      </div>
    </div>
  );
}

export function CardSnipHome() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#070910] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_24%,rgba(139,92,246,0.22),transparent_34rem),radial-gradient(circle_at_20%_80%,rgba(16,185,129,0.08),transparent_22rem),radial-gradient(circle_at_82%_78%,rgba(59,130,246,0.1),transparent_24rem)]" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-300/60 to-transparent" />

      {floatingCards.map((card) => (
        <MiniCard key={card.label} {...card} />
      ))}

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-7xl flex-col px-5 py-5 sm:px-8">
        <header className="flex items-center justify-between">
          <div className="flex min-h-10 items-center">
            <BrandWordmark />
          </div>
          <Link
            href="/dashboard"
            className="rounded-lg border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-semibold text-zinc-200 transition hover:border-violet-300/30 hover:bg-violet-400/10 hover:text-white"
          >
            Connexion admin
          </Link>
        </header>

        <section className="grid flex-1 items-center gap-10 py-16 lg:grid-cols-[minmax(0,1fr)_420px]">
          <div className="max-w-3xl">
            <div className="inline-flex rounded-full border border-violet-300/20 bg-violet-300/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-violet-200">
              MVP local TCG
            </div>
            <h1 className="mt-6 max-w-4xl text-5xl font-semibold tracking-normal text-white sm:text-6xl lg:text-7xl">
              Surveille tes deals sealed avant qu’ils disparaissent.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-zinc-400 sm:text-lg">
              CardSnip prépare ton futur cockpit TCG : prix cible, stock, alertes et historique produit dans une
              interface sombre, rapide et prête à être branchée au backend.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/dashboard"
                className="inline-flex h-12 items-center justify-center rounded-xl bg-violet-500 px-6 text-sm font-bold text-white shadow-[0_18px_50px_rgba(139,92,246,0.28)] transition hover:bg-violet-400"
              >
                Entrer en mode admin
              </Link>
              <a
                href="#preview"
                className="inline-flex h-12 items-center justify-center rounded-xl border border-white/10 bg-white/[0.035] px-6 text-sm font-semibold text-zinc-300 transition hover:bg-white/[0.06] hover:text-white"
              >
                Voir le concept
              </a>
            </div>

            <div className="mt-8 flex flex-wrap gap-2 text-xs font-medium text-zinc-400">
              <span className="rounded-full border border-white/10 bg-white/[0.035] px-3 py-1">Admin local connecté</span>
              <span className="rounded-full border border-white/10 bg-white/[0.035] px-3 py-1">Données mockées</span>
              <span className="rounded-full border border-white/10 bg-white/[0.035] px-3 py-1">Backend plus tard</span>
            </div>
          </div>

          <div id="preview" className="relative">
            <div className="absolute -inset-8 rounded-[2rem] bg-violet-500/10 blur-3xl" />
            <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#0d1019]/90 p-4 shadow-[0_30px_90px_rgba(0,0,0,0.35)]">
              <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-violet-300">Deal détecté</p>
                  <h2 className="mt-1 text-lg font-semibold">ETB Édition Démo</h2>
                </div>
                <span className="rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-300">
                  En stock
                </span>
              </div>

              <div className="mt-5 grid gap-3">
                <div className="flex items-center gap-4 rounded-xl border border-white/[0.06] bg-white/[0.025] p-3">
                  <div className="grid h-20 w-14 shrink-0 place-items-center rounded-xl border border-violet-200/30 bg-gradient-to-br from-violet-400 via-fuchsia-400 to-sky-300 text-sm font-black text-white shadow-[0_16px_50px_rgba(139,92,246,0.22)]">
                    TCG
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">Kuro Star</p>
                    <p className="mt-1 text-xs text-zinc-500">Prix actuel observé</p>
                    <p className="mt-2 text-3xl font-semibold">59,90 EUR</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-xl border border-white/[0.06] bg-white/[0.025] p-3">
                    <p className="text-xs text-zinc-500">Cible</p>
                    <p className="mt-1 font-semibold text-violet-200">65,00 EUR</p>
                  </div>
                  <div className="rounded-xl border border-white/[0.06] bg-white/[0.025] p-3">
                    <p className="text-xs text-zinc-500">Diff.</p>
                    <p className="mt-1 font-semibold text-emerald-300">-33%</p>
                  </div>
                  <div className="rounded-xl border border-white/[0.06] bg-white/[0.025] p-3">
                    <p className="text-xs text-zinc-500">Score</p>
                    <p className="mt-1 font-semibold text-emerald-300">Excellent</p>
                  </div>
                </div>

                <div className="h-28 rounded-xl border border-white/[0.06] bg-black/20 p-4">
                  <div className="h-full rounded-lg bg-[linear-gradient(135deg,transparent_0%,transparent_10%,rgba(167,139,250,0.25)_10%,rgba(167,139,250,0.25)_12%,transparent_12%),linear-gradient(to_top,rgba(139,92,246,0.18),transparent)]" />
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
