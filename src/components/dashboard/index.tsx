"use client";

import { CardsResumo } from "../cards/cardResumo";
import { UltimasTransacoes } from "../cards/ultimasTransacoes";
import { FluxoCaixa } from "./fluxoCaixa";
import { DistribuicaoDespesas } from "./distribuicaoDespesas";
import { BalancoFinanceiro } from "./balancoFinanceiro";
import { Orcamentos } from "./orcamentos";
import { useTransactions } from "@/contexts/transactions-context";
import { Activity, Calculator, CalendarClock, ReceiptText, Target } from "lucide-react";
import { useEffect, useState } from "react";

export function Dashboard() {
    const { transacoes, categorias, contasRecorrentes, metasFinanceiras, orcamentos } = useTransactions();
    const despesas = transacoes.filter((transacao) => transacao.type === "Despesa");
    const totalDespesas = despesas.reduce((total, transacao) => total + Math.abs(transacao.value), 0);
    const maiorDespesa = despesas.reduce((maior, transacao) => Math.max(maior, Math.abs(transacao.value)), 0);
    const mediaDespesas = despesas.length ? totalDespesas / despesas.length : 0;
    const ultimaTransacao = transacoes[0];
    const moeda = (valor: number) => valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
    const [today, setToday] = useState<Date | null>(null);

    useEffect(() => {
        const timer = window.setTimeout(() => setToday(new Date()), 0);
        return () => window.clearTimeout(timer);
    }, []);

    const contasPendentes = contasRecorrentes.filter((conta) => conta.status === "Pendente");
    const contasProximas = today
        ? contasPendentes.filter((conta) => {
            const vencimento = new Date(today.getFullYear(), today.getMonth(), conta.dueDay);
            const diferencaEmDias = Math.ceil((vencimento.getTime() - today.getTime()) / 86400000);
            return diferencaEmDias >= 0 && diferencaEmDias <= 7;
        })
        : [];
    const contasVencidas = today
        ? contasPendentes.filter((conta) => conta.dueDay < today.getDate())
        : [];

    return (
        <div className="w-full space-y-7">
            <header>
                <p className="mb-2 text-sm font-medium text-blue-400">Visão geral</p>
                <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Dashboard <span className="text-blue-400"></span></h1>
                <p className="mt-2 text-sm text-slate-500">Aqui está um resumo da sua vida financeira.</p>
            </header>
            <CardsResumo transacoes={transacoes} categorias={categorias}/>
            <FluxoCaixa transacoes={transacoes} />
            <div className="grid gap-5 xl:grid-cols-2">
                <DistribuicaoDespesas transacoes={transacoes} />
                <Orcamentos budgets={orcamentos} transactions={transacoes} />
                <section className="rounded-2xl border border-white/[0.07] bg-white/[0.035] p-5 shadow-2xl shadow-black/10 sm:p-6">
                    <div className="mb-5 flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-bold text-white">Insights rápidos</h2>
                            <p className="mt-1 text-xs text-slate-500">Indicadores para acompanhar seu ritmo</p>
                        </div>
                        <Activity className="text-emerald-400" size={20} />
                    </div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div className="rounded-xl bg-white/[0.04] p-3"><ReceiptText className="mb-2 text-blue-400" size={18} /><p className="text-xs text-slate-500">Transações</p><strong className="text-lg text-white">{transacoes.length}</strong></div>
                        <div className="rounded-xl bg-white/[0.04] p-3"><Target className="mb-2 text-rose-400" size={18} /><p className="text-xs text-slate-500">Maior despesa</p><strong className="break-words text-lg text-white">{moeda(maiorDespesa)}</strong></div>
                        <div className="rounded-xl bg-white/[0.04] p-3"><Calculator className="mb-2 text-amber-400" size={18} /><p className="text-xs text-slate-500">Média por despesa</p><strong className="break-words text-lg text-white">{moeda(mediaDespesas)}</strong></div>
                        <div className="rounded-xl bg-white/[0.04] p-3 sm:col-span-2"><p className="text-xs text-slate-500">Última movimentação</p><strong className="break-words text-sm text-white">{ultimaTransacao ? `${ultimaTransacao.description} · ${moeda(Math.abs(ultimaTransacao.value))}` : "Nenhuma transação cadastrada"}</strong></div>
                    </div>
                </section>
                <BalancoFinanceiro transacoes={transacoes} />
                <div className="col-span-full grid gap-5 xl:grid-cols-2">
                    <section className="rounded-2xl border border-white/[0.07] bg-white/[0.035] p-5 shadow-2xl shadow-black/10 sm:p-6">
                        <div className="flex items-center justify-between"><div><h2 className="text-lg font-bold text-white">Contas recorrentes</h2><p className="mt-1 text-xs text-slate-500">Compromissos pendentes neste mês</p></div><CalendarClock className="text-amber-400" size={20} /></div>
                        <p className="mt-5 text-2xl font-bold text-white">{moeda(contasPendentes.reduce((total, conta) => total + conta.value, 0))}</p>
                        <p className="mt-1 text-xs text-slate-500">{contasPendentes.length} conta(s) pendente(s)</p>
                        {contasProximas.length > 0 && (
                            <div role="status" className="mt-5 rounded-xl border border-amber-400/20 bg-amber-400/10 p-3 text-sm text-amber-200">
                                <p className="font-semibold">Atenção aos próximos vencimentos</p>
                                <p className="mt-1 text-xs text-amber-200/75">
                                    {contasProximas.length === 1
                                        ? `${contasProximas[0].name} vence nos próximos 7 dias.`
                                        : `${contasProximas.length} contas vencem nos próximos 7 dias.`}
                                </p>
                            </div>
                        )}
                        {contasVencidas.length > 0 && (
                            <div role="alert" className="mt-3 rounded-xl border border-rose-400/20 bg-rose-400/10 p-3 text-sm text-rose-200">
                                <p className="font-semibold">Existem contas vencidas</p>
                                <p className="mt-1 text-xs text-rose-200/75">{contasVencidas.length} conta(s) pendente(s) passaram do dia de vencimento.</p>
                            </div>
                        )}
                    </section>
                    <section className="rounded-2xl border border-white/[0.07] bg-white/[0.035] p-5 shadow-2xl shadow-black/10 sm:p-6">
                        <div className="flex items-center justify-between"><div><h2 className="text-lg font-bold text-white">Metas financeiras</h2><p className="mt-1 text-xs text-slate-500">Progresso do seu planejamento</p></div><Target className="text-blue-400" size={20} /></div>
                        {metasFinanceiras.length ? <div className="mt-5 space-y-3">{metasFinanceiras.slice(0, 2).map((meta) => <div key={meta.id}><div className="mb-1 flex justify-between text-xs"><span className="truncate text-slate-300">{meta.name}</span><span className="text-slate-500">{Math.min((meta.currentValue / meta.targetValue) * 100, 100).toFixed(0)}%</span></div><div className="h-2 overflow-hidden rounded-full bg-white/[0.07]"><div className="h-full rounded-full bg-blue-500" style={{ width: `${Math.min((meta.currentValue / meta.targetValue) * 100, 100)}%` }} /></div></div>)}</div> : <p className="mt-5 text-sm text-slate-500">Crie uma meta para acompanhar seu progresso.</p>}
                    </section>
                </div>
            </div>
            <UltimasTransacoes transacoes={transacoes}/>
        </div>
    );
}
