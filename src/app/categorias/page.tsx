"use client";

import {
    BriefcaseBusiness, Car, Check, CircleDollarSign, GraduationCap, Gamepad2,
    HeartPulse, House, Pencil, Plus, ShoppingBag, Tag, Trash2, Utensils, X,
} from "lucide-react";
import { useState } from "react";
import { useTransactions } from "@/contexts/transactions-context";

const ICONES_CATEGORIA = [
    { name: "Utensils", label: "Alimentação", component: Utensils },
    { name: "House", label: "Casa", component: House },
    { name: "Car", label: "Transporte", component: Car },
    { name: "HeartPulse", label: "Saúde", component: HeartPulse },
    { name: "GraduationCap", label: "Educação", component: GraduationCap },
    { name: "Gamepad2", label: "Lazer", component: Gamepad2 },
    { name: "ShoppingBag", label: "Compras", component: ShoppingBag },
    { name: "BriefcaseBusiness", label: "Trabalho", component: BriefcaseBusiness },
    { name: "CircleDollarSign", label: "Dinheiro", component: CircleDollarSign },
    { name: "Tag", label: "Outro", component: Tag },
];

export default function Categorias(){
    const { categorias, transacoes, adicionarCategoria, editarCategoria, removerCategoria } = useTransactions();
    const [nome, setNome] = useState("");
    const [icone, setIcone] = useState("Tag");
    const [editandoId, setEditandoId] = useState<string | null>(null);
    const [mensagem, setMensagem] = useState("");

    function salvarCategoria() {
        if (!nome.trim()) return;
        if (editandoId) {
            editarCategoria(editandoId, nome, icone);
        } else {
            adicionarCategoria(nome, icone);
        }
        setNome("");
        setIcone("Tag");
        setEditandoId(null);
    }

    function excluirCategoria(id: string) {
        if (!removerCategoria(id)) {
            setMensagem("Não é possível excluir uma categoria que possui transações.");
            return;
        }
        setMensagem("");
    }

    return(
        <div className="space-y-7">
            <div>
                <p className="mb-2 text-sm font-medium text-blue-400">Organização</p>
                <h1 className="text-3xl font-bold tracking-tight">Categorias</h1>
                <p className="mt-2 text-sm text-slate-500">Organize seus lançamentos para entender melhor seus hábitos.</p>
            </div>
            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.035] p-5 sm:p-6">
                <div className="flex flex-col gap-3 sm:flex-row">
                    <input value={nome} onChange={(event) => setNome(event.target.value)} placeholder="Nome da categoria" className="flex-1 rounded-xl border border-white/[0.1] bg-[#0b111d] px-4 py-2.5 text-sm text-white outline-none focus:border-blue-500" />
                    <button type="button" onClick={salvarCategoria} className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-500">
                        {editandoId ? <Check size={17} /> : <Plus size={17} />}
                        {editandoId ? "Salvar alteração" : "Adicionar categoria"}
                    </button>
                    {editandoId && <button type="button" onClick={() => { setEditandoId(null); setNome(""); }} aria-label="Cancelar edição" className="rounded-xl border border-white/10 px-3 text-slate-400 hover:text-white"><X size={18} /></button>}
                </div>
                <div className="mt-5">
                    <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Escolha um ícone</p>
                    <div className="grid grid-cols-5 gap-2 sm:grid-cols-10">
                        {ICONES_CATEGORIA.map(({ name, label, component: Icon }) => (
                            <button
                                key={name}
                                type="button"
                                title={label}
                                aria-label={`Usar ícone ${label}`}
                                onClick={() => setIcone(name)}
                                className={`flex h-11 items-center justify-center rounded-xl border transition-colors ${
                                    icone === name
                                        ? "border-blue-500 bg-blue-500/15 text-blue-300"
                                        : "border-white/[0.08] bg-white/[0.025] text-slate-500 hover:border-white/20 hover:text-white"
                                }`}
                            >
                                <Icon size={18} />
                            </button>
                        ))}
                    </div>
                </div>
                {mensagem && <p className="mt-3 text-sm text-rose-400">{mensagem}</p>}
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {categorias.map((categoria) => {
                    const quantidade = transacoes.filter((transacao) => transacao.category === categoria.name).length;
                    const IconeCategoria = ICONES_CATEGORIA.find((item) => item.name === categoria.icon)?.component ?? Tag;
                    return (
                        <div key={categoria.id} className="flex items-center justify-between rounded-2xl border border-white/[0.07] bg-white/[0.035] p-4">
                            <div className="flex items-center gap-3">
                                <span className="rounded-xl bg-blue-500/10 p-2.5 text-blue-400"><IconeCategoria size={18} /></span>
                                <div>
                                <p className="font-medium text-white">{categoria.name}</p>
                                <p className="mt-1 text-xs text-slate-500">{quantidade} transação(ões)</p>
                                </div>
                            </div>
                            <div className="flex gap-1">
                                <button type="button" onClick={() => { setEditandoId(categoria.id); setNome(categoria.name); setIcone(categoria.icon); setMensagem(""); }} aria-label={`Editar ${categoria.name}`} className="rounded-lg p-2 text-slate-500 hover:bg-white/[0.06] hover:text-blue-400"><Pencil size={16} /></button>
                                <button type="button" onClick={() => excluirCategoria(categoria.id)} aria-label={`Excluir ${categoria.name}`} className="rounded-lg p-2 text-slate-500 hover:bg-white/[0.06] hover:text-rose-400"><Trash2 size={16} /></button>
                            </div>
                        </div>
                    );
                })}
            </div>
            {categorias.length === 0 && <p className="rounded-2xl border border-dashed border-white/[0.08] py-10 text-center text-sm text-slate-500">Nenhuma categoria cadastrada.</p>}
        </div>
    )
}