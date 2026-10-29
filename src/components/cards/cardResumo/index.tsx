import { ChartPie, TrendingDown, TrendingUp, Wallet } from "lucide-react";
import type { Transaction } from "@/types/transaction";
import type { Category } from "@/types/category";

type CardsResumoProps = {
  transacoes: Transaction[];
  categorias: Category[];
};

export function CardsResumo({ transacoes, categorias }: CardsResumoProps){
    const saldoAtual = transacoes.reduce((total, transacao) => total + transacao.value, 0);
    const receitas = transacoes
      .filter((transacao) => transacao.type === "Receita")
      .reduce((total, transacao) => total + transacao.value, 0);
    const despesas = transacoes
      .filter((transacao) => transacao.type === "Despesa")
      .reduce((total, transacao) => total + Math.abs(transacao.value), 0);
    const formatCurrency = (value: number) =>
      value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
    const summaryCards = [
            { title: "Saldo atual", value: formatCurrency(saldoAtual), icon: Wallet, iconColor: "text-blue-500", text: "text-white font-bold text-xl" },
            { title: "Receitas", value: formatCurrency(receitas), icon: TrendingUp, iconColor: "text-emerald-500", text: "text-emerald-500 font-bold text-xl" },
            { title: "Despesas", value: formatCurrency(despesas), icon: TrendingDown, iconColor: "text-rose-500", text: "text-rose-500 font-bold text-xl" },
            { title: "Categorias", value: categorias.length.toString(), icon: ChartPie, iconColor: "text-purple-500", text: "text-white font-bold text-xl" },
        ];

    return(
        <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {summaryCards.map((card)=> {
                const Icon = card.icon;
                return(
                    <div key={card.title}
                    className="group flex min-h-36 w-full flex-col justify-between rounded-2xl border border-white/[0.07] bg-white/[0.035] p-5 text-gray-300 shadow-2xl shadow-black/10 transition-all hover:-translate-y-0.5 hover:border-blue-400/20"
                    >
                       <div className="flex items-center justify-between">
                         <span className="text-sm text-slate-500">{card.title}</span>
                         <span className={`rounded-lg bg-white/[0.06] p-2 ${card.iconColor}`}>
                           <Icon size={18}/>
                         </span>
                       </div>
                        <span className={`${card.text} break-words text-xl tracking-tight sm:text-2xl`}>{card.value}</span>
                    </div>
                )
            })}
        </div>
    )
}