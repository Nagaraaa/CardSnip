"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";

const navItems = [
  { label: "Dashboard", icon: "D", href: "/dashboard" },
  { label: "Produits", icon: "P", href: "/products" },
  { label: "Catalogue", icon: "C", href: "/catalogue" },
  { label: "Boutiques", icon: "B", href: "/shops" },
  { label: "Deals", icon: "W", href: "/deals" },
  { label: "Veille", icon: "V", href: "/watch" },
  { label: "Alertes", icon: "A", href: "/alerts" },
  { label: "Compte", icon: "AD", href: "/settings" },
];

export function AppPanel({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`min-w-0 rounded-xl border border-white/[0.08] bg-[#0d1019]/90 shadow-[0_18px_50px_rgba(0,0,0,0.22)] ${className}`}
    >
      {children}
    </section>
  );
}

export function CardSnipAppShell({
  title,
  subtitle,
  children,
  action,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  const pathname = usePathname();

  return (
    <main className="min-h-screen bg-[#070910] text-white">
      <div className="flex min-h-screen flex-col lg:flex-row">
        <aside className="border-b border-white/[0.08] bg-[#090b12]/95 p-4 lg:fixed lg:inset-y-0 lg:w-60 lg:border-b-0 lg:border-r">
          <div className="flex h-full flex-col gap-6">
            <Link href="/dashboard" className="flex items-center gap-3 px-1">
              <div className="grid h-10 w-10 place-items-center rounded-xl border border-violet-400/25 bg-violet-400/10 text-sm font-black text-violet-200">
                CS
              </div>
              <div className="text-xl font-black tracking-normal">
                Card<span className="text-violet-300">Snip</span>
              </div>
            </Link>

            <nav className="grid gap-1.5">
              {navItems.map((item) => {
                const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium transition duration-200 ${
                      active
                        ? "border border-violet-400/20 bg-violet-400/12 text-white"
                        : "text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-100"
                    }`}
                  >
                    <span className="grid h-6 w-6 place-items-center rounded-md bg-white/[0.04] text-[11px] font-bold text-zinc-300">
                      {item.icon}
                    </span>
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <div className="rounded-xl border border-white/[0.08] bg-white/[0.025] p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">Compte</p>
              <div className="mt-3 flex items-center gap-3">
                <div className="grid h-9 w-9 place-items-center rounded-lg bg-violet-400/12 text-xs font-black text-violet-200">
                  AD
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">Admin local</p>
                  <p className="text-xs text-zinc-500">Connecté d’office</p>
                </div>
              </div>
              <button
                type="button"
                disabled
                className="mt-3 w-full cursor-not-allowed rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 py-2 text-xs font-semibold text-zinc-500"
              >
                Connexion utilisateur en pause
              </button>
            </div>
          </div>
        </aside>

        <div className="flex-1 lg:ml-60">
          <div className="mx-auto max-w-[1440px] px-4 py-5 sm:px-6 xl:px-8">
            <header className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-violet-300/80">Prototype MVP</p>
                <h1 className="mt-2 text-2xl font-semibold tracking-normal text-white sm:text-3xl">{title}</h1>
                <p className="mt-1 text-sm text-zinc-400">{subtitle}</p>
              </div>
              {action}
            </header>

            <div className="mt-6">{children}</div>
          </div>
        </div>
      </div>
    </main>
  );
}
