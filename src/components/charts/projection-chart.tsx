"use client";

import { useRef, useState } from "react";
import { formatDate } from "@/lib/dates";
import { formatMoney } from "@/lib/format";

type Day = { date: string; income: number; expense: number; balance: number };

const W = 720;
const H = 240;
const PAD = { top: 12, right: 8, bottom: 26, left: 64 };

function niceStep(range: number) {
  const raw = range / 4 || 1;
  const exp = 10 ** Math.floor(Math.log10(raw));
  return ([1, 2, 2.5, 5, 10].find((s) => raw / exp <= s) ?? 10) * exp;
}

/** Linha de saldo projetado com área, linha do zero e crosshair com tooltip. */
export function ProjectionChart({ data, currency }: { data: Day[]; currency: string }) {
  const [hover, setHover] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const values = data.map((d) => d.balance);
  const rawMin = Math.min(0, ...values);
  const rawMax = Math.max(0, ...values);
  const step = niceStep(rawMax - rawMin);
  const min = Math.floor(rawMin / step) * step;
  const max = Math.ceil(rawMax / step) * step || step;
  const ticks = Array.from({ length: Math.round((max - min) / step) + 1 }, (_, i) => min + i * step);
  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;
  const x = (i: number) => PAD.left + (data.length > 1 ? (i / (data.length - 1)) * plotW : plotW / 2);
  const y = (v: number) => PAD.top + plotH - ((v - min) / (max - min || 1)) * plotH;
  const line = data.map((d, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(d.balance).toFixed(1)}`).join(" ");
  const area = `${line} L${x(data.length - 1)},${y(Math.max(min, 0))} L${x(0)},${y(Math.max(min, 0))} Z`;
  const labelEvery = Math.ceil(data.length / 6);
  const active = hover === null ? null : data[hover];

  function onMove(event: React.PointerEvent<SVGSVGElement>) {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    const px = ((event.clientX - rect.left) / rect.width) * W;
    const i = Math.round(((px - PAD.left) / plotW) * (data.length - 1));
    setHover(Math.max(0, Math.min(data.length - 1, i)));
  }

  return (
    <div className="relative">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        className="h-auto w-full touch-none overflow-visible"
        role="img"
        aria-label="Saldo projetado por dia"
        onPointerMove={onMove}
        onPointerLeave={() => setHover(null)}
      >
        {ticks.map((t) => (
          <g key={t}>
            <line x1={PAD.left} x2={W - PAD.right} y1={y(t)} y2={y(t)} stroke={t === 0 ? "var(--border)" : "var(--chart-grid)"} strokeWidth={t === 0 ? 1.5 : 1} />
            <text x={PAD.left - 8} y={y(t)} dy="0.32em" textAnchor="end" className="tabular fill-[var(--muted)] text-[10px]">
              {formatMoney(t, currency, { compact: true })}
            </text>
          </g>
        ))}
        {min < 0 && <rect x={PAD.left} y={y(0)} width={plotW} height={y(min) - y(0)} fill="var(--danger-soft)" />}
        <path d={area} fill="var(--primary)" opacity={0.08} />
        <path d={line} fill="none" stroke="var(--primary)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
        {data.map((d, i) =>
          i % labelEvery === 0 ? (
            <text key={d.date} x={x(i)} y={H - 6} textAnchor="middle" className="fill-[var(--muted)] text-[10px]">
              {formatDate(d.date).slice(0, 5)}
            </text>
          ) : null,
        )}
        {active && hover !== null && (
          <g>
            <line x1={x(hover)} x2={x(hover)} y1={PAD.top} y2={PAD.top + plotH} stroke="var(--muted)" strokeDasharray="3 3" />
            <circle cx={x(hover)} cy={y(active.balance)} r={4.5} fill="var(--primary)" stroke="var(--surface)" strokeWidth={2} />
          </g>
        )}
      </svg>
      {active && hover !== null && (
        <div
          className="pointer-events-none absolute top-2 z-10 w-48 -translate-x-1/2 rounded-xl border border-border bg-surface p-3 text-xs shadow-lg"
          style={{ left: `clamp(6rem, ${(x(hover) / W) * 100}%, calc(100% - 6rem))` }}
        >
          <p className="font-medium">{formatDate(active.date)}</p>
          <p className={`tabular mt-1 text-sm font-semibold ${active.balance < 0 ? "text-danger" : ""}`}>{formatMoney(active.balance, currency)}</p>
          {(active.income > 0 || active.expense > 0) && (
            <div className="mt-2 space-y-0.5 border-t border-border pt-2 text-muted">
              {active.income > 0 && <p className="tabular">Entradas: {formatMoney(active.income, currency)}</p>}
              {active.expense > 0 && <p className="tabular">Saídas: {formatMoney(active.expense, currency)}</p>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
