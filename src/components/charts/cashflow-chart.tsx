"use client";

import { useState } from "react";
import { formatMonth, formatShortMonth } from "@/lib/dates";
import { formatMoney } from "@/lib/format";

type Point = { month: string; income: number; expense: number; result: number };

const H = 220;
const PAD_TOP = 12;
const PAD_BOTTOM = 24;
const AXIS_W = 56;

/** Escala com passos "redondos" (1, 2, 2,5, 5 × 10ⁿ) e 3 a 5 divisões. */
function niceScale(value: number) {
  if (value <= 0) return { max: 100, ticks: [0, 25, 50, 75, 100] };
  const raw = value / 4;
  const exp = 10 ** Math.floor(Math.log10(raw));
  const step = ([1, 2, 2.5, 5, 10].find((s) => raw / exp <= s) ?? 10) * exp;
  const max = Math.ceil(value / step) * step;
  return { max, ticks: Array.from({ length: Math.round(max / step) + 1 }, (_, i) => i * step) };
}

/** Barras agrupadas de receitas x despesas por mês, com tooltip por mês. */
export function CashflowChart({ data, currency }: { data: Point[]; currency: string }) {
  const [hover, setHover] = useState<number | null>(null);
  const { max, ticks } = niceScale(Math.max(...data.flatMap((d) => [d.income, d.expense]), 0));
  const plotH = H - PAD_TOP - PAD_BOTTOM;
  const y = (v: number) => PAD_TOP + plotH - (v / max) * plotH;
  const W = 640;
  const plotW = W - AXIS_W;
  const band = plotW / data.length;
  const barW = Math.min(18, (band - 16) / 2);
  const active = hover === null ? null : data[hover];

  return (
    <div className="relative">
      <div className="mb-3 flex items-center gap-4 text-xs text-muted">
        <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-[var(--chart-income)]" /> Receitas</span>
        <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-[var(--chart-expense)]" /> Despesas</span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full overflow-visible" role="img" aria-label="Gráfico de receitas e despesas por mês" onMouseLeave={() => setHover(null)}>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={AXIS_W} x2={W} y1={y(t)} y2={y(t)} stroke="var(--chart-grid)" strokeWidth={1} />
            <text x={AXIS_W - 8} y={y(t)} dy="0.32em" textAnchor="end" className="fill-[var(--muted)] text-[10px] tabular">
              {formatMoney(t, currency, { compact: true })}
            </text>
          </g>
        ))}
        {data.map((d, i) => {
          const cx = AXIS_W + band * i + band / 2;
          const isActive = hover === i;
          return (
            <g key={d.month}>
              {isActive && <rect x={AXIS_W + band * i + 2} y={PAD_TOP} width={band - 4} height={plotH} rx={6} fill="var(--surface-2)" />}
              <Bar x={cx - barW - 1} w={barW} top={y(d.income)} bottom={y(0)} color="var(--chart-income)" dim={hover !== null && !isActive} />
              <Bar x={cx + 1} w={barW} top={y(d.expense)} bottom={y(0)} color="var(--chart-expense)" dim={hover !== null && !isActive} />
              <text x={cx} y={H - 6} textAnchor="middle" className={`text-[11px] ${isActive ? "fill-[var(--fg)] font-medium" : "fill-[var(--muted)]"}`}>
                {formatShortMonth(d.month)}
              </text>
              <rect
                x={AXIS_W + band * i}
                y={0}
                width={band}
                height={H}
                fill="transparent"
                onMouseEnter={() => setHover(i)}
                onFocus={() => setHover(i)}
                onBlur={() => setHover(null)}
                tabIndex={0}
                aria-label={`${formatMonth(d.month)}: receitas ${formatMoney(d.income, currency)}, despesas ${formatMoney(d.expense, currency)}`}
              />
            </g>
          );
        })}
        <line x1={AXIS_W} x2={W} y1={y(0)} y2={y(0)} stroke="var(--border)" strokeWidth={1} />
      </svg>
      {active && hover !== null && (
        <div
          className="pointer-events-none absolute top-8 z-10 w-52 -translate-x-1/2 rounded-xl border border-border bg-surface p-3 text-xs shadow-lg"
          style={{ left: `clamp(6.5rem, ${((AXIS_W + band * hover + band / 2) / W) * 100}%, calc(100% - 6.5rem))` }}
        >
          <p className="mb-2 font-medium">{formatMonth(active.month)}</p>
          <Row color="var(--chart-income)" label="Receitas" value={formatMoney(active.income, currency)} />
          <Row color="var(--chart-expense)" label="Despesas" value={formatMoney(active.expense, currency)} />
          <div className="mt-2 flex justify-between border-t border-border pt-2">
            <span className="text-muted">Resultado</span>
            <span className={`tabular font-semibold ${active.result >= 0 ? "text-success" : "text-danger"}`}>{formatMoney(active.result, currency, { signed: true })}</span>
          </div>
        </div>
      )}
    </div>
  );
}

function Bar({ x, w, top, bottom, color, dim }: { x: number; w: number; top: number; bottom: number; color: string; dim: boolean }) {
  const h = Math.max(0, bottom - top);
  if (h < 0.5) return null;
  const r = Math.min(4, h, w / 2);
  // Topo arredondado (4px), base reta ancorada na linha zero.
  const d = `M${x},${bottom} V${top + r} Q${x},${top} ${x + r},${top} H${x + w - r} Q${x + w},${top} ${x + w},${top + r} V${bottom} Z`;
  return <path d={d} fill={color} opacity={dim ? 0.45 : 1} className="transition-opacity" />;
}

function Row({ color, label, value }: { color: string; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 py-0.5">
      <span className="flex items-center gap-1.5 text-muted"><span className="size-2 rounded-sm" style={{ background: color }} />{label}</span>
      <span className="tabular font-medium">{value}</span>
    </div>
  );
}
