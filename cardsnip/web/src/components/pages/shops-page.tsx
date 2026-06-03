"use client";

import { useEffect, useMemo, useState } from "react";
import { AppPanel, CardSnipAppShell } from "@/components/cardsnip-app-shell";
import { StatusBadge } from "@/components/product-ui";
import { shops } from "@/data/mock-dashboard";
import { cardsnipApi } from "@/lib/cardsnip-api";
import type { ApiShopStatus, ShopHealthStatus } from "@/types/local-api";

type ShopRow = {
  id: string;
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

  useEffect(() => {
    let cancelled = false;

    async function loadShops() {
      try {
        const result = await cardsnipApi.listShopStatuses();
        if (cancelled) return;
        setApiShops(result.map(apiShopStatusToRow));
        setApiAvailable(true);
      } catch {
        if (!cancelled) setApiAvailable(false);
      }
    }

    void loadShops();

    return () => {
      cancelled = true;
    };
  }, []);

  const rows = useMemo(() => (apiAvailable ? apiShops : shops.map(mockShopToRow)), [apiAvailable, apiShops]);

  return (
    <CardSnipAppShell
      title="Boutiques"
      subtitle={apiAvailable ? "Statut local des sources CardSnip depuis SQLite." : "Sources fiables activables dans le prototype."}
    >
      {!apiAvailable ? (
        <AppPanel className="mb-4 border-amber-400/20 bg-amber-400/[0.04] p-4 text-sm text-amber-100">
          API locale indisponible, affichage des données de démonstration.
        </AppPanel>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {rows.map((shop) => (
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
            </div>
          </AppPanel>
        ))}
      </div>
    </CardSnipAppShell>
  );
}
