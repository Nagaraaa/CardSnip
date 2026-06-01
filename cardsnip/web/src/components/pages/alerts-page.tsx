"use client";

import { deals } from "@/data/mock-dashboard";
import { AppPanel, CardSnipAppShell } from "@/components/cardsnip-app-shell";
import { ProductThumb, StatusBadge } from "@/components/product-ui";

export function AlertsPage() {
  return (
    <CardSnipAppShell title="Alertes" subtitle="Événements qui demandent ton attention.">
      <div className="grid gap-3">
        {deals.slice(0, 4).map((deal) => (
          <AppPanel key={deal.id} className="p-4">
            <div className="flex items-center gap-4">
              <ProductThumb tone={deal.thumbnailTone} />
              <div className="min-w-0 flex-1">
                <h2 className="truncate font-semibold">{deal.product}</h2>
                <p className="text-sm text-zinc-500">{deal.shop} · retour en stock · {deal.added}</p>
              </div>
              <StatusBadge tone="green">{deal.currentPrice}</StatusBadge>
            </div>
          </AppPanel>
        ))}
      </div>
    </CardSnipAppShell>
  );
}
