"use client";

import { useEffect, useMemo, useState } from "react";
import { shops } from "@/data/mock-dashboard";
import { AppPanel, CardSnipAppShell } from "@/components/cardsnip-app-shell";
import { StatusBadge } from "@/components/product-ui";
import { cardsnipApi } from "@/lib/cardsnip-api";
import type { ApiShop } from "@/types/local-api";

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
  notes?: string | null;
  products?: string;
  mark: string;
  lastCheck: string;
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

function apiShopToRow(shop: ApiShop): ShopRow {
  return {
    id: `api-shop-${shop.id}`,
    name: shop.name,
    country: shop.country ?? "unknown",
    type: shop.type ?? "tcg_specialist",
    priority: shop.priority ?? "medium",
    difficulty: shop.difficulty ?? "unknown",
    integrationStatus: shop.integration_status ?? "to_analyze",
    scraperKey: shop.scraper_key ?? "not_configured",
    active: Boolean(shop.active),
    notes: shop.notes,
    mark: shop.name.slice(0, 2).toUpperCase(),
    lastCheck: shop.integration_status === "functional" ? "local" : "non configure",
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
    products: shop.products,
    mark: shop.mark,
    lastCheck: shop.lastCheck,
  };
}

export function ShopsPage() {
  const [apiShops, setApiShops] = useState<ShopRow[]>([]);
  const [apiAvailable, setApiAvailable] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadShops() {
      try {
        const result = await cardsnipApi.listShops();
        if (cancelled) return;
        setApiShops(result.map(apiShopToRow));
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
                <StatusBadge tone={statusTone[shop.integrationStatus] ?? "gray"}>{shop.integrationStatus}</StatusBadge>
                <StatusBadge tone={priorityTone[shop.priority] ?? "gray"}>{shop.priority}</StatusBadge>
              </div>
              <div className="grid gap-1 text-xs">
                <p>Pays : {shop.country}</p>
                <p>Type : {shop.type}</p>
                <p>Difficulte : {shop.difficulty}</p>
                <p>Scraper : {shop.scraperKey}</p>
                {shop.notes ? <p className="leading-5 text-zinc-500">{shop.notes}</p> : null}
              </div>
              <p className="text-xs text-zinc-500">Dernier check {shop.lastCheck}</p>
            </div>
          </AppPanel>
        ))}
      </div>
    </CardSnipAppShell>
  );
}
