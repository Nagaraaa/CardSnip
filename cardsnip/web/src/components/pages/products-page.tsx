"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AddProductModal, AddedProductDraft } from "@/components/add-product-modal";
import { AppPanel, CardSnipAppShell } from "@/components/cardsnip-app-shell";
import { parseEuroPrice, ProductThumb, scoreOrder, scoreTone, StatusBadge } from "@/components/product-ui";
import { cardsnipApi } from "@/lib/cardsnip-api";
import { isDemoMode } from "@/lib/demo-mode";
import { ApiObservation, ApiTrackedProduct } from "@/types/local-api";
import { deals, DealScore, shops } from "@/data/mock-dashboard";

type ProductRow =
  | {
      kind: "deal";
      id: string;
      name: string;
      shop: string;
      region: string;
      currentPrice: string;
      oldPrice: string;
      targetPrice: string;
      discount: string;
      score: DealScore;
      status: "Surveillé";
      added: string;
      thumbnailTone: string;
      detailHref: string;
      productUrl?: string;
      stockLabel?: string;
      category?: string;
    }
  | {
      kind: "local" | "api";
      id: string;
      name: string;
      shop: string;
      region: string;
      currentPrice: string;
      oldPrice: string;
      targetPrice: string;
      discount: string;
      score: "À vérifier";
      status: "À configurer" | "Actif" | "Inactif";
      added: string;
      thumbnailTone: string;
      category: string;
      productUrl: string;
      stockLabel?: string;
    };

const shopNames = shops.map((shop) => shop.name);
const localProductsStorageKey = "cardsnip.local-products.v1";

function formatEuro(value: number) {
  return `${value.toFixed(2).replace(".", ",")} EUR`;
}

function formatCheckDate(value: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatDraftTargetPrice(price: string) {
  const value = Number(price.replace(",", "."));
  if (!Number.isFinite(value) || value <= 0) return "Non défini";
  return formatEuro(value);
}

function draftToProductRow(product: AddedProductDraft): ProductRow {
  return {
    kind: "local",
    id: product.id,
    name: product.name,
    shop: product.shop,
    region: "FR",
    currentPrice: "Premier check en attente",
    oldPrice: "-",
    targetPrice: formatDraftTargetPrice(product.targetPrice),
    discount: "-",
    score: "À vérifier",
    status: "À configurer",
    added: "maintenant",
    thumbnailTone: product.thumbnailTone,
    category: product.category,
    productUrl: product.productUrl,
  };
}

function apiTrackedToProductRow(product: ApiTrackedProduct, observation?: ApiObservation): ProductRow {
  const isBelowTarget = observation ? observation.price <= product.target_price : false;

  return {
    kind: "api",
    id: `api-tracked-${product.id}`,
    name: product.product_name,
    shop: product.shop_name,
    region: product.language || "FR",
    currentPrice: observation ? formatEuro(observation.price) : "En attente du scraper",
    oldPrice: "-",
    targetPrice: formatEuro(product.target_price),
    discount: isBelowTarget ? "Sous cible" : "-",
    score: "À vérifier",
    status: product.active ? "Actif" : "Inactif",
    added: observation ? formatCheckDate(observation.checked_at) : product.created_at,
    thumbnailTone: product.image_url ? "from-violet-200 to-zinc-100" : "from-violet-200 to-sky-100",
    category: product.category || "TCG",
    productUrl: product.source_url,
    stockLabel: observation?.stock_status === "in_stock" ? "En stock" : observation?.stock_status === "out_of_stock" ? "Rupture" : undefined,
  };
}

export function ProductsPage() {
  const [query, setQuery] = useState("");
  const [shopFilter, setShopFilter] = useState("Toutes");
  const [scoreFilter, setScoreFilter] = useState<DealScore | "Tous">("Tous");
  const [pausedIds, setPausedIds] = useState<string[]>([]);
  const [addedProducts, setAddedProducts] = useState<ProductRow[]>([]);
  const [apiProducts, setApiProducts] = useState<ProductRow[]>([]);
  const [apiAvailable, setApiAvailable] = useState(false);
  const [apiErrorMessage, setApiErrorMessage] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toast, setToast] = useState("");
  const [isLocalStorageReady, setIsLocalStorageReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadTrackedProducts() {
      try {
        const [trackedProducts, latestObservations] = await Promise.all([
          cardsnipApi.listTrackedProducts(),
          cardsnipApi.listLatestObservations(),
        ]);
        if (cancelled) return;

        const observationByTrackedId = new Map(
          latestObservations.map((observation) => [observation.tracked_product_id, observation]),
        );
        setApiProducts(trackedProducts.map((product) => apiTrackedToProductRow(product, observationByTrackedId.get(product.id))));
        setApiAvailable(true);
        setApiErrorMessage("");
      } catch {
        if (!cancelled) {
          setApiAvailable(false);
          setApiErrorMessage("API locale indisponible. Impossible de charger les produits surveillés réels.");
        }
      }
    }

    void loadTrackedProducts();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const savedProducts = window.localStorage.getItem(localProductsStorageKey);
        if (savedProducts) {
          const parsedProducts = JSON.parse(savedProducts) as ProductRow[];
          setAddedProducts(parsedProducts.filter((product) => product.kind === "local"));
        }
      } catch {
        setAddedProducts([]);
      } finally {
        setIsLocalStorageReady(true);
      }
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isLocalStorageReady) return;

    window.localStorage.setItem(localProductsStorageKey, JSON.stringify(addedProducts));
  }, [addedProducts, isLocalStorageReady]);

  const baseProducts = useMemo<ProductRow[]>(
    () =>
      deals.map((deal) => ({
        kind: "deal",
        id: deal.id,
        name: deal.product,
        shop: deal.shop,
        region: deal.region,
        currentPrice: deal.currentPrice,
        oldPrice: deal.oldPrice,
        targetPrice: formatEuro(Math.max(1, parseEuroPrice(deal.currentPrice) - 5)),
        discount: deal.discount,
        score: deal.score,
        status: "Surveillé",
        added: deal.added,
        thumbnailTone: deal.thumbnailTone,
        detailHref: `/products/${deal.id}`,
      })),
    [],
  );

  const products = useMemo(() => {
    if (isDemoMode) return [...addedProducts, ...baseProducts];
    if (apiAvailable) return apiProducts;
    return [];
  }, [addedProducts, apiAvailable, apiProducts, baseProducts]);

  const shopOptions = useMemo(() => ["Toutes", ...Array.from(new Set(products.map((product) => product.shop)))], [products]);

  const filteredProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return products
      .filter((product) => {
        const matchesQuery = normalizedQuery
          ? `${product.name} ${product.shop} ${product.region}`.toLowerCase().includes(normalizedQuery)
          : true;
        const matchesShop = shopFilter === "Toutes" || product.shop === shopFilter;
        const matchesScore = product.kind !== "deal" || scoreFilter === "Tous" || product.score === scoreFilter;

        return matchesQuery && matchesShop && matchesScore;
      })
      .sort((a, b) => {
        if (a.kind !== "deal" && b.kind === "deal") return -1;
        if (a.kind === "deal" && b.kind !== "deal") return 1;
        if (a.kind === "deal" && b.kind === "deal") return scoreOrder[b.score] - scoreOrder[a.score];
        return 0;
      });
  }, [products, query, scoreFilter, shopFilter]);

  const bestDeal = baseProducts
    .filter((product): product is Extract<ProductRow, { kind: "deal" }> => product.kind === "deal")
    .reduce((best, product) => (scoreOrder[product.score] > scoreOrder[best.score] ? product : best));
  const averagePrice =
    apiProducts.some((product) => Number.isFinite(parseEuroPrice(product.currentPrice)))
      ? apiProducts.reduce((total, product) => {
          const price = parseEuroPrice(product.currentPrice);
          return Number.isFinite(price) ? total + price : total;
        }, 0) / Math.max(apiProducts.filter((product) => Number.isFinite(parseEuroPrice(product.currentPrice))).length, 1)
      : deals.reduce((total, deal) => total + parseEuroPrice(deal.currentPrice), 0) / Math.max(deals.length, 1);

  function togglePause(productId: string) {
    setPausedIds((current) =>
      current.includes(productId) ? current.filter((id) => id !== productId) : [...current, productId],
    );
  }

  function addProduct(product: AddedProductDraft) {
    setAddedProducts((current) => [draftToProductRow(product), ...current]);
    setIsModalOpen(false);
    setToast(`${product.name} ajouté au suivi local.`);
    window.setTimeout(() => setToast(""), 2800);
  }

  function removeLocalProduct(productId: string) {
    setAddedProducts((current) => current.filter((product) => product.id !== productId));
    setToast("Produit local retiré du suivi.");
    window.setTimeout(() => setToast(""), 2400);
  }

  return (
    <CardSnipAppShell
      title="Produits surveillés"
      subtitle={isDemoMode ? "Mode démo : produits mockés et ajouts locaux." : "Données réelles SQLite via FastAPI."}
      action={
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="h-10 w-fit rounded-lg bg-violet-500 px-4 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(139,92,246,0.2)] transition hover:bg-violet-400"
        >
          + Ajouter un produit
        </button>
      }
    >
      <div className="grid gap-4">
        {isDemoMode ? (
          <AppPanel className="border-violet-400/20 bg-violet-400/[0.04] p-4 text-sm text-violet-100">
            Mode démo : les produits affichés peuvent venir des mocks et du localStorage.
          </AppPanel>
        ) : null}

        {!isDemoMode && !apiAvailable ? (
          <AppPanel className="border-amber-400/20 bg-amber-400/[0.04] p-4 text-sm text-amber-100">
            {apiErrorMessage || "API locale indisponible. Impossible de charger les produits surveillés réels."}
          </AppPanel>
        ) : null}

        {!isDemoMode && apiAvailable && apiProducts.length === 0 ? (
          <AppPanel className="border-white/[0.08] bg-white/[0.025] p-6 text-sm text-zinc-300">
            <p className="font-semibold text-white">Aucun produit surveillé pour l&apos;instant.</p>
            <p className="mt-2 text-zinc-500">Crée un suivi depuis le Catalogue pour alimenter cette page.</p>
          </AppPanel>
        ) : null}

        <section className="grid gap-4 md:grid-cols-3">
          <AppPanel className="p-4">
            <p className="text-xs font-medium text-zinc-500">Produits suivis</p>
            <p className="mt-2 text-3xl font-semibold">{products.length}</p>
            <p className="mt-1 text-sm text-zinc-500">
              {isDemoMode
                ? `${pausedIds.length} en pause, ${addedProducts.length} ajout local`
                : apiAvailable
                  ? "Données réelles SQLite"
                  : "API indisponible"}
            </p>
          </AppPanel>
          <AppPanel className="p-4">
            <p className="text-xs font-medium text-zinc-500">Meilleure opportunité</p>
            <p className="mt-2 truncate text-xl font-semibold">{bestDeal.currentPrice}</p>
            <p className="mt-1 truncate text-sm text-emerald-300">{bestDeal.name}</p>
          </AppPanel>
          <AppPanel className="p-4">
            <p className="text-xs font-medium text-zinc-500">Prix moyen observé</p>
            <p className="mt-2 text-3xl font-semibold">{averagePrice.toFixed(2).replace(".", ",")} EUR</p>
            <p className="mt-1 text-sm text-zinc-500">
              {isDemoMode ? "Mode démo" : apiAvailable ? "Dernières observations SQLite" : "API indisponible"}
            </p>
          </AppPanel>
        </section>

        <AppPanel className="p-4">
          <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_180px_160px_auto]">
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Rechercher un produit, une boutique..."
              className="h-10 rounded-lg border border-white/[0.08] bg-white/[0.035] px-3 text-sm text-zinc-200 outline-none transition placeholder:text-zinc-600 focus:border-violet-300/40"
            />
            <select
              value={shopFilter}
              onChange={(event) => setShopFilter(event.target.value)}
              className="h-10 rounded-lg border border-white/[0.08] bg-black/30 px-3 text-sm text-zinc-200 outline-none"
            >
              {shopOptions.map((shop) => (
                <option key={shop}>{shop}</option>
              ))}
            </select>
            <select
              value={scoreFilter}
              onChange={(event) => setScoreFilter(event.target.value as DealScore | "Tous")}
              className="h-10 rounded-lg border border-white/[0.08] bg-black/30 px-3 text-sm text-zinc-200 outline-none"
            >
              {["Tous", "Excellent", "Bon", "Moyen", "Faible"].map((score) => (
                <option key={score}>{score}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setShopFilter("Toutes");
                setScoreFilter("Tous");
              }}
              className="h-10 rounded-lg border border-white/[0.08] px-4 text-sm font-semibold text-zinc-300 hover:bg-white/[0.04]"
            >
              Réinitialiser
            </button>
          </div>
        </AppPanel>

        <div className="grid gap-3">
          {filteredProducts.map((product) => {
            const isPaused = pausedIds.includes(product.id);

            return (
              <AppPanel
                key={product.id}
                className={`p-4 transition ${isPaused ? "opacity-55" : "hover:border-violet-300/20"}`}
              >
                <div className="flex flex-col gap-4 xl:flex-row xl:items-center">
                  <ProductThumb tone={product.thumbnailTone} label={product.kind === "deal" ? "TCG" : product.category} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-base font-semibold">{product.name}</h2>
                      {product.kind === "deal" ? (
                        <StatusBadge tone={scoreTone(product.score)}>{product.score}</StatusBadge>
                      ) : (
                        <StatusBadge tone="amber">{product.score}</StatusBadge>
                      )}
                      {isPaused ? (
                        <StatusBadge tone="gray">Pause</StatusBadge>
                      ) : (
                        <StatusBadge tone={product.kind === "deal" ? "green" : product.status === "Actif" ? "green" : "amber"}>
                          {product.status}
                        </StatusBadge>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-zinc-500">
                      {product.shop} · dernier check {product.kind === "deal" ? `il y a ${product.added}` : "en attente"} ·{" "}
                      {product.region}
                    </p>
                    {product.stockLabel ? <p className="mt-1 text-xs text-zinc-500">Stock detecte : {product.stockLabel}</p> : null}
                    {product.productUrl ? <p className="mt-2 truncate text-xs text-zinc-600">{product.productUrl}</p> : null}
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-5 xl:w-[680px]">
                    <div>
                      <p className="text-xs text-zinc-500">Prix actuel</p>
                      <p className="font-semibold">{product.currentPrice}</p>
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500">Prix cible</p>
                      <p className="font-semibold text-violet-200">{product.targetPrice}</p>
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500">Ancien prix</p>
                      <p className="text-zinc-500 line-through">{product.oldPrice}</p>
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500">Diff.</p>
                      <p className="font-semibold text-emerald-300">{product.discount}</p>
                    </div>
                    <div className="flex items-end justify-start gap-2 xl:justify-end">
                      <button
                        type="button"
                        onClick={() => togglePause(product.id)}
                        className="rounded-lg border border-white/[0.08] px-3 py-2 text-xs font-semibold text-zinc-300 hover:bg-white/[0.04]"
                      >
                        {isPaused ? "Reprendre" : "Pause"}
                      </button>
                      {product.kind === "deal" ? (
                        <Link
                          href={product.detailHref}
                          className="rounded-lg border border-violet-300/20 bg-violet-400/10 px-3 py-2 text-xs font-semibold text-violet-100 hover:bg-violet-400/15"
                        >
                          Détail
                        </Link>
                      ) : product.kind === "local" ? (
                        <button
                          type="button"
                          onClick={() => removeLocalProduct(product.id)}
                          className="rounded-lg border border-red-300/15 bg-red-400/5 px-3 py-2 text-xs font-semibold text-red-200 hover:bg-red-400/10"
                        >
                          Retirer
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>
              </AppPanel>
            );
          })}

          {filteredProducts.length === 0 ? (
            <AppPanel className="p-8 text-center">
              <p className="font-semibold">Aucun produit trouvé</p>
              <p className="mt-2 text-sm text-zinc-500">
                {!isDemoMode && !apiAvailable
                  ? "Démarre FastAPI pour afficher les produits surveillés réels."
                  : apiAvailable
                    ? "Crée un suivi depuis le catalogue pour alimenter cette page avec des données réelles."
                    : "Essaie une autre boutique, un autre score ou une recherche plus large."}
              </p>
            </AppPanel>
          ) : null}
        </div>
      </div>

      {isModalOpen ? (
        <AddProductModal shops={shopNames} onClose={() => setIsModalOpen(false)} onSubmit={addProduct} />
      ) : null}

      {toast ? (
        <div className="fixed bottom-5 right-5 z-50 rounded-xl border border-emerald-400/20 bg-[#0d1019] px-4 py-3 text-sm font-semibold text-emerald-300 shadow-[0_20px_60px_rgba(0,0,0,0.32)]">
          {toast}
        </div>
      ) : null}
    </CardSnipAppShell>
  );
}
