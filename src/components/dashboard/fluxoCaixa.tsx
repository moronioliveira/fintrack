import { BarChart3 } from "lucide-react";
import type { Transaction } from "@/types/transaction";

type Props = {
  transacoes: Transaction[];
};

type MonthSummary = {
  label: string;
  receitas: number;
  despesas: number;
};

const MONTH_LABELS = [
  "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
  "Jul", "Ago", "Set", "Out", "Nov", "Dez",
];

export function FluxoCaixa({ transacoes }: Props) {
  const months = summarizeMonths(transacoes);
  const maxValue = Math.max(
    ...months.flatMap((month) => [month.receitas, month.despesas]),
    1,
  );
  const hasData = months.some((month) => month.receitas > 0 || month.despesas > 0);

  return (
    <section className="rounded-2xl border border-white/[0.07] bg-white/[0.035] p-5 shadow-2xl shadow-black/10 sm:p-6">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-white">Fluxo de caixa</h2>
          <p className="mt-1 text-xs text-slate-500">Compare receitas e despesas por mês</p>
        </div>
        <div className="flex items-center gap-4 text-xs text-slate-400">
          <span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-emerald-400" />Receitas</span>
          <span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-rose-400" />Despesas</span>
          <BarChart3 size={19} className="hidden text-blue-400 sm:block" />
        </div>
      </div>

      {!hasData ? (
        <div className="flex min-h-56 items-center justify-center rounded-xl border border-dashed border-white/[0.08] px-4 text-center text-sm text-slate-500">
          Cadastre transações para acompanhar a evolução do seu fluxo de caixa.
        </div>
      ) : (
        <div className="overflow-x-auto pb-1">
          <div className="min-w-[620px]">
            <div className="flex h-56 items-end gap-2 border-b border-l border-white/[0.08] px-3 sm:gap-3">
              {months.map((month) => (
                <div key={month.label} className="flex h-full flex-1 items-end justify-center gap-1">
                  <div
                    title={`${month.label}: receitas ${formatCurrency(month.receitas)}`}
                    className="w-full max-w-5 rounded-t-md bg-emerald-400/80 transition-all hover:bg-emerald-300"
                    style={{ height: `${Math.max((month.receitas / maxValue) * 100, month.receitas ? 3 : 0)}%` }}
                  />
                  <div
                    title={`${month.label}: despesas ${formatCurrency(month.despesas)}`}
                    className="w-full max-w-5 rounded-t-md bg-rose-400/80 transition-all hover:bg-rose-300"
                    style={{ height: `${Math.max((month.despesas / maxValue) * 100, month.despesas ? 3 : 0)}%` }}
                  />
                </div>
              ))}
            </div>
            <div className="mt-2 flex gap-2 px-3 sm:gap-3">
              {months.map((month) => (
                <span key={month.label} className="flex-1 text-center text-[11px] text-slate-600">{month.label}</span>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function summarizeMonths(transacoes: Transaction[]): MonthSummary[] {
  const totals = MONTH_LABELS.map((label) => ({ label, receitas: 0, despesas: 0 }));

  transacoes.forEach((transacao) => {
    const monthIndex = Number(transacao.date.slice(5, 7)) - 1;
    if (monthIndex < 0 || monthIndex > 11 || Number.isNaN(monthIndex)) return;

    if (transacao.type === "Receita") {
      totals[monthIndex].receitas += Math.abs(transacao.value);
    } else {
      totals[monthIndex].despesas += Math.abs(transacao.value);
    }
  });

  return totals;
}

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
