"use client";

import { shops } from "@/data/mock-dashboard";
import { AppPanel, CardSnipAppShell } from "@/components/cardsnip-app-shell";
import { StatusBadge } from "@/components/product-ui";

export function ShopsPage() {
  return (
    <CardSnipAppShell title="Boutiques" subtitle="Sources fiables activables dans le prototype.">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {shops.map((shop) => (
          <AppPanel key={shop.id} className="p-5">
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-white/[0.05] text-xs font-black">{shop.mark}</div>
              <div>
                <h2 className="font-semibold">{shop.name}</h2>
                <p className="text-sm text-zinc-500">{shop.products} produits mockés</p>
              </div>
            </div>
            <div className="mt-5 flex items-center justify-between">
              <StatusBadge tone={shop.enabled ? "green" : "gray"}>{shop.enabled ? "Actif" : "Pause"}</StatusBadge>
              <p className="text-xs text-zinc-500">Dernier check {shop.lastCheck}</p>
            </div>
          </AppPanel>
        ))}
      </div>
    </CardSnipAppShell>
  );
}
