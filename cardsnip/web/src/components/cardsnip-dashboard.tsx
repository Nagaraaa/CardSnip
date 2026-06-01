"use client";

import dynamic from "next/dynamic";
import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  deals,
  DealScore,
  priceSeries,
  PriceSeries,
  Shop,
  shops as initialShops,
  stats,
} from "@/data/mock-dashboard";
import { cardsnipApi } from "@/lib/cardsnip-api";
import { AppPanel, CardSnipAppShell } from "@/components/cardsnip-app-shell";
import { ProductThumb, StatusBadge } from "@/components/product-ui";
import type { PriceChartDatum, PriceHistoryChartProps } from "@/components/price-history-chart";
import type { ApiAlert, ApiObservation } from "@/types/local-api";

const PriceHistoryChart = dynamic<PriceHistoryChartProps>(
  () => import("@/components/price-history-chart").then((module) => module.PriceHistoryChart),
  {
    ssr: false,
    loading: () => <div className="grid h-full place-items-center text-sm text-zinc-500">Chargement du graphique...</div>,
  },
);

const scoreTone: Record<DealScore, "green" | "violet" | "amber" | "gray"> = {
  Excellent: "green",
  Bon: "violet",
  Moyen: "amber",
  Faible: "gray",
};

function formatPrice(price: number) {
  return `${price.toFixed(2).replace(".", ",")} EUR`;
}

function getChartData(series: PriceSeries, range: string): PriceChartDatum[] {
  const pointCount = range === "7J" ? 7 : range === "14J" ? 10 : series.points.length;

  return series.points.slice(-pointCount).map((point) => ({
    ...point,
    targetPrice: series.targetPrice,
    belowTarget: point.price <= series.targetPrice,
  }));
}

function getPriceDomain(data: PriceChartDatum[], targetPrice: number): [number, number] {
  const prices = data.map((point) => point.price);
  const minPrice = Math.min(...prices, targetPrice);
  const maxPrice = Math.max(...prices, targetPrice);
  const padding = Math.max(4, (maxPrice - minPrice) * 0.18);

  return [Math.max(0, Math.floor(minPrice - padding)), Math.ceil(maxPrice + padding)];
}

function Toggle({ enabled, onChange }: { enabled: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={`relative h-6 w-11 rounded-full border transition duration-200 ${
        enabled ? "border-violet-400/30 bg-violet-500/35" : "border-white/10 bg-white/[0.06]"
      }`}
      aria-pressed={enabled}
    >
      <span
        className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition duration-200 ${
          enabled ? "left-6" : "left-1"
        }`}
      />
    </button>
  );
}

function AddProductModal({
  shops,
  onClose,
  onSubmit,
}: {
  shops: Shop[];
  onClose: () => void;
  onSubmit: () => void;
}) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit();
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 px-4 backdrop-blur-sm">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#0d1019] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.45)]"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-white">Ajouter un produit</h2>
            <p className="mt-1 text-sm text-zinc-400">Formulaire mocké, prêt pour le futur backend.</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg px-3 py-1 text-zinc-400 hover:bg-white/5">
            Fermer
          </button>
        </div>

        <div className="mt-6 grid gap-4">
          <label className="grid gap-2 text-sm text-zinc-300">
            URL produit
            <input
              required
              type="url"
              placeholder="https://boutique.example/produit"
              className="h-11 rounded-lg border border-white/10 bg-black/20 px-3 text-white outline-none transition focus:border-violet-400/60"
            />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2 text-sm text-zinc-300">
              Boutique
              <select className="h-11 rounded-lg border border-white/10 bg-black/20 px-3 text-white outline-none transition focus:border-violet-400/60">
                {shops.map((shop) => (
                  <option key={shop.id}>{shop.name}</option>
                ))}
              </select>
            </label>
            <label className="grid gap-2 text-sm text-zinc-300">
              Prix cible
              <input
                required
                type="number"
                min="0"
                step="0.01"
                placeholder="59.90"
                className="h-11 rounded-lg border border-white/10 bg-black/20 px-3 text-white outline-none transition focus:border-violet-400/60"
              />
            </label>
          </div>
          <label className="grid gap-2 text-sm text-zinc-300">
            Catégorie
            <select className="h-11 rounded-lg border border-white/10 bg-black/20 px-3 text-white outline-none transition focus:border-violet-400/60">
              <option>Elite Trainer Box</option>
              <option>Display booster</option>
              <option>Coffret</option>
              <option>Bundle</option>
              <option>Accessoire sealed</option>
            </select>
          </label>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="h-10 rounded-lg border border-white/10 px-4 text-sm font-semibold text-zinc-300 hover:bg-white/5"
          >
            Annuler
          </button>
          <button
            type="submit"
            className="h-10 rounded-lg bg-violet-500 px-4 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(139,92,246,0.22)] hover:bg-violet-400"
          >
            Ajouter
          </button>
        </div>
      </form>
    </div>
  );
}

export function CardSnipDashboard() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [shops, setShops] = useState(initialShops);
  const [selectedSeriesId, setSelectedSeriesId] = useState(priceSeries[0].id);
  const [selectedRange, setSelectedRange] = useState("30J");
  const [isPriceHelpOpen, setIsPriceHelpOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [latestObservations, setLatestObservations] = useState<ApiObservation[]>([]);
  const [realAlerts, setRealAlerts] = useState<ApiAlert[]>([]);
  const [apiAvailable, setApiAvailable] = useState(false);
  const [apiErrorMessage, setApiErrorMessage] = useState("");
  const [isRunningCheck, setIsRunningCheck] = useState(false);
  const [checkMessage, setCheckMessage] = useState("");

  async function loadLocalData() {
    try {
      const [observations, alerts] = await Promise.all([
        cardsnipApi.listLatestObservations(),
        cardsnipApi.listAlerts(),
      ]);

      setLatestObservations(observations);
      setRealAlerts(alerts);
      setApiAvailable(true);
      setApiErrorMessage("");
    } catch (error) {
      setApiAvailable(false);
      setApiErrorMessage(error instanceof Error ? error.message : "API locale CardSnip indisponible.");
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadLocalData();
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  const activeShopCount = useMemo(() => shops.filter((shop) => shop.enabled).length, [shops]);
  const normalizedSearch = searchQuery.trim().toLowerCase();
  const filteredDeals = useMemo(() => {
    if (!normalizedSearch) {
      return deals;
    }

    return deals.filter((deal) =>
      `${deal.product} ${deal.shop} ${deal.region} ${deal.score}`.toLowerCase().includes(normalizedSearch),
    );
  }, [normalizedSearch]);
  const selectedSeries = priceSeries.find((series) => series.id === selectedSeriesId) ?? priceSeries[0];
  const chartData = useMemo(() => getChartData(selectedSeries, selectedRange), [selectedRange, selectedSeries]);
  const chartDomain = useMemo(
    () => getPriceDomain(chartData, selectedSeries.targetPrice),
    [chartData, selectedSeries.targetPrice],
  );
  const latestPoint = chartData[chartData.length - 1];
  const firstPoint = chartData[0];
  const priceDelta = latestPoint.price - firstPoint.price;

  function submitProduct() {
    setIsModalOpen(false);
    setShowToast(true);
    window.setTimeout(() => setShowToast(false), 2800);
  }

  function toggleShop(shopId: string) {
    setShops((current) =>
      current.map((shop) => (shop.id === shopId ? { ...shop, enabled: !shop.enabled } : shop)),
    );
  }

  async function runAdminCheck() {
    setIsRunningCheck(true);
    setCheckMessage("");

    try {
      const result = await cardsnipApi.runScraper();
      await loadLocalData();
      if (result.errors > 0) {
        setCheckMessage(result.messages[0] ?? "Check termine avec une erreur.");
      } else {
        setCheckMessage(`${result.observations} check(s), ${result.alerts} alerte(s).`);
      }
    } catch (error) {
      setCheckMessage(error instanceof Error ? error.message : "API locale CardSnip indisponible.");
    } finally {
      setIsRunningCheck(false);
      window.setTimeout(() => setCheckMessage(""), 5200);
    }
  }

  return (
    <CardSnipAppShell
      title="Dashboard CardSnip"
      subtitle="Surveillance mockée de produits sealed TCG."
      action={
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <label className="flex h-10 min-w-0 items-center rounded-lg border border-white/[0.08] bg-white/[0.035] px-3 text-sm text-zinc-500 transition focus-within:border-violet-300/40 sm:w-80">
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Rechercher un produit..."
              className="min-w-0 flex-1 bg-transparent text-zinc-200 outline-none placeholder:text-zinc-500"
            />
            <span className="ml-3 text-xs text-zinc-600">{filteredDeals.length}</span>
          </label>
          <button
            type="button"
            onClick={runAdminCheck}
            disabled={isRunningCheck}
            className="h-10 rounded-lg border border-emerald-300/20 bg-emerald-400/10 px-4 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-400/15 disabled:cursor-not-allowed disabled:text-zinc-500"
          >
            {isRunningCheck ? "Check en cours..." : "Lancer un check"}
          </button>
        </div>
      }
    >
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <AppPanel key={stat.id} className="relative h-32 overflow-hidden p-4">
            <svg viewBox="0 0 124 48" className="absolute right-3 top-5 h-14 w-32 text-violet-300/25">
              <path
                d={stat.sparkline}
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
              />
            </svg>
            <div className="relative flex h-full items-center gap-4">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-white/[0.08] bg-white/[0.04] text-xs font-black text-violet-200">
                {stat.icon}
              </div>
              <div className="min-w-0">
                <strong className="block text-3xl font-semibold tracking-normal text-white">{stat.value}</strong>
                <p className="mt-1 truncate text-sm text-zinc-400">{stat.label}</p>
                <span className="mt-2 inline-flex rounded-full border border-violet-400/15 bg-violet-400/10 px-2.5 py-1 text-xs font-medium text-violet-200">
                  {stat.delta}
                </span>
              </div>
            </div>
          </AppPanel>
        ))}
      </section>

      <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_390px]">
        <div className="grid min-w-0 gap-4">
          {latestObservations.length > 0 ? (
            <AppPanel className="overflow-hidden">
              <div className="flex items-center justify-between border-b border-white/[0.08] px-4 py-3">
                <h2 className="text-base font-semibold">Derniers checks réels</h2>
                <span className="rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-300">
                  SQLite
                </span>
              </div>
              <div className="grid gap-2 p-4">
                {latestObservations.slice(0, 5).map((observation) => (
                  <div key={observation.id} className="grid gap-3 rounded-xl border border-white/[0.06] bg-white/[0.025] p-3 sm:grid-cols-[1fr_auto_auto] sm:items-center">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-zinc-100">{observation.product_name}</p>
                      <p className="text-xs text-zinc-500">{observation.shop_name} · {observation.checked_at}</p>
                    </div>
                    <span className="text-sm font-semibold text-white">{formatPrice(observation.price)}</span>
                    <StatusBadge tone={observation.stock_status === "in_stock" ? "green" : "gray"}>
                      {observation.stock_status === "in_stock" ? "En stock" : "Rupture"}
                    </StatusBadge>
                  </div>
                ))}
              </div>
            </AppPanel>
          ) : null}

          <AppPanel className="overflow-hidden">
            <div className="flex items-center justify-between border-b border-white/[0.08] px-4 py-3">
              <h2 className="text-base font-semibold">Derniers bons deals</h2>
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="rounded-lg border border-white/[0.08] px-3 py-1.5 text-xs font-semibold text-zinc-300 hover:bg-white/[0.04]"
              >
                Voir tout
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[840px] table-fixed text-left text-sm">
                <colgroup>
                  <col className="w-[29%]" />
                  <col className="w-[14%]" />
                  <col className="w-[12%]" />
                  <col className="w-[11%]" />
                  <col className="w-[13%]" />
                  <col className="w-[13%]" />
                  <col className="w-[8%]" />
                </colgroup>
                <thead className="text-xs text-zinc-500">
                  <tr>
                    <th className="px-4 py-3 font-medium">Produit</th>
                    <th className="px-3 py-3 font-medium">Boutique</th>
                    <th className="px-3 py-3 font-medium">Prix</th>
                    <th className="px-3 py-3 font-medium">Diff.</th>
                    <th className="px-3 py-3 font-medium">Deal score</th>
                    <th className="px-3 py-3 font-medium">Stock</th>
                    <th className="px-3 py-3 font-medium">Ajouté</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDeals.map((deal) => (
                    <tr key={deal.id} className="border-t border-white/[0.06]">
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-3">
                          <ProductThumb tone={deal.thumbnailTone} />
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-zinc-100">{deal.product}</p>
                            <span className="text-xs text-violet-300">{deal.region}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2.5 font-medium text-zinc-200">{deal.shop}</td>
                      <td className="px-3 py-2.5">
                        <strong className="block text-zinc-100">{deal.currentPrice}</strong>
                        <span className="text-xs text-zinc-600 line-through">{deal.oldPrice}</span>
                      </td>
                      <td className="px-3 py-2.5 text-sm font-semibold text-emerald-300">{deal.discount}</td>
                      <td className="px-3 py-2.5">
                        <StatusBadge tone={scoreTone[deal.score]}>{deal.score}</StatusBadge>
                      </td>
                      <td className="px-3 py-2.5">
                        <StatusBadge tone="green">{deal.stock}</StatusBadge>
                      </td>
                      <td className="px-3 py-2.5 text-zinc-400">{deal.added}</td>
                    </tr>
                  ))}
                  {filteredDeals.length === 0 ? (
                    <tr className="border-t border-white/[0.06]">
                      <td colSpan={7} className="px-4 py-8 text-center text-sm text-zinc-500">
                        Aucun produit ne correspond à cette recherche.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </AppPanel>

          <AppPanel className="p-4">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
              <div>
                <h2 className="text-base font-semibold">Historique des prix CardSnip</h2>
                <p className="mt-1 max-w-2xl text-sm leading-6 text-zinc-500">
                  Ce graphique montre les prix observés par CardSnip à chaque check. L&apos;historique commence quand tu
                  ajoutes le produit à la surveillance.
                </p>
              </div>
              <div className="grid gap-2 sm:grid-cols-[220px_auto]">
                <select
                  value={selectedSeriesId}
                  onChange={(event) => setSelectedSeriesId(event.target.value)}
                  className="h-9 rounded-lg border border-white/[0.08] bg-black/30 px-3 text-sm text-zinc-200 outline-none"
                >
                  {priceSeries.map((series) => (
                    <option key={series.id} value={series.id}>
                      {series.product} - {series.shop}
                    </option>
                  ))}
                </select>
                <div className="flex rounded-lg border border-white/[0.08] bg-black/20 p-1">
                  {["7J", "14J", "30J"].map((range) => (
                    <button
                      type="button"
                      key={range}
                      onClick={() => setSelectedRange(range)}
                      className={`h-7 rounded-md px-3 text-xs font-semibold transition ${
                        range === selectedRange ? "bg-violet-500 text-white" : "text-zinc-500 hover:text-zinc-200"
                      }`}
                    >
                      {range}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.025] p-3">
                <p className="text-xs text-zinc-500">Prix actuel observé</p>
                <strong className="mt-1 block text-lg">{formatPrice(latestPoint.price)}</strong>
              </div>
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.025] p-3">
                <p className="text-xs text-zinc-500">Prix cible</p>
                <strong className="mt-1 block text-lg text-violet-200">{formatPrice(selectedSeries.targetPrice)}</strong>
              </div>
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.025] p-3">
                <p className="text-xs text-zinc-500">Évolution période</p>
                <strong className={`mt-1 block text-lg ${priceDelta <= 0 ? "text-emerald-300" : "text-amber-200"}`}>
                  {priceDelta <= 0 ? "" : "+"}
                  {formatPrice(priceDelta)}
                </strong>
              </div>
            </div>

            <div className="relative mt-4 h-[320px] overflow-hidden rounded-xl border border-white/[0.06] bg-black/20 px-2 py-4 sm:px-4">
              <PriceHistoryChart data={chartData} domain={chartDomain} targetPrice={selectedSeries.targetPrice} />
            </div>

            <div className="mt-3 rounded-xl border border-white/[0.06] bg-white/[0.025]">
              <button
                type="button"
                onClick={() => setIsPriceHelpOpen((current) => !current)}
                className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left text-sm font-medium text-zinc-300 transition hover:text-white"
                aria-expanded={isPriceHelpOpen}
              >
                <span>À quoi sert ce graphique ?</span>
                <span
                  className={`h-2.5 w-2.5 rotate-45 border-b border-r border-zinc-400 transition duration-200 ${
                    isPriceHelpOpen ? "rotate-[225deg]" : ""
                  }`}
                  aria-hidden="true"
                />
              </button>
              {isPriceHelpOpen ? (
                <div className="border-t border-white/[0.06] px-3 pb-3 pt-2 text-sm leading-6 text-zinc-400">
                  Comparer l&apos;évolution observée par boutique, voir si le prix passe sous ta cible, et éviter
                  d&apos;acheter trop tôt. Les prix peuvent venir des checks CardSnip, d&apos;un import manuel/CSV ou, plus
                  tard, de sources autorisées comme des API, des partenariats ou des pages boutiques surveillées.
                </div>
              ) : null}
            </div>
          </AppPanel>

          <AppPanel className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold">Boutiques</h2>
                <p className="mt-1 text-sm text-zinc-500">Activation locale des boutiques mockées.</p>
              </div>
              <span className="rounded-full bg-violet-400/10 px-3 py-1 text-xs font-semibold text-violet-200">
                {activeShopCount} actives
              </span>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {shops.map((shop) => (
                <div
                  key={shop.id}
                  className="flex items-center justify-between rounded-xl border border-white/[0.08] bg-white/[0.025] p-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="grid h-9 w-9 place-items-center rounded-lg bg-white/[0.05] text-xs font-black text-zinc-300">
                      {shop.mark}
                    </span>
                    <div>
                      <p className="text-sm font-semibold">{shop.name}</p>
                      <p className="text-xs text-zinc-500">{shop.products} produits</p>
                    </div>
                  </div>
                  <Toggle enabled={shop.enabled} onChange={() => toggleShop(shop.id)} />
                </div>
              ))}
            </div>
          </AppPanel>
        </div>

        <div className="grid gap-4">
          <AppPanel>
            <div className="border-b border-white/[0.08] px-4 py-3">
              <h2 className="text-base font-semibold">Alertes récentes</h2>
            </div>
            <div className="grid gap-2 p-4">
              {realAlerts.length > 0
                ? realAlerts.slice(0, 4).map((alert) => (
                    <div key={alert.id} className="flex min-w-0 items-start gap-3 rounded-xl p-2 hover:bg-white/[0.035]">
                      <ProductThumb tone="from-emerald-200 to-violet-100" label="SQL" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">{alert.product_name}</p>
                        <p className="max-w-full break-words text-xs leading-5 text-zinc-500">{alert.message}</p>
                      </div>
                      <span className="max-w-[120px] shrink-0 truncate rounded-full bg-emerald-400/10 px-2.5 py-1 text-xs font-semibold text-emerald-300">
                        {alert.type}
                      </span>
                    </div>
                  ))
                : filteredDeals.slice(0, 4).map((deal) => (
                    <div key={deal.id} className="flex items-center gap-3 rounded-xl p-2 hover:bg-white/[0.035]">
                      <ProductThumb tone={deal.thumbnailTone} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">{deal.product}</p>
                        <p className="text-xs text-zinc-500">{deal.shop} - il y a {deal.added}</p>
                      </div>
                      <span className="rounded-full bg-emerald-400/10 px-2.5 py-1 text-xs font-semibold text-emerald-300">
                        {deal.currentPrice}
                      </span>
                    </div>
                  ))}
            </div>
          </AppPanel>

          <AppPanel>
            <div className="flex items-center justify-between border-b border-white/[0.08] px-4 py-3">
              <h2 className="text-base font-semibold">Activité des scrapers</h2>
              <span className="rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-300">
                {apiAvailable ? "API locale OK" : "API offline"}
              </span>
            </div>
            <div className="p-4">
              {!apiAvailable && apiErrorMessage ? (
                <div className="mb-3 rounded-xl border border-amber-300/15 bg-amber-400/10 p-3 text-xs leading-5 text-amber-100">
                  {apiErrorMessage}
                </div>
              ) : null}
              {shops.map((shop) => (
                <div key={shop.id} className="flex items-center gap-3 border-b border-white/[0.06] py-3 last:border-b-0">
                  <span className="grid h-9 w-9 place-items-center rounded-lg bg-white/[0.05] text-xs font-black">
                    {shop.mark}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">{shop.name}</p>
                    <p className="text-xs text-zinc-500">Dernier check - {shop.lastCheck}</p>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                      shop.enabled ? "bg-emerald-400/10 text-emerald-300" : "bg-zinc-400/10 text-zinc-400"
                    }`}
                  >
                    {shop.enabled ? "OK" : "Pause"}
                  </span>
                </div>
              ))}
            </div>
          </AppPanel>
        </div>
      </div>

      {isModalOpen ? (
        <AddProductModal shops={shops} onClose={() => setIsModalOpen(false)} onSubmit={submitProduct} />
      ) : null}

      {showToast ? (
        <div className="fixed bottom-5 right-5 z-50 rounded-xl border border-emerald-400/20 bg-[#0d1019] px-4 py-3 text-sm font-semibold text-emerald-300 shadow-[0_20px_60px_rgba(0,0,0,0.32)]">
          Produit ajouté à la watchlist mockée.
        </div>
      ) : null}
      {checkMessage ? (
        <div className="fixed bottom-5 right-5 z-50 max-w-md rounded-xl border border-emerald-400/20 bg-[#0d1019] px-4 py-3 text-sm font-semibold text-emerald-300 shadow-[0_20px_60px_rgba(0,0,0,0.32)]">
          {checkMessage}
        </div>
      ) : null}
    </CardSnipAppShell>
  );
}
