"use client";

import { useEffect, useState } from "react";
import { deals } from "@/data/mock-dashboard";
import { AppPanel, CardSnipAppShell } from "@/components/cardsnip-app-shell";
import { ProductThumb, StatusBadge } from "@/components/product-ui";
import { cardsnipApi } from "@/lib/cardsnip-api";
import { isDemoMode } from "@/lib/demo-mode";
import type { ApiAlert } from "@/types/local-api";

export function AlertsPage() {
  const [alerts, setAlerts] = useState<ApiAlert[]>([]);
  const [apiAvailable, setApiAvailable] = useState(false);
  const [apiErrorMessage, setApiErrorMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadAlerts() {
      try {
        const result = await cardsnipApi.listAlerts();
        if (cancelled) return;
        setAlerts(result);
        setApiAvailable(true);
        setApiErrorMessage("");
      } catch (error) {
        if (cancelled) return;
        setApiAvailable(false);
        setApiErrorMessage(error instanceof Error ? error.message : "API locale CardSnip indisponible.");
      }
    }

    void loadAlerts();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <CardSnipAppShell
      title="Alertes"
      subtitle={
        apiAvailable
          ? "Alertes reelles creees par les checks scraper."
          : isDemoMode
            ? "Mode demo : alertes mockees du prototype."
            : "API locale indisponible."
      }
    >
      {!apiAvailable && isDemoMode ? (
        <AppPanel className="mb-4 border-violet-400/20 bg-violet-400/[0.04] p-4 text-sm text-violet-100">
          Mode demo : les alertes affichees ci-dessous sont des exemples mockes.
        </AppPanel>
      ) : null}

      {!apiAvailable && !isDemoMode ? (
        <AppPanel className="mb-4 border-amber-400/20 bg-amber-400/[0.04] p-4 text-sm text-amber-100">
          API locale indisponible. Les alertes reelles ne peuvent pas etre chargees.
          {apiErrorMessage ? <span className="mt-2 block text-xs text-amber-200/80">{apiErrorMessage}</span> : null}
        </AppPanel>
      ) : null}

      {apiAvailable && alerts.length === 0 ? (
        <AppPanel className="p-5 text-sm text-zinc-300">
          <p className="font-semibold text-white">Aucune alerte reelle pour l&apos;instant.</p>
          <p className="mt-2 text-zinc-500">
            Lance un check scraper avec un prix cible atteint pour creer une alerte SQLite.
          </p>
        </AppPanel>
      ) : null}

      <div className="grid gap-3">
        {apiAvailable
          ? alerts.map((alert) => (
              <AppPanel key={alert.id} className="p-4">
                <div className="flex items-start gap-4">
                  <ProductThumb tone="from-emerald-200 to-violet-100" label="SQL" />
                  <div className="min-w-0 flex-1">
                    <h2 className="truncate font-semibold">{alert.product_name}</h2>
                    <p className="mt-1 break-words text-sm leading-5 text-zinc-500">{alert.message}</p>
                    <p className="mt-2 text-xs text-zinc-600">
                      {alert.shop_name} - {alert.created_at}
                    </p>
                  </div>
                  <StatusBadge tone={alert.type === "price_target" ? "green" : "violet"}>{alert.type}</StatusBadge>
                </div>
              </AppPanel>
            ))
          : null}

        {!apiAvailable && isDemoMode
          ? deals.slice(0, 4).map((deal) => (
              <AppPanel key={deal.id} className="p-4">
                <div className="flex items-center gap-4">
                  <ProductThumb tone={deal.thumbnailTone} />
                  <div className="min-w-0 flex-1">
                    <h2 className="truncate font-semibold">{deal.product}</h2>
                    <p className="text-sm text-zinc-500">{deal.shop} - demo - {deal.added}</p>
                  </div>
                  <StatusBadge tone="gray">Demo</StatusBadge>
                </div>
              </AppPanel>
            ))
          : null}
      </div>
    </CardSnipAppShell>
  );
}
