import { DealScore } from "@/data/mock-dashboard";

export type BadgeTone = "green" | "violet" | "amber" | "gray";

export const scoreOrder: Record<DealScore, number> = {
  Excellent: 4,
  Bon: 3,
  Moyen: 2,
  Faible: 1,
};

export function ProductThumb({ tone, label = "TCG" }: { tone: string; label?: string }) {
  return (
    <div className={`h-14 w-11 shrink-0 rounded-xl border border-white/15 bg-gradient-to-br ${tone} p-1 shadow-sm`}>
      <div className="grid h-full place-items-center rounded-lg border border-black/10 bg-white/90 text-[10px] font-black text-zinc-900">
        {label}
      </div>
    </div>
  );
}

export function StatusBadge({ children, tone = "green" }: { children: string; tone?: BadgeTone }) {
  const styles: Record<BadgeTone, string> = {
    green: "border-emerald-400/20 bg-emerald-400/10 text-emerald-300",
    violet: "border-violet-400/20 bg-violet-400/10 text-violet-200",
    amber: "border-amber-400/20 bg-amber-400/10 text-amber-200",
    gray: "border-zinc-400/15 bg-zinc-400/10 text-zinc-300",
  };

  return <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${styles[tone]}`}>{children}</span>;
}

export function parseEuroPrice(price: string) {
  return Number(price.replace(" EUR", "").replace(",", "."));
}

export function scoreTone(score: DealScore): BadgeTone {
  if (score === "Excellent") return "green";
  if (score === "Moyen") return "amber";
  if (score === "Faible") return "gray";
  return "violet";
}
