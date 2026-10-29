import { ArrowDownLeft, ArrowUpRight, Scale } from "lucide-react";
import type { Transaction } from "@/types/transaction";

type Props = {
  transacoes: Transaction[];
};

export function BalancoFinanceiro({ transacoes }: Props) {
  const receitas = transacoes
    .filter((transacao) => transacao.type === "Receita")
    .reduce((total, transacao) => total + Math.abs(transacao.value), 0);
  const despesas = transacoes
    .filter((transacao) => transacao.type === "Despesa")
    .reduce((total, transacao) => total + Math.abs(transacao.value), 0);
  const saldo = receitas - despesas;
  const totalMovimentado = receitas + despesas;
  const percentualReceitas = totalMovimentado ? (receitas / totalMovimentado) * 100 : 0;
  const percentualDespesas = totalMovimentado ? (despesas / totalMovimentado) * 100 : 0;
  const hasData = totalMovimentado > 0;

  return (
    <section className="rounded-2xl border border-white/[0.07] bg-white/[0.035] p-5 shadow-2xl shadow-black/10 sm:p-6">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white">Balanço financeiro</h2>
          <p className="mt-1 text-xs text-slate-500">Relação entre entradas e saídas</p>
        </div>
        <Scale className="text-amber-400" size={20} />
      </div>

      <div className="rounded-xl border border-white/[0.06] bg-white/[0.025] p-4">
        <p className="text-xs text-slate-500">Saldo das movimentações</p>
        <strong className={`mt-1 block break-words text-2xl font-bold ${saldo >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
          {formatCurrency(saldo)}
        </strong>
        <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/[0.07]">
          <div className="flex h-full">
            <div className="bg-emerald-400 transition-all" style={{ width: `${percentualReceitas}%` }} />
            <div className="bg-rose-400 transition-all" style={{ width: `${percentualDespesas}%` }} />
          </div>
        </div>
        {hasData ? (
          <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
            <div className="flex min-w-0 items-center gap-2">
              <ArrowUpRight className="shrink-0 text-emerald-400" size={15} />
              <span className="min-w-0">
                <span className="block text-slate-500">Receitas</span>
                <strong className="block break-words text-slate-200">{formatCurrency(receitas)}</strong>
              </span>
            </div>
            <div className="flex min-w-0 items-center gap-2">
              <ArrowDownLeft className="shrink-0 text-rose-400" size={15} />
              <span className="min-w-0">
                <span className="block text-slate-500">Despesas</span>
                <strong className="block break-words text-slate-200">{formatCurrency(despesas)}</strong>
              </span>
            </div>
          </div>
        ) : (
          <p className="mt-3 text-xs text-slate-500">Cadastre transações para acompanhar seu balanço.</p>
        )}
      </div>
    </section>
  );
}

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
