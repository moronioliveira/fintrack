"use client";

import { CardsResumo } from "../cards/cardResumo";
import { UltimasTransacoes } from "../cards/ultimasTransacoes";
import { useTransactions } from "@/contexts/transactions-context";
import { Activity, BarChart3, Calculator, ReceiptText, Target } from "lucide-react";

export function Dashboard() {
    const { transacoes, categorias } = useTransactions();
    const despesas = transacoes.filter((transacao) => transacao.type === "Despesa");
    const gastosPorCategoria = despesas.reduce<Record<string, number>>((totais, transacao) => {
        totais[transacao.category] = (totais[transacao.category] ?? 0) + Math.abs(transacao.value);
        return totais;
    }, {});
    const rankingCategorias = Object.entries(gastosPorCategoria).sort(([, a], [, b]) => b - a);
    const totalDespesas = despesas.reduce((total, transacao) => total + Math.abs(transacao.value), 0);
    const maiorDespesa = despesas.reduce((maior, transacao) => Math.max(maior, Math.abs(transacao.value)), 0);
    const mediaDespesas = despesas.length ? totalDespesas / despesas.length : 0;
    const ultimaTransacao = transacoes[0];
    const moeda = (valor: number) => valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

    return (
        <div className="w-full space-y-7">
            <header>
                <p className="mb-2 text-sm font-medium text-blue-400">Visão geral</p>
                <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Dashboard <span className="text-blue-400"></span></h1>
                <p className="mt-2 text-sm text-slate-500">Aqui está um resumo da sua vida financeira.</p>
            </header>
            <CardsResumo transacoes={transacoes} categorias={categorias}/>
            <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
                <section className="rounded-2xl border border-white/[0.07] bg-white/[0.035] p-5 shadow-2xl shadow-black/10 sm:p-6">
                    <div className="mb-5 flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-bold text-white">Gastos por categoria</h2>
                            <p className="mt-1 text-xs text-slate-500">Onde seu dinheiro está sendo utilizado</p>
                        </div>
                        <BarChart3 className="text-blue-400" size={20} />
                    </div>
                    {rankingCategorias.length === 0 ? (
                        <p className="py-8 text-center text-sm text-slate-500">Cadastre despesas para visualizar sua distribuição.</p>
                    ) : (
                        <div className="space-y-4">
                            {rankingCategorias.map(([categoria, valor]) => {
                                const percentual = totalDespesas ? (valor / totalDespesas) * 100 : 0;
                                return (
                                    <div key={categoria}>
                                        <div className="mb-1.5 flex justify-between text-sm">
                                            <span className="text-slate-300">{categoria}</span>
                                            <span className="font-medium text-white">{moeda(valor)} <span className="text-xs text-slate-500">({percentual.toFixed(0)}%)</span></span>
                                        </div>
                                        <div className="h-2 overflow-hidden rounded-full bg-white/[0.06]">
                                            <div className="h-full rounded-full bg-blue-500" style={{ width: `${percentual}%` }} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </section>
                <section className="rounded-2xl border border-white/[0.07] bg-white/[0.035] p-5 shadow-2xl shadow-black/10 sm:p-6">
                    <div className="mb-5 flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-bold text-white">Insights rápidos</h2>
                            <p className="mt-1 text-xs text-slate-500">Indicadores para acompanhar seu ritmo</p>
                        </div>
                        <Activity className="text-emerald-400" size={20} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-xl bg-white/[0.04] p-3"><ReceiptText className="mb-2 text-blue-400" size={18} /><p className="text-xs text-slate-500">Transações</p><strong className="text-lg text-white">{transacoes.length}</strong></div>
                        <div className="rounded-xl bg-white/[0.04] p-3"><Target className="mb-2 text-rose-400" size={18} /><p className="text-xs text-slate-500">Maior despesa</p><strong className="text-lg text-white">{moeda(maiorDespesa)}</strong></div>
                        <div className="rounded-xl bg-white/[0.04] p-3"><Calculator className="mb-2 text-amber-400" size={18} /><p className="text-xs text-slate-500">Média por despesa</p><strong className="text-lg text-white">{moeda(mediaDespesas)}</strong></div>
                        <div className="col-span-2 rounded-xl bg-white/[0.04] p-3"><p className="text-xs text-slate-500">Última movimentação</p><strong className="text-sm text-white">{ultimaTransacao ? `${ultimaTransacao.description} · ${moeda(Math.abs(ultimaTransacao.value))}` : "Nenhuma transação cadastrada"}</strong></div>
                    </div>
                </section>
            </div>
            <UltimasTransacoes transacoes={transacoes}/>
        </div>
    );
}
