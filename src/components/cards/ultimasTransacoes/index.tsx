import { ArrowDownCircle, ArrowUpCircle } from "lucide-react";
import type { Transaction } from "@/types/transaction";

type UltimasTransacoesProps = {
  transacoes: Transaction[];
};

export function UltimasTransacoes({ transacoes }: UltimasTransacoesProps){
    const latestTransactions = transacoes.slice(0, 5);
    return(
        <div className="rounded-2xl border border-white/[0.07] bg-white/[0.035] p-5 shadow-2xl shadow-black/10 sm:p-6">
            <div className="flex flex-col gap-5 text-gray-300">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="block text-lg font-bold text-white">Últimas transações</span>
                        <span className="mt-1 block text-xs text-slate-500">Movimentações recentes</span>
                      </div>
                      <span className="rounded-lg bg-blue-500/10 px-3 py-1.5 text-xs font-semibold text-blue-400">Últimas 5</span>
                    </div>
                    
                    <div className="flex flex-col gap-3">
                        {latestTransactions.length === 0 && (
                            <p className="rounded-xl border border-dashed border-white/[0.08] py-8 text-center text-sm text-slate-500">
                                Suas transações recentes aparecerão aqui.
                            </p>
                        )}
                        {latestTransactions.map((tx, index) => {
                            const isExpense = tx.type === "Despesa";
                            const TxIcon = isExpense ? ArrowDownCircle : ArrowUpCircle;
                            const isLast = index === latestTransactions.length - 1;

                            return (
                                <div 
                                    key={index} 
                                    className={`flex items-center gap-3 pb-3 ${
                                    !isLast ? "border-b border-white/[0.06]" : ""
                                    }`}
                                >
                                    <div className={`rounded-xl p-2.5 ${isExpense ? "bg-rose-500/10 text-rose-400" : "bg-emerald-500/10 text-emerald-400"}`}>
                                        <TxIcon size={18} />
                                    </div>
                                    
                                    <div className="flex flex-col">
                                        <span className="font-medium text-white">{tx.description}</span>
                                        <span className="text-sm text-slate-500">{tx.category}</span>
                                    </div>

                                    <span 
                                        className={`ml-auto font-medium ${
                                            isExpense ? "text-rose-500" : "text-emerald-500"
                                        }`}
                                    >
                                        {tx.value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
        </div>
    )
}