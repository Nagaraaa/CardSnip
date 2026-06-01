"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { DealScore, deals } from "@/data/mock-dashboard";
import { AppPanel, CardSnipAppShell } from "@/components/cardsnip-app-shell";
import { parseEuroPrice, ProductThumb, scoreOrder, scoreTone, StatusBadge } from "@/components/product-ui";

type ScoreFilter = DealScore | "Tous";
type SourceFilter = "Toutes" | "Boutiques" | "Communauté";
type SortMode = "score" | "reduction" | "prix";

const scoreFilters: ScoreFilter[] = ["Tous", "Excellent", "Bon", "Moyen", "Faible"];
const sourceFilters: SourceFilter[] = ["Toutes", "Boutiques", "Communauté"];

const communitySignals = [
  {
    id: "dealabs-151",
    source: "Dealabs",
    title: "ETB 151 repérée sous 60 EUR",
    heat: "+218",
    status: "Confirmé",
    time: "il y a 4 min",
  },
  {
    id: "twitter-prism",
    source: "X / Twitter",
    title: "Restock Display Évolutions Prismatiques",
    heat: "+74",
    status: "À vérifier",
    time: "il y a 12 min",
  },
  {
    id: "discord-bundle",
    source: "Discord",
    title: "Bundle 151 disponible chez Otakuland",
    heat: "+41",
    status: "Nouveau",
    time: "il y a 19 min",
  },
];

function discountValue(discount: string) {
  return Math.abs(Number(discount.replace("%", "")));
}

function sourceForDeal(index: number): SourceFilter {
  return index === 1 || index === 3 ? "Communauté" : "Boutiques";
}

function bestDealLabel(score: DealScore) {
  if (score === "Excellent") return "Achetable maintenant";
  if (score === "Bon") return "À surveiller";
  if (score === "Moyen") return "Comparer avant achat";
  return "Peu intéressant";
}

export function DealsPage() {
  const [query, setQuery] = useState("");
  const [scoreFilter, setScoreFilter] = useState<ScoreFilter>("Tous");
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>("Toutes");
  const [sortMode, setSortMode] = useState<SortMode>("score");

  const enrichedDeals = useMemo(
    () =>
      deals.map((deal, index) => ({
        ...deal,
        sourceType: sourceForDeal(index),
        reduction: discountValue(deal.discount),
        price: parseEuroPrice(deal.currentPrice),
      })),
    [],
  );

  const filteredDeals = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return enrichedDeals
      .filter((deal) => {
        const matchesQuery =
          normalizedQuery.length === 0 ||
          deal.product.toLowerCase().includes(normalizedQuery) ||
          deal.shop.toLowerCase().includes(normalizedQuery);
        const matchesScore = scoreFilter === "Tous" || deal.score === scoreFilter;
        const matchesSource = sourceFilter === "Toutes" || deal.sourceType === sourceFilter;

        return matchesQuery && matchesScore && matchesSource;
      })
      .sort((a, b) => {
        if (sortMode === "reduction") return b.reduction - a.reduction;
        if (sortMode === "prix") return a.price - b.price;
        return scoreOrder[b.score] - scoreOrder[a.score] || b.reduction - a.reduction;
      });
  }, [enrichedDeals, query, scoreFilter, sourceFilter, sortMode]);

  const bestDeal = filteredDeals[0] ?? enrichedDeals[0];
  const excellentCount = enrichedDeals.filter((deal) => deal.score === "Excellent").length;
  const bestReduction = Math.max(...enrichedDeals.map((deal) => deal.reduction));

  return (
    <CardSnipAppShell
      title="Deals"
      subtitle="Priorise les opportunités TCG selon le prix observé, le stock et la fiabilité du signal."
    >
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-4">
          <div className="grid gap-3 md:grid-cols-3">
            <AppPanel className="p-4">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-500">Deals actifs</p>
              <p className="mt-2 text-3xl font-semibold text-white">{enrichedDeals.length}</p>
              <p className="mt-1 text-sm text-zinc-400">{excellentCount} excellents à vérifier en priorité</p>
            </AppPanel>
            <AppPanel className="p-4">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-500">Meilleure baisse</p>
              <p className="mt-2 text-3xl font-semibold text-emerald-300">-{bestReduction}%</p>
              <p className="mt-1 text-sm text-zinc-400">Comparée au dernier prix connu</p>
            </AppPanel>
            <AppPanel className="p-4">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-500">Signaux externes</p>
              <p className="mt-2 text-3xl font-semibold text-violet-200">{communitySignals.length}</p>
              <p className="mt-1 text-sm text-zinc-400">Mock Dealabs, Discord et réseaux sociaux</p>
            </AppPanel>
          </div>

          <AppPanel className="overflow-hidden">
            <div className="border-b border-white/10 p-4 md:p-5">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className="text-base font-semibold text-white">Meilleures opportunités</h2>
                  <p className="mt-1 text-sm text-zinc-400">
                    Filtre les deals pour repérer rapidement ce qui mérite une décision.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <select
                    value={sortMode}
                    onChange={(event) => setSortMode(event.target.value as SortMode)}
                    className="rounded-xl border border-white/10 bg-zinc-950 px-3 py-2 text-sm text-zinc-200 outline-none transition hover:border-violet-400/40"
                  >
                    <option value="score">Tri score</option>
                    <option value="reduction">Tri réduction</option>
                    <option value="prix">Tri prix</option>
                  </select>
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Produit ou boutique..."
                    className="min-w-0 rounded-xl border border-white/10 bg-zinc-950 px-3 py-2 text-sm text-zinc-200 outline-none transition placeholder:text-zinc-600 hover:border-violet-400/40 focus:border-violet-400/70 sm:w-60"
                  />
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {scoreFilters.map((score) => (
                  <button
                    key={score}
                    type="button"
                    onClick={() => setScoreFilter(score)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                      scoreFilter === score
                        ? "border-violet-400/50 bg-violet-500/15 text-violet-100"
                        : "border-white/10 bg-white/[0.03] text-zinc-400 hover:border-white/20 hover:text-zinc-200"
                    }`}
                  >
                    {score}
                  </button>
                ))}
                <span className="mx-1 hidden h-7 w-px bg-white/10 sm:block" />
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
              {filteredDeals.map((deal) => (
                <div
                  key={deal.id}
                  className="grid gap-4 p-4 transition hover:bg-white/[0.025] md:grid-cols-[minmax(0,1fr)_auto] md:items-center md:p-5"
                >
                  <div className="flex min-w-0 items-center gap-4">
                    <ProductThumb tone={deal.thumbnailTone} label={deal.region} />
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="truncate font-semibold text-white">{deal.product}</h3>
                        <StatusBadge tone={scoreTone(deal.score)}>{deal.score}</StatusBadge>
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-zinc-400">
                        <span>{deal.shop}</span>
                        <span className="text-zinc-700">•</span>
                        <span>{deal.sourceType}</span>
                        <span className="text-zinc-700">•</span>
                        <span>il y a {deal.added}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 md:justify-end">
                    <div className="text-left md:text-right">
                      <p className="text-lg font-semibold text-white">{deal.currentPrice}</p>
                      <p className="text-sm text-zinc-500 line-through">{deal.oldPrice}</p>
                    </div>
                    <StatusBadge tone="green">{deal.discount}</StatusBadge>
                    <StatusBadge tone="green">{deal.stock}</StatusBadge>
                    <Link
                      href={`/products/${deal.id}`}
                      className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm font-semibold text-zinc-200 transition hover:border-violet-400/40 hover:bg-violet-500/10 hover:text-white"
                    >
                      Voir produit
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </AppPanel>
        </div>

        <div className="space-y-4">
          <AppPanel className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-500">Deal prioritaire</p>
                <h2 className="mt-2 text-xl font-semibold text-white">{bestDeal.product}</h2>
              </div>
              <StatusBadge tone={scoreTone(bestDeal.score)}>{bestDeal.score}</StatusBadge>
            </div>
            <div className="mt-5 flex items-center gap-4">
              <ProductThumb tone={bestDeal.thumbnailTone} label={bestDeal.region} />
              <div>
                <p className="text-3xl font-semibold text-white">{bestDeal.currentPrice}</p>
                <p className="mt-1 text-sm text-zinc-400">
                  {bestDeal.discount} chez {bestDeal.shop}
                </p>
              </div>
            </div>
            <p className="mt-5 rounded-2xl border border-emerald-400/15 bg-emerald-400/10 p-3 text-sm leading-6 text-emerald-100">
              {bestDealLabel(bestDeal.score)} : prix sous le niveau habituel, stock disponible et signal récent.
            </p>
          </AppPanel>

          <AppPanel className="p-5">
            <h2 className="text-base font-semibold text-white">Signaux communautaires</h2>
            <div className="mt-4 space-y-3">
              {communitySignals.map((signal) => (
                <div key={signal.id} className="rounded-2xl border border-white/10 bg-white/[0.025] p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-white">{signal.title}</p>
                      <p className="mt-1 text-xs text-zinc-500">
                        {signal.source} • {signal.time}
                      </p>
                    </div>
                    <span className="rounded-full border border-orange-300/20 bg-orange-300/10 px-2 py-1 text-xs font-semibold text-orange-200">
                      {signal.heat}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-zinc-400">{signal.status}</p>
                </div>
              ))}
            </div>
          </AppPanel>

          <AppPanel className="p-5">
            <h2 className="text-base font-semibold text-white">Règles du score</h2>
            <div className="mt-4 space-y-3 text-sm leading-6 text-zinc-400">
              <p>
                <span className="font-semibold text-emerald-300">Excellent</span> : prix sous cible, stock confirmé et
                signal récent.
              </p>
              <p>
                <span className="font-semibold text-violet-200">Bon</span> : réduction intéressante, mais à comparer
                avec l&apos;historique.
              </p>
              <p>
                <span className="font-semibold text-amber-200">Moyen</span> : opportunité possible, utile pour une
                watchlist.
              </p>
              <p>
                <span className="font-semibold text-zinc-300">Faible</span> : signal conservé, mais achat non prioritaire.
              </p>
            </div>
          </AppPanel>
        </div>
      </div>
    </CardSnipAppShell>
  );
}
