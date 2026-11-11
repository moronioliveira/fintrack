"use client";

import { useState } from "react";
import { formatMoney, formatPercent } from "@/lib/format";

type Slice = { id: string; name: string; color: string; value: number; share: number };

const MAX_SLICES = 6;

/** Rosca de participação por categoria + lista (serve como legenda e tabela). */
export function DonutChart({ data, currency, totalLabel = "Total" }: { data: Slice[]; currency: string; totalLabel?: string }) {
  const [hover, setHover] = useState<string | null>(null);
  const total = data.reduce((acc, d) => acc + d.value, 0);

  // Agrupa a cauda em "Outras" para não gerar dezenas de fatias ilegíveis.
  const slices: Slice[] = data.length > MAX_SLICES
    ? [
        ...data.slice(0, MAX_SLICES - 1),
        (() => {
          const rest = data.slice(MAX_SLICES - 1);
          const value = rest.reduce((acc, d) => acc + d.value, 0);
          return { id: "other", name: `Outras (${rest.length})`, color: "#94a3b8", value, share: total ? (value / total) * 100 : 0 };
        })(),
      ]
    : data;

  const R = 70;
  const STROKE = 20;
  const C = 2 * Math.PI * R;
  const GAP = slices.length > 1 ? 2 : 0;
  const offsets = slices.map((_, i) => slices.slice(0, i).reduce((a, s) => a + (s.value / (total || 1)) * C, 0));
  const active = slices.find((s) => s.id === hover);

  return (
    <div className="@container">
    <div className="flex flex-col items-center gap-5 @lg:flex-row @lg:items-center">
      <div className="relative shrink-0">
        <svg viewBox="0 0 180 180" className="size-44 -rotate-90" role="img" aria-label="Distribuição por categoria">
          <circle cx={90} cy={90} r={R} fill="none" stroke="var(--surface-2)" strokeWidth={STROKE} />
          {slices.map((s, i) => {
            const len = (s.value / (total || 1)) * C;
            const dash = Math.max(0, len - GAP);
            return (
              <circle
                key={s.id}
                cx={90}
                cy={90}
                r={R}
                fill="none"
                stroke={s.color}
                strokeWidth={hover === s.id ? STROKE + 4 : STROKE}
                strokeDasharray={`${dash} ${C - dash}`}
                strokeDashoffset={-offsets[i]}
                opacity={hover && hover !== s.id ? 0.35 : 1}
                className="cursor-pointer transition-all"
                onMouseEnter={() => setHover(s.id)}
                onMouseLeave={() => setHover(null)}
              />
            );
          })}
        </svg>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="max-w-24 truncate text-[11px] text-muted">{active ? active.name : totalLabel}</span>
          <span className="tabular text-sm font-semibold">{formatMoney(active ? active.value : total, currency, { compact: (active?.value ?? total) >= 100000 })}</span>
          {active && <span className="tabular text-[11px] text-muted">{formatPercent(active.share, 1)}</span>}
        </div>
      </div>
      <ul className="flex w-full min-w-0 flex-col gap-1">
        {slices.map((s) => (
          <li
            key={s.id}
            onMouseEnter={() => setHover(s.id)}
            onMouseLeave={() => setHover(null)}
            className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition ${hover === s.id ? "bg-surface-2" : ""}`}
          >
            <span className="size-2.5 shrink-0 rounded-sm" style={{ background: s.color }} />
            <span className="min-w-0 flex-1 truncate">{s.name}</span>
            <span className="tabular text-xs text-muted">{formatPercent(s.share)}</span>
            <span className="tabular w-24 text-right text-xs font-medium">{formatMoney(s.value, currency)}</span>
          </li>
        ))}
      </ul>
    </div>
    </div>
  );
}
