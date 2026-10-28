import { ChartPie, TrendingDown, TrendingUp, Wallet } from "lucide-react";

export function CardsResumo(){

    const summaryCards = [
            { title: "Saldo atual", value: "R$ 3.250", icon: Wallet, iconColor: "text-blue-500", text: "text-white font-bold text-xl" },
            { title: "Receitas", value: "R$ 4.000", icon: TrendingUp, iconColor: "text-emerald-500", text: "text-emerald-500 font-bold text-xl" },
            { title: "Despesas", value: "R$ 750", icon: TrendingDown, iconColor: "text-rose-500", text: "text-rose-500 font-bold text-xl" },
            { title: "Categorias", value: "5", icon: ChartPie, iconColor: "text-purple-500", text: "text-white font-bold text-xl" },
        ];

    return(
        <div className="w-full flex gap-4">
            {summaryCards.map((card, index)=> {
                const Icon = card.icon;
                return(
                    <div key={index}
                    className="w-full flex flex-col text-gray-300 border border-zinc-800 p-4 rounded-xl gap-4 bg-zinc-900/30"
                    >
                       <div className="flex gap-2">
                         <Icon size={24} className={card.iconColor}/>
                        <span className="text-sm text-zinc-400">{card.title}</span>
                       </div>
                        <span className={card.text}>{card.value}</span>
                    </div>
                )
            })}
        </div>
    )
}