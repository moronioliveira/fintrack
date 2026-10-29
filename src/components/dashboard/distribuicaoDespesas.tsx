import { PieChart } from "lucide-react";
import type { Transaction } from "@/types/transaction";

type Props = {
  transacoes: Transaction[];
};

const COLORS = [
  "#60a5fa",
  "#34d399",
  "#fbbf24",
  "#fb7185",
  "#a78bfa",
  "#22d3ee",
  "#f97316",
  "#e879f9",
];

export function DistribuicaoDespesas({ transacoes }: Props) {
  const despesas = transacoes.filter((transacao) => transacao.type === "Despesa");
  const gastosPorCategoria = despesas.reduce<Record<string, number>>((totais, transacao) => {
    totais[transacao.category] = (totais[transacao.category] ?? 0) + Math.abs(transacao.value);
    return totais;
  }, {});
  const ranking = Object.entries(gastosPorCategoria).sort(([, a], [, b]) => b - a);
  const total = ranking.reduce((soma, [, valor]) => soma + valor, 0);
  const chartSegments = buildChartSegments(ranking, total);
  const chartBackground = chartSegments.length
    ? `conic-gradient(${chartSegments.join(", ")})`
    : "conic-gradient(#1e293b 0deg 360deg)";

  return (
    <section className="rounded-2xl border border-white/[0.07] bg-white/[0.035] p-5 shadow-2xl shadow-black/10 sm:p-6">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white">Distribuição das despesas</h2>
          <p className="mt-1 text-xs text-slate-500">Participação de cada categoria no total</p>
        </div>
        <PieChart className="text-blue-400" size={20} />
      </div>

      {ranking.length === 0 ? (
        <div className="flex min-h-56 items-center justify-center rounded-xl border border-dashed border-white/[0.08] px-4 text-center text-sm text-slate-500">
          Cadastre despesas para visualizar o gráfico circular.
        </div>
      ) : (
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-center">
          <div
            aria-label={`Distribuição das despesas por categoria. Total de ${formatCurrency(total)}.`}
            className="relative flex h-48 w-48 shrink-0 items-center justify-center rounded-full"
            role="img"
            style={{ background: chartBackground }}
          >
            <div className="flex h-28 w-28 flex-col items-center justify-center rounded-full bg-[#101827] text-center shadow-inner shadow-black/30">
              <span className="text-[11px] text-slate-500">Total</span>
              <strong className="max-w-24 break-words text-sm text-white">{formatCurrency(total)}</strong>
            </div>
          </div>
          <div className="w-full space-y-3 sm:max-w-xs">
            {ranking.map(([categoria, valor], index) => {
              const percentual = (valor / total) * 100;
              return (
                <div key={categoria} className="flex items-center justify-between gap-3 text-sm">
                  <span className="flex min-w-0 items-center gap-2 text-slate-300">
                    <i className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                    <span className="truncate">{categoria}</span>
                  </span>
                  <span className="shrink-0 text-xs font-medium text-slate-400">{percentual.toFixed(0)}%</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}

function buildChartSegments(ranking: [string, number][], total: number) {
  if (!total) return [];

  let start = 0;
  return ranking.map(([, valor], index) => {
    const end = start + (valor / total) * 360;
    const segment = `${COLORS[index % COLORS.length]} ${start}deg ${end}deg`;
    start = end;
    return segment;
  });
}

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
