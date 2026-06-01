"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { PricePoint } from "@/data/mock-dashboard";

export type PriceChartDatum = PricePoint & {
  targetPrice: number;
  belowTarget: boolean;
};

export type PriceHistoryChartProps = {
  data: PriceChartDatum[];
  domain: [number, number];
  targetPrice: number;
};

function formatPrice(price: number) {
  return `${price.toFixed(2).replace(".", ",")} EUR`;
}

function PriceTooltip({
  active,
  label,
  payload,
}: {
  active?: boolean;
  label?: string;
  payload?: Array<{ value?: number; payload?: PriceChartDatum }>;
}) {
  if (!active || !payload?.length) {
    return null;
  }

  const point = payload[0]?.payload;
  const price = payload[0]?.value;

  if (!point || typeof price !== "number") {
    return null;
  }

  return (
    <div className="rounded-xl border border-white/[0.08] bg-[#0b0d14]/95 px-3 py-2 shadow-[0_18px_50px_rgba(0,0,0,0.35)]">
      <p className="text-xs font-medium text-zinc-500">{label}</p>
      <p className="mt-1 text-sm font-semibold text-white">{formatPrice(price)}</p>
      <p className={point.belowTarget ? "mt-1 text-xs text-emerald-300" : "mt-1 text-xs text-zinc-500"}>
        {point.belowTarget ? "Sous le prix cible" : `Prix cible ${formatPrice(point.targetPrice)}`}
      </p>
    </div>
  );
}

export function PriceHistoryChart({ data, domain, targetPrice }: PriceHistoryChartProps) {
  return (
    <div className="relative h-full">
      <div className="pointer-events-none absolute right-3 top-2 z-10 rounded-full border border-violet-300/20 bg-[#10131d]/90 px-3 py-1 text-xs font-semibold text-violet-200 shadow-[0_12px_30px_rgba(0,0,0,0.28)]">
        Prix cible {formatPrice(targetPrice)}
      </div>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 34, right: 18, bottom: 6, left: 2 }}>
          <defs>
            <linearGradient id="priceGradient" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.26} />
              <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="rgba(255,255,255,0.07)" vertical={false} />
          <XAxis
            dataKey="date"
            axisLine={false}
            tickLine={false}
            minTickGap={18}
            tick={{ fill: "rgba(212,212,216,0.68)", fontSize: 12 }}
          />
          <YAxis
            width={58}
            domain={domain}
            axisLine={false}
            tickLine={false}
            tickFormatter={(value: number) => `${Math.round(value)} EUR`}
            tick={{ fill: "rgba(212,212,216,0.68)", fontSize: 12 }}
          />
          <Tooltip cursor={{ stroke: "rgba(167,139,250,0.28)", strokeWidth: 1 }} content={<PriceTooltip />} />
          <ReferenceLine y={targetPrice} stroke="#a78bfa" strokeDasharray="6 6" strokeOpacity={0.65} />
          <Area
            type="monotone"
            dataKey="price"
            name="Prix observé"
            stroke="#c084fc"
            strokeWidth={3.5}
            fill="url(#priceGradient)"
            isAnimationActive={false}
            activeDot={{ r: 6, fill: "#f5f3ff", stroke: "#8b5cf6", strokeWidth: 2 }}
            dot={{ r: 3.5, fill: "#c084fc", stroke: "#070910", strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
