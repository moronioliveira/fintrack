import { CardsResumo } from "@/components/cardResumo";
import { TransacoesHeader } from "@/components/header/transacoesHeader";
import { ChartPie, TrendingDown, TrendingUp, Wallet } from "lucide-react";

export default function Transacoes(){

    

    return(
        <div className="flex flex-col gap-5">
            <TransacoesHeader/>
            <CardsResumo/>
        </div>
    )
}