import { BriefcaseBusiness, ChartPie, ShoppingCart, TrendingDown, TrendingUp, Wallet } from "lucide-react";
import { CardsResumo } from "../cardResumo";

export function Grid() {

    // 1. Dados das Últimas Transações
    const latestTransactions = [
        {
            title: "Supermercado",
            category: "Alimentação", 
            amount: "− R$ 150",
            isExpense: true,
            icon: ShoppingCart,
        },
        {
            title: "Salário",
            category: "Receita",
            amount: "+ R$ 2.000",
            isExpense: false,
            icon: BriefcaseBusiness,
        },
    ];

    return (
        <div className="w-full">
            <h2 className="text-white my-5 font-bold text-2xl">Dashboard</h2>
            
            <div className="grid grid-cols-2 gap-5 text-white w-full">
                
                {/* Renderização dinâmica dos cartões de saldo/resumo */}
                    <div className="col-span-2">
                        <CardsResumo/>
                    </div>
                {/* Bloco de Últimas Transações */}
                <div className="flex flex-col text-gray-300 col-span-2 border border-zinc-800 p-4 rounded-xl gap-4 bg-zinc-900/30">
                    <span className="font-bold text-white text-lg">Últimas transações</span>
                    
                    <div className="flex flex-col gap-3">
                        {latestTransactions.map((tx, index) => {
                            const TxIcon = tx.icon;
                            const isLast = index === latestTransactions.length - 1;

                            return (
                                <div 
                                    key={index} 
                                    className={`flex items-center gap-3 pb-3 ${
                                        !isLast ? "border-b border-zinc-800" : ""
                                    }`}
                                >
                                    <div className="p-2 bg-zinc-800 rounded-lg text-white">
                                        <TxIcon size={18} />
                                    </div>
                                    
                                    <div className="flex flex-col">
                                        <span className="text-white font-medium">{tx.title}</span>
                                        <span className="text-sm text-zinc-500">{tx.category}</span>
                                    </div>

                                    <span 
                                        className={`ml-auto font-medium ${
                                            tx.isExpense ? "text-rose-500" : "text-emerald-500"
                                        }`}
                                    >
                                        {tx.amount}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>

            </div>
        </div>
    );
}
