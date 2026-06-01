"use client";

import dynamic from "next/dynamic";
import { deals, priceSeries, PriceSeries, shops } from "@/data/mock-dashboard";
import { AppPanel, CardSnipAppShell } from "@/components/cardsnip-app-shell";
import { parseEuroPrice, scoreTone, StatusBadge } from "@/components/product-ui";
import type { PriceChartDatum, PriceHistoryChartProps } from "@/components/price-history-chart";

const PriceHistoryChart = dynamic<PriceHistoryChartProps>(
  () => import("@/components/price-history-chart").then((module) => module.PriceHistoryChart),
  {
    ssr: false,
    loading: () => <div className="grid h-full place-items-center text-sm text-zinc-500">Chargement du graphique...</div>,
  },
);

function formatPrice(price: number) {
  return `${price.toFixed(2).replace(".", ",")} EUR`;
}

function getChartData(series: PriceSeries): PriceChartDatum[] {
  return series.points.map((point) => ({
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

function buildFallbackSeries(productId: string, product: string, shop: string, currentPrice: string, oldPrice: string): PriceSeries {
  const current = parseEuroPrice(currentPrice);
  const old = parseEuroPrice(oldPrice);

  return {
    id: `${productId}-fallback`,
    productId,
    shopId: shop.toLowerCase().replaceAll(" ", "-"),
    product,
    shop,
    targetPrice: Math.max(1, current + 5),
    points: [
      { date: "23/04", price: old },
      { date: "27/04", price: old - 3 },
      { date: "01/05", price: old - 6 },
      { date: "05/05", price: old - 10 },
      { date: "09/05", price: old - 14 },
      { date: "13/05", price: old - 18 },
      { date: "17/05", price: current + 2 },
      { date: "21/05", price: current },
    ],
  };
}

export function ProductDetailPage({ id }: { id: string }) {
  const deal = deals.find((item) => item.id === id) ?? deals[0];
  const series =
    priceSeries.find((item) => item.productId === deal.id) ??
    buildFallbackSeries(deal.id, deal.product, deal.shop, deal.currentPrice, deal.oldPrice);
  const chartData = getChartData(series);
  const chartDomain = getPriceDomain(chartData, series.targetPrice);
  const currentPrice = parseEuroPrice(deal.currentPrice);
  const oldPrice = parseEuroPrice(deal.oldPrice);
  const saving = oldPrice - currentPrice;
  const offers = shops.slice(0, 5).map((shop, index) => {
    const price = index === 0 ? currentPrice : currentPrice + index * 4 + (index % 2 ? 0.9 : 0.5);

    return {
      ...shop,
      price,
      stock: index === 3 ? "Rupture" : "En stock",
      sourceUrl: "À connecter",
    };
  });

  return (
    <CardSnipAppShell
      title={deal.product}
      subtitle="Vue produit centralisée : image, offres, prix cible, historique et alertes liées."
      action={
        <div className="flex flex-col gap-2 sm:flex-row">
          <button className="h-10 rounded-lg border border-white/[0.08] px-4 text-sm font-semibold text-zinc-300 hover:bg-white/[0.04]">
            Pause surveillance
          </button>
          <button className="h-10 rounded-lg bg-violet-500 px-4 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(139,92,246,0.2)]">
            + Ajouter une offre
          </button>
        </div>
      }
    >
      <div className="grid gap-4 xl:grid-cols-[380px_minmax(0,1fr)] xl:items-start">
        <AppPanel className="overflow-hidden">
          <div className="relative grid min-h-[360px] place-items-center border-b border-white/[0.08] bg-[radial-gradient(circle_at_50%_20%,rgba(139,92,246,0.2),transparent_18rem),#0a0d15] p-8">
            <div className={`h-64 w-44 rounded-3xl border border-white/20 bg-gradient-to-br ${deal.thumbnailTone} p-2 shadow-[0_28px_90px_rgba(139,92,246,0.22)]`}>
              <div className="grid h-full place-items-center rounded-2xl border border-black/10 bg-white/90 text-center text-zinc-900">
                <div>
                  <p className="text-sm font-black tracking-[0.3em]">TCG</p>
                  <p className="mt-2 text-xs font-semibold text-zinc-500">Image produit</p>
                  <p className="mt-1 text-xs text-zinc-400">à valider</p>
                </div>
              </div>
            </div>
            <span className="absolute right-4 top-4 rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-1 text-xs font-semibold text-amber-200">
              Image à compléter
            </span>
          </div>

          <div className="p-5">
            <div className="flex flex-wrap gap-2">
              <StatusBadge tone="green">{deal.stock}</StatusBadge>
              <StatusBadge tone={scoreTone(deal.score)}>{deal.score}</StatusBadge>
              <StatusBadge tone="violet">FR</StatusBadge>
            </div>
            <h2 className="mt-4 text-xl font-semibold">{deal.product}</h2>
            <p className="mt-2 text-sm leading-6 text-zinc-400">
              Produit catalogue prototype. La fiche regroupe les offres boutique, le prix cible, l’image validée et
              l’historique observé par CardSnip.
            </p>
            <div className="mt-5 grid gap-3 text-sm">
              <div className="flex justify-between border-t border-white/[0.06] pt-3">
                <span className="text-zinc-500">Extension</span>
                <span className="font-medium">Écarlate et Violet</span>
              </div>
              <div className="flex justify-between border-t border-white/[0.06] pt-3">
                <span className="text-zinc-500">Type</span>
                <span className="font-medium">{deal.product.includes("Display") ? "Display" : deal.product.includes("Bundle") ? "Bundle" : "ETB / Coffret"}</span>
              </div>
              <div className="flex justify-between border-t border-white/[0.06] pt-3">
                <span className="text-zinc-500">Source principale</span>
                <span className="font-medium">{deal.shop}</span>
              </div>
            </div>
          </div>
        </AppPanel>

        <div className="grid gap-4">
          <section className="grid gap-4 md:grid-cols-4">
            <AppPanel className="p-4">
              <p className="text-xs text-zinc-500">Prix actuel</p>
              <p className="mt-2 text-2xl font-semibold">{deal.currentPrice}</p>
            </AppPanel>
            <AppPanel className="p-4">
              <p className="text-xs text-zinc-500">Prix cible</p>
              <p className="mt-2 text-2xl font-semibold text-violet-200">{formatPrice(series.targetPrice)}</p>
            </AppPanel>
            <AppPanel className="p-4">
              <p className="text-xs text-zinc-500">Économie estimée</p>
              <p className="mt-2 text-2xl font-semibold text-emerald-300">{formatPrice(saving)}</p>
            </AppPanel>
            <AppPanel className="p-4">
              <p className="text-xs text-zinc-500">Offres actives</p>
              <p className="mt-2 text-2xl font-semibold">{offers.filter((offer) => offer.stock === "En stock").length}/{offers.length}</p>
            </AppPanel>
          </section>

          <AppPanel className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold">Historique observé</h2>
                <p className="mt-1 text-sm text-zinc-500">Série mockée alignée sur le futur modèle price_history.</p>
              </div>
              <StatusBadge tone={currentPrice <= series.targetPrice ? "green" : "amber"}>
                {currentPrice <= series.targetPrice ? "Sous cible" : "Au-dessus cible"}
              </StatusBadge>
            </div>
            <div className="mt-4 h-[300px] rounded-xl border border-white/[0.06] bg-black/20 px-2 py-4 sm:px-4">
              <PriceHistoryChart data={chartData} domain={chartDomain} targetPrice={series.targetPrice} />
            </div>
          </AppPanel>

          <AppPanel className="p-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-base font-semibold">Offres par boutique</h2>
              <span className="text-xs text-zinc-500">URLs à connecter plus tard</span>
            </div>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="text-xs text-zinc-500">
                  <tr>
                    <th className="py-3 font-medium">Boutique</th>
                    <th className="py-3 font-medium">Prix</th>
                    <th className="py-3 font-medium">Stock</th>
                    <th className="py-3 font-medium">Dernier check</th>
                    <th className="py-3 text-right font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {offers.map((offer) => (
                    <tr key={offer.id} className="border-t border-white/[0.06]">
                      <td className="py-3">
                        <div className="flex items-center gap-3">
                          <span className="grid h-9 w-9 place-items-center rounded-lg bg-white/[0.05] text-xs font-black">
                            {offer.mark}
                          </span>
                          <div>
                            <p className="font-semibold">{offer.name}</p>
                            <p className="text-xs text-zinc-500">{offer.sourceUrl}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 font-semibold">{formatPrice(offer.price)}</td>
                      <td className="py-3">
                        <StatusBadge tone={offer.stock === "En stock" ? "green" : "gray"}>{offer.stock}</StatusBadge>
                      </td>
                      <td className="py-3 text-zinc-400">{offer.lastCheck}</td>
                      <td className="py-3 text-right">
                        <button className="rounded-lg border border-white/[0.08] px-3 py-2 text-xs font-semibold text-zinc-300 hover:bg-white/[0.04]">
                          Config.
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </AppPanel>

          <section className="grid gap-4 lg:grid-cols-2">
            <AppPanel className="p-5">
              <h2 className="text-base font-semibold">Alertes liées</h2>
              <div className="mt-4 grid gap-3">
                {[
                  `Prix sous cible détecté chez ${deal.shop}`,
                  "Image produit à valider dans le catalogue",
                  "Comparer avec au moins deux boutiques supplémentaires",
                ].map((item, index) => (
                  <div key={item} className="rounded-xl border border-white/[0.06] bg-white/[0.025] p-3">
                    <p className="text-sm font-medium">{item}</p>
                    <p className="mt-1 text-xs text-zinc-500">Priorité {index === 0 ? "haute" : "normale"}</p>
                  </div>
                ))}
              </div>
            </AppPanel>

            <AppPanel className="p-5">
              <h2 className="text-base font-semibold">Timeline des checks</h2>
              <div className="mt-4 grid gap-3">
                {["Prix actualisé", "Stock confirmé", "Offre ajoutée", "Produit créé"].map((item, index) => (
                  <div key={item} className="flex gap-3">
                    <span className="mt-1 h-2 w-2 rounded-full bg-violet-300" />
                    <div>
                      <p className="text-sm font-medium">{item}</p>
                      <p className="text-xs text-zinc-500">Il y a {index * 6 + 2} min</p>
                    </div>
                  </div>
                ))}
              </div>
            </AppPanel>
          </section>
        </div>
      </div>
    </CardSnipAppShell>
  );
}
