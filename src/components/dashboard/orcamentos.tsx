import { AlertTriangle, CheckCircle2, CircleDollarSign } from "lucide-react";
import { useEffect, useState } from "react";
import type { Budget } from "@/types/financial-planning";
import type { Transaction } from "@/types/transaction";

type Props = {
  budgets: Budget[];
  transactions: Transaction[];
};

export function Orcamentos({ budgets, transactions }: Props) {
  const [currentMonth, setCurrentMonth] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setCurrentMonth(new Date().toISOString().slice(0, 7));
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const expenses = currentMonth
    ? transactions.filter((transaction) => transaction.type === "Despesa" && transaction.date.startsWith(currentMonth))
    : [];

  return (
    <section className="rounded-2xl border border-white/[0.07] bg-white/[0.035] p-5 shadow-2xl shadow-black/10 sm:p-6">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white">Orçamentos e limites</h2>
          <p className="mt-1 text-xs text-slate-500">Controle seus gastos neste mês</p>
        </div>
        <CircleDollarSign className="text-blue-400" size={20} />
      </div>
      {budgets.length === 0 ? (
        <p className="rounded-xl border border-dashed border-white/[0.08] py-8 text-center text-sm text-slate-500">Defina limites por categoria para evitar gastos acima do planejado.</p>
      ) : (
        <div className="space-y-4">
          {budgets.map((budget) => {
            const spent = expenses.filter((expense) => expense.category === budget.category).reduce((total, expense) => total + Math.abs(expense.value), 0);
            const percentage = (spent / budget.limit) * 100;
            const status = percentage >= 100 ? "exceeded" : percentage >= 80 ? "warning" : "safe";
            return (
              <div key={budget.id}>
                <div className="mb-1.5 flex items-center justify-between gap-3 text-sm">
                  <span className="truncate text-slate-300">{budget.category}</span>
                  <span className={`shrink-0 font-medium ${status === "exceeded" ? "text-rose-400" : status === "warning" ? "text-amber-300" : "text-slate-300"}`}>
                    {formatCurrency(spent)} / {formatCurrency(budget.limit)}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/[0.07]">
                  <div className={`h-full rounded-full transition-all ${status === "exceeded" ? "bg-rose-400" : status === "warning" ? "bg-amber-400" : "bg-emerald-400"}`} style={{ width: `${Math.min(percentage, 100)}%` }} />
                </div>
                <p className={`mt-1.5 flex items-center gap-1 text-xs ${status === "exceeded" ? "text-rose-400" : status === "warning" ? "text-amber-300" : "text-slate-500"}`}>
                  {status === "exceeded" ? <AlertTriangle size={13} /> : status === "warning" ? <AlertTriangle size={13} /> : <CheckCircle2 size={13} />}
                  {status === "exceeded" ? `Limite ultrapassado em ${formatCurrency(spent - budget.limit)}.` : status === "warning" ? "Atenção: você está próximo do limite." : `${Math.max(budget.limit - spent, 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} disponíveis.`}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
