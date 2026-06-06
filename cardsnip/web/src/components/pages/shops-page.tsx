"use client";

import { useEffect, useMemo, useState } from "react";
import { AppPanel, CardSnipAppShell } from "@/components/cardsnip-app-shell";
import { StatusBadge } from "@/components/product-ui";
import { shops } from "@/data/mock-dashboard";
import { cardsnipApi } from "@/lib/cardsnip-api";
import { isDemoMode } from "@/lib/demo-mode";
import type { ApiShopCheckResult, ApiShopStatus, ShopHealthStatus } from "@/types/local-api";

type ShopRow = {
  id: string;
  shopId: number | null;
  name: string;
  country: string;
  type: string;
  priority: string;
  difficulty: string;
  integrationStatus: string;
  scraperKey: string;
  active: boolean;
  trusted: boolean;
  notes?: string | null;
  products?: string;
  mark: string;
  lastCheck: string;
  lastSuccess: string;
  lastPrice: string;
  lastStock: string;
  recentObservations: number;
  recentAlerts: number;
  lastError: string;
  healthStatus: ShopHealthStatus;
};

const priorityTone: Record<string, "green" | "violet" | "amber" | "gray"> = {
  high: "green",
  medium: "violet",
  low: "amber",
  later: "gray",
};

const statusTone: Record<string, "green" | "violet" | "amber" | "gray"> = {
  functional: "green",
  to_analyze: "amber",
  in_progress: "violet",
  not_configured: "gray",
  disabled: "gray",
  later: "gray",
};

const healthTone: Record<ShopHealthStatus, "green" | "violet" | "amber" | "gray"> = {
  healthy: "green",
  degraded: "amber",
  broken: "amber",
  unknown: "gray",
  not_configured: "gray",
};

const healthLabel: Record<ShopHealthStatus, string> = {
  healthy: "Sain",
  degraded: "Dégradé",
  broken: "Erreur",
  unknown: "Inconnu",
  not_configured: "Non configuré",
};

function formatDateTime(value: string | null | undefined) {
  if (!value) return "Jamais vérifié";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatPrice(value: number | null | undefined) {
  if (value === null || value === undefined) return "Non disponible";
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(value);
}

function formatStock(value: string | null | undefined) {
  if (!value) return "Non disponible";
  if (value === "in_stock") return "En stock";
  if (value === "out_of_stock") return "Rupture";
  return value;
}

function apiShopStatusToRow(shop: ApiShopStatus): ShopRow {
  return {
    id: `api-shop-${shop.shop_id}`,
    shopId: shop.shop_id,
    name: shop.name,
    country: shop.country ?? "unknown",
    type: shop.type ?? "tcg_specialist",
    priority: shop.priority ?? "medium",
    difficulty: shop.difficulty ?? "unknown",
    integrationStatus: shop.integration_status ?? "to_analyze",
    scraperKey: shop.scraper_key ?? "not_configured",
    active: Boolean(shop.active),
    trusted: Boolean(shop.trusted),
    notes: shop.notes,
    mark: shop.name.slice(0, 2).toUpperCase(),
    lastCheck: formatDateTime(shop.last_checked_at),
    lastSuccess: formatDateTime(shop.last_success_at),
    lastPrice: formatPrice(shop.last_price),
    lastStock: formatStock(shop.last_stock_status),
    recentObservations: shop.recent_observations_count,
    recentAlerts: shop.recent_alerts_count,
    lastError: shop.last_error ?? "Aucune erreur connue",
    healthStatus: shop.health_status,
  };
}

function mockShopToRow(shop: (typeof shops)[number]): ShopRow {
  return {
    id: shop.id,
    shopId: null,
    name: shop.name,
    country: "mock",
    type: "tcg_specialist",
    priority: "medium",
    difficulty: "unknown",
    integrationStatus: shop.enabled ? "functional" : "not_configured",
    scraperKey: "mock",
    active: shop.enabled,
    trusted: true,
    products: shop.products,
    mark: shop.mark,
    lastCheck: shop.lastCheck,
    lastSuccess: "Non disponible",
    lastPrice: "Non disponible",
    lastStock: "Non disponible",
    recentObservations: 0,
    recentAlerts: 0,
    lastError: "Aucune erreur connue",
    healthStatus: shop.enabled ? "unknown" : "not_configured",
  };
}

export function ShopsPage() {
  const [apiShops, setApiShops] = useState<ShopRow[]>([]);
  const [apiAvailable, setApiAvailable] = useState(false);
  const [apiErrorMessage, setApiErrorMessage] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("functional");
  const [checkingShopId, setCheckingShopId] = useState<number | null>(null);
  const [shopCheckResults, setShopCheckResults] = useState<Record<number, ApiShopCheckResult>>({});

  async function loadShops() {
    const result = await cardsnipApi.listShopStatuses();
    setApiShops(result.map(apiShopStatusToRow));
    setApiAvailable(true);
    setApiErrorMessage("");
  }

  useEffect(() => {
    let cancelled = false;

    async function loadInitialShops() {
      try {
        const result = await cardsnipApi.listShopStatuses();
        if (cancelled) return;
        setApiShops(result.map(apiShopStatusToRow));
        setApiAvailable(true);
        setApiErrorMessage("");
      } catch (error) {
        if (!cancelled) {
          setApiAvailable(false);
          setApiErrorMessage(error instanceof Error ? error.message : "API locale CardSnip indisponible.");
        }
      }
    }

    void loadInitialShops();

    return () => {
      cancelled = true;
    };
  }, []);

  const rows = useMemo(() => {
    if (apiAvailable) return apiShops;
    if (isDemoMode) return shops.map(mockShopToRow);
    return [];
  }, [apiAvailable, apiShops]);

  const filters = useMemo(
    () => [
      { id: "functional", label: "Fonctionnelles" },
      { id: "in_progress", label: "En cours" },
      { id: "to_analyze", label: "A analyser" },
      { id: "to_review", label: "A revoir" },
      { id: "later", label: "A eviter / plus tard" },
      { id: "all", label: "Toutes" },
    ],
    [],
  );

  const filterCounts = useMemo(() => {
    const counts: Record<string, number> = {
      functional: 0,
      in_progress: 0,
      to_analyze: 0,
      to_review: 0,
      later: 0,
      all: rows.length,
    };

    for (const shop of rows) {
      if (shop.integrationStatus === "functional") counts.functional += 1;
      else if (shop.integrationStatus === "in_progress") counts.in_progress += 1;
      else if (shop.integrationStatus === "to_analyze") counts.to_analyze += 1;
      else if (shop.integrationStatus === "disabled" || shop.integrationStatus === "later") counts.later += 1;
      else counts.to_review += 1;
    }

    return counts;
  }, [rows]);

  const filteredRows = useMemo(() => {
    const sortedRows = [...rows].sort((a, b) => {
      if (a.integrationStatus === "functional" && b.integrationStatus !== "functional") return -1;
      if (a.integrationStatus !== "functional" && b.integrationStatus === "functional") return 1;
      return a.name.localeCompare(b.name);
    });

    if (selectedFilter === "all") return sortedRows;
    if (selectedFilter === "later") {
      return sortedRows.filter((shop) => shop.integrationStatus === "disabled" || shop.integrationStatus === "later");
    }
    if (selectedFilter === "to_review") {
      return sortedRows.filter(
        (shop) => !["functional", "in_progress", "to_analyze", "disabled", "later"].includes(shop.integrationStatus),
      );
    }
    return sortedRows.filter((shop) => shop.integrationStatus === selectedFilter);
  }, [rows, selectedFilter]);

  async function testShop(shopId: number) {
    setCheckingShopId(shopId);

    try {
      const result = await cardsnipApi.checkShop(shopId);
      setShopCheckResults((current) => ({ ...current, [shopId]: result }));
      await loadShops();
    } catch (error) {
      setShopCheckResults((current) => ({
        ...current,
        [shopId]: {
          shop_id: shopId,
          shop_name: "Boutique",
          tracked_products: 0,
          observations: 0,
          alerts: 0,
          errors: 1,
          messages: [error instanceof Error ? error.message : "Erreur inconnue pendant le test boutique."],
        },
      }));
    } finally {
      setCheckingShopId(null);
    }
  }

  return (
    <CardSnipAppShell
      title="Boutiques"
      subtitle={
        apiAvailable
          ? "Statut local des sources CardSnip depuis SQLite."
          : isDemoMode
            ? "Mode demo : sources mockees du prototype."
            : "API locale indisponible."
      }
    >
      {!apiAvailable && isDemoMode ? (
        <AppPanel className="mb-4 border-amber-400/20 bg-amber-400/[0.04] p-4 text-sm text-amber-100">
          API locale indisponible, affichage explicite des donnees de demonstration.
        </AppPanel>
      ) : null}

      {!apiAvailable && !isDemoMode ? (
        <AppPanel className="mb-4 border-amber-400/20 bg-amber-400/[0.04] p-4 text-sm text-amber-100">
          API locale indisponible. Les boutiques reelles ne peuvent pas etre chargees.
          {apiErrorMessage ? <span className="mt-2 block text-xs text-amber-200/80">{apiErrorMessage}</span> : null}
        </AppPanel>
      ) : null}

      {apiAvailable && rows.length === 0 ? (
        <AppPanel className="mb-4 border-white/[0.08] bg-white/[0.025] p-5 text-sm text-zinc-300">
          <p className="font-semibold text-white">Aucune boutique reelle disponible.</p>
          <p className="mt-2 text-zinc-500">Initialise SQLite pour remplir la liste des shops.</p>
        </AppPanel>
      ) : null}

      <div className="mb-4 flex flex-wrap gap-2">
        {filters.map((filter) => (
          <button
            key={filter.id}
            type="button"
            onClick={() => setSelectedFilter(filter.id)}
            className={`rounded-lg border px-3 py-2 text-xs font-semibold transition ${
              selectedFilter === filter.id
                ? "border-violet-300/30 bg-violet-400/15 text-violet-100"
                : "border-white/[0.08] bg-white/[0.025] text-zinc-400 hover:text-zinc-100"
            }`}
          >
            {filter.label} ({filterCounts[filter.id] ?? 0})
          </button>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filteredRows.map((shop) => {
          const shopCheckResult = shop.shopId ? shopCheckResults[shop.shopId] : undefined;

          return (
          <AppPanel key={shop.id} className="p-5">
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-white/[0.05] text-xs font-black">{shop.mark}</div>
              <div>
                <h2 className="font-semibold">{shop.name}</h2>
                <p className="text-sm text-zinc-500">{apiAvailable ? shop.integrationStatus : `${shop.products} produits mockés`}</p>
              </div>
            </div>

            <div className="mt-5 grid gap-3 text-sm text-zinc-400">
              <div className="flex flex-wrap gap-2">
                <StatusBadge tone={shop.active ? "green" : "gray"}>{shop.active ? "Actif" : "Pause"}</StatusBadge>
                <StatusBadge tone={shop.trusted ? "green" : "gray"}>{shop.trusted ? "Fiable" : "Non validée"}</StatusBadge>
                <StatusBadge tone={statusTone[shop.integrationStatus] ?? "gray"}>{shop.integrationStatus}</StatusBadge>
                <StatusBadge tone={priorityTone[shop.priority] ?? "gray"}>{shop.priority}</StatusBadge>
                <StatusBadge tone={healthTone[shop.healthStatus]}>{healthLabel[shop.healthStatus]}</StatusBadge>
              </div>

              <div className="grid gap-1 text-xs">
                <p>Pays : {shop.country}</p>
                <p>Type : {shop.type}</p>
                <p>Priorité : {shop.priority}</p>
                <p>Difficulté : {shop.difficulty}</p>
                <p>Scraper : {shop.scraperKey}</p>
                {shop.notes ? <p className="leading-5 text-zinc-500">{shop.notes}</p> : null}
              </div>

              <div className="rounded-xl border border-white/[0.07] bg-black/20 p-3">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">Santé du scraper</p>
                  <StatusBadge tone={healthTone[shop.healthStatus]}>{healthLabel[shop.healthStatus]}</StatusBadge>
                </div>
                <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
                  <div>
                    <dt className="text-zinc-500">Dernier check</dt>
                    <dd className="mt-0.5 text-zinc-200">{shop.lastCheck}</dd>
                  </div>
                  <div>
                    <dt className="text-zinc-500">Dernier succès</dt>
                    <dd className="mt-0.5 text-zinc-200">{shop.lastSuccess}</dd>
                  </div>
                  <div>
                    <dt className="text-zinc-500">Dernier prix</dt>
                    <dd className="mt-0.5 text-zinc-200">{shop.lastPrice}</dd>
                  </div>
                  <div>
                    <dt className="text-zinc-500">Stock</dt>
                    <dd className="mt-0.5 text-zinc-200">{shop.lastStock}</dd>
                  </div>
                  <div>
                    <dt className="text-zinc-500">Observations 7j</dt>
                    <dd className="mt-0.5 text-zinc-200">{shop.recentObservations}</dd>
                  </div>
                  <div>
                    <dt className="text-zinc-500">Alertes 7j</dt>
                    <dd className="mt-0.5 text-zinc-200">{shop.recentAlerts}</dd>
                  </div>
                </dl>
                <p className="mt-2 text-xs text-zinc-500">Dernière erreur : {shop.lastError}</p>
              </div>

              {apiAvailable && shop.integrationStatus === "functional" && shop.shopId ? (
                <button
                  type="button"
                  onClick={() => void testShop(shop.shopId as number)}
                  disabled={checkingShopId === shop.shopId}
                  className="h-10 rounded-lg border border-emerald-300/20 bg-emerald-400/10 px-4 text-xs font-semibold text-emerald-100 transition hover:bg-emerald-400/15 disabled:cursor-not-allowed disabled:border-white/[0.08] disabled:bg-white/[0.03] disabled:text-zinc-500"
                >
                  {checkingShopId === shop.shopId ? "Test en cours..." : "Tester cette boutique"}
                </button>
              ) : (
                <p className="text-xs text-zinc-500">Test individuel disponible depuis la page Produits.</p>
              )}

              {shopCheckResult ? (
                <div
                  className={`rounded-xl border p-3 text-xs ${
                    shopCheckResult.errors > 0
                      ? "border-red-300/15 bg-red-400/5 text-red-100"
                      : "border-emerald-300/15 bg-emerald-400/5 text-emerald-100"
                  }`}
                >
                  <p className="font-semibold">
                    {shopCheckResult.errors > 0 ? "Erreur test boutique" : "Dernier test boutique"}
                  </p>
                  <p className="mt-1 leading-5">
                    {shopCheckResult.tracked_products} suivi(s), {shopCheckResult.observations} observation(s),{" "}
                    {shopCheckResult.alerts} alerte(s), {shopCheckResult.errors} erreur(s)
                  </p>
                  {shopCheckResult.messages.length > 0 ? (
                    <p className="mt-1 leading-5">{shopCheckResult.messages.join(" ")}</p>
                  ) : null}
                </div>
              ) : null}
            </div>
          </AppPanel>
          );
        })}
      </div>
    </CardSnipAppShell>
  );
}
