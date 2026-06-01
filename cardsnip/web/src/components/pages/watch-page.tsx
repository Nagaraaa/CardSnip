"use client";

import { useMemo, useState } from "react";
import { AppPanel, CardSnipAppShell } from "@/components/cardsnip-app-shell";
import { ProductThumb, StatusBadge } from "@/components/product-ui";
import {
  WatchCategory,
  WatchPriority,
  WatchSource,
  watchSignals,
  watchTimeline,
} from "@/data/mock-watch";

type CategoryFilter = WatchCategory | "Toutes";
type SourceFilter = WatchSource | "Toutes";
type PriorityFilter = WatchPriority | "Toutes";

const categoryFilters: CategoryFilter[] = ["Toutes", "ETB", "Display", "Booster", "Collection"];
const sourceFilters: SourceFilter[] = ["Toutes", "Officiel", "Boutiques", "Communauté", "CardSnip"];
const priorityFilters: PriorityFilter[] = ["Toutes", "Haute", "Moyenne", "Basse"];

function priorityTone(priority: WatchPriority) {
  if (priority === "Haute") return "green";
  if (priority === "Moyenne") return "amber";
  return "gray";
}

function sourceTone(source: WatchSource) {
  if (source === "Officiel") return "violet";
  if (source === "Boutiques") return "green";
  if (source === "Communauté") return "amber";
  return "gray";
}

function categoryLabel(category: WatchCategory) {
  if (category === "Display") return "DISP";
  if (category === "Booster") return "BST";
  if (category === "Collection") return "COLL";
  return category;
}

export function WatchPage() {
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("Toutes");
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>("Toutes");
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>("Toutes");
  const [query, setQuery] = useState("");

  const filteredSignals = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return watchSignals
      .filter((signal) => {
        const matchesCategory = categoryFilter === "Toutes" || signal.category === categoryFilter;
        const matchesSource = sourceFilter === "Toutes" || signal.source === sourceFilter;
        const matchesPriority = priorityFilter === "Toutes" || signal.priority === priorityFilter;
        const matchesQuery =
          normalizedQuery.length === 0 ||
          signal.product.toLowerCase().includes(normalizedQuery) ||
          signal.title.toLowerCase().includes(normalizedQuery);

        return matchesCategory && matchesSource && matchesPriority && matchesQuery;
      })
      .sort((a, b) => b.confidence - a.confidence);
  }, [categoryFilter, priorityFilter, query, sourceFilter]);

  const highPriorityCount = watchSignals.filter((signal) => signal.priority === "Haute").length;
  const officialCount = watchSignals.filter((signal) => signal.source === "Officiel").length;
  const averageConfidence = Math.round(
    watchSignals.reduce((total, signal) => total + signal.confidence, 0) / watchSignals.length,
  );

  return (
    <CardSnipAppShell
      title="Veille TCG"
      subtitle="Centralise les sorties, précommandes, restocks et signaux communautaires avant qu'ils deviennent des deals."
    >
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-4">
          <div className="grid gap-3 md:grid-cols-3">
            <AppPanel className="p-4">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-500">Signaux suivis</p>
              <p className="mt-2 text-3xl font-semibold text-white">{watchSignals.length}</p>
              <p className="mt-1 text-sm text-zinc-400">Sorties, restocks et rumeurs qualifiées</p>
            </AppPanel>
            <AppPanel className="p-4">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-500">Priorité haute</p>
              <p className="mt-2 text-3xl font-semibold text-emerald-300">{highPriorityCount}</p>
              <p className="mt-1 text-sm text-zinc-400">À transformer en alerte produit</p>
            </AppPanel>
            <AppPanel className="p-4">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-500">Confiance moyenne</p>
              <p className="mt-2 text-3xl font-semibold text-violet-200">{averageConfidence}%</p>
              <p className="mt-1 text-sm text-zinc-400">{officialCount} signal officiel mocké</p>
            </AppPanel>
          </div>

          <AppPanel className="overflow-hidden">
            <div className="border-b border-white/10 p-4 md:p-5">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className="text-base font-semibold text-white">Radar sorties & restocks</h2>
                  <p className="mt-1 text-sm text-zinc-400">
                    Sert à décider quels produits ajouter ensuite au suivi prix/stock.
                  </p>
                </div>
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Chercher une extension, ETB, display..."
                  className="min-w-0 rounded-xl border border-white/10 bg-zinc-950 px-3 py-2 text-sm text-zinc-200 outline-none transition placeholder:text-zinc-600 hover:border-violet-400/40 focus:border-violet-400/70 lg:w-80"
                />
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {categoryFilters.map((category) => (
                  <button
                    key={category}
                    type="button"
                    onClick={() => setCategoryFilter(category)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                      categoryFilter === category
                        ? "border-violet-400/50 bg-violet-500/15 text-violet-100"
                        : "border-white/10 bg-white/[0.03] text-zinc-400 hover:border-white/20 hover:text-zinc-200"
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {sourceFilters.map((source) => (
                  <button
                    key={source}
                    type="button"
                    onClick={() => setSourceFilter(source)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                      sourceFilter === source
                        ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-200"
                        : "border-white/10 bg-white/[0.03] text-zinc-400 hover:border-white/20 hover:text-zinc-200"
                    }`}
                  >
                    {source}
                  </button>
                ))}
              </div>
            </div>

            <div className="divide-y divide-white/8">
              {filteredSignals.map((signal) => (
                <article
                  key={signal.id}
                  className="grid gap-4 p-4 transition hover:bg-white/[0.025] lg:grid-cols-[minmax(0,1fr)_220px] lg:items-center md:p-5"
                >
                  <div className="flex min-w-0 gap-4">
                    <ProductThumb tone={signal.tone} label={categoryLabel(signal.category)} />
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold text-white">{signal.title}</h3>
                        <StatusBadge tone={priorityTone(signal.priority)}>{signal.priority}</StatusBadge>
                        <StatusBadge tone={sourceTone(signal.source)}>{signal.source}</StatusBadge>
                      </div>
                      <p className="mt-1 text-sm font-medium text-zinc-300">{signal.product}</p>
                      <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-400">{signal.summary}</p>
                      <div className="mt-3 flex flex-wrap gap-2 text-xs text-zinc-500">
                        <span>{signal.status}</span>
                        <span>•</span>
                        <span>Fenêtre : {signal.eta}</span>
                        <span>•</span>
                        <span>{signal.action}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-zinc-500">Confiance</span>
                      <span className="font-semibold text-white">{signal.confidence}%</span>
                    </div>
                    <div className="mt-2 h-2 rounded-full bg-white/[0.06]">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-violet-400 to-emerald-300"
                        style={{ width: `${signal.confidence}%` }}
                      />
                    </div>
                    <button
                      type="button"
                      className="mt-4 w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm font-semibold text-zinc-200 transition hover:border-violet-400/40 hover:bg-violet-500/10 hover:text-white"
                    >
                      Préparer le suivi
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </AppPanel>
        </div>

        <div className="space-y-4">
          <AppPanel className="p-5">
            <h2 className="text-base font-semibold text-white">Priorité</h2>
            <p className="mt-2 text-sm leading-6 text-zinc-400">
              La veille sert à repérer un produit avant de le surveiller vraiment. Quand un signal devient fiable,
              CardSnip le transforme en produit suivi avec target price, stock et alertes.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {priorityFilters.map((priority) => (
                <button
                  key={priority}
                  type="button"
                  onClick={() => setPriorityFilter(priority)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                    priorityFilter === priority
                      ? "border-violet-400/50 bg-violet-500/15 text-violet-100"
                      : "border-white/10 bg-white/[0.03] text-zinc-400 hover:border-white/20 hover:text-zinc-200"
                  }`}
                >
                  {priority}
                </button>
              ))}
            </div>
          </AppPanel>

          <AppPanel className="p-5">
            <h2 className="text-base font-semibold text-white">Timeline</h2>
            <div className="mt-4 space-y-4">
              {watchTimeline.map((item) => (
                <div key={item.id} className="relative pl-5">
                  <span className="absolute left-0 top-1.5 h-2.5 w-2.5 rounded-full bg-violet-300 shadow-[0_0_18px_rgba(196,181,253,0.45)]" />
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">{item.date}</p>
                  <p className="mt-1 text-sm font-semibold text-white">{item.title}</p>
                  <p className="mt-1 text-sm leading-6 text-zinc-400">{item.detail}</p>
                  <p className="mt-1 text-xs text-zinc-500">{item.source}</p>
                </div>
              ))}
            </div>
          </AppPanel>

          <AppPanel className="p-5">
            <h2 className="text-base font-semibold text-white">APIs futures</h2>
            <div className="mt-4 space-y-3 text-sm leading-6 text-zinc-400">
              <p>
                <span className="font-semibold text-zinc-200">Catalogue :</span> récupérer noms, extensions et images
                propres des produits sealed.
              </p>
              <p>
                <span className="font-semibold text-zinc-200">Prix :</span> stocker uniquement les observations
                CardSnip et sources autorisées.
              </p>
              <p>
                <span className="font-semibold text-zinc-200">Alertes :</span> Discord d&apos;abord, email plus tard.
              </p>
            </div>
          </AppPanel>
        </div>
      </div>
    </CardSnipAppShell>
  );
}
