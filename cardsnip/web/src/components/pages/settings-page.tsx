"use client";

import { AppPanel, CardSnipAppShell } from "@/components/cardsnip-app-shell";

export function SettingsPage() {
  return (
    <CardSnipAppShell title="Compte et paramètres" subtitle="Réglages mockés du mode admin local.">
      <div className="grid gap-4 lg:grid-cols-2">
        <AppPanel className="p-5">
          <h2 className="text-base font-semibold">Compte local</h2>
          <p className="mt-2 text-sm leading-6 text-zinc-400">
            Le MVP démarre avec un compte admin connecté d’office. La vraie connexion utilisateur est volontairement en
            pause pour ne pas complexifier le prototype.
          </p>
        </AppPanel>
        <AppPanel className="p-5">
          <h2 className="text-base font-semibold">Préférences alertes</h2>
          <div className="mt-4 grid gap-3 text-sm text-zinc-300">
            <label className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.025] p-3">
              Alertes console
              <input type="checkbox" checked readOnly />
            </label>
            <label className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.025] p-3">
              Discord webhook
              <input type="checkbox" readOnly />
            </label>
          </div>
        </AppPanel>
      </div>
    </CardSnipAppShell>
  );
}
