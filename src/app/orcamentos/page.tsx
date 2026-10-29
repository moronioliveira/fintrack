"use client";

import { Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { useTransactions } from "@/contexts/transactions-context";
import type { Budget, NewBudget } from "@/types/financial-planning";

const emptyBudget: NewBudget = { category: "", limit: 0 };

export default function OrcamentosPage() {
  const { categorias, orcamentos, adicionarOrcamento, atualizarOrcamento, removerOrcamento } = useTransactions();
  const [form, setForm] = useState<NewBudget>(emptyBudget);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  function saveBudget() {
    if (!form.category || form.limit <= 0) {
      setError("Selecione uma categoria e informe um limite maior que zero.");
      return;
    }
    if (editingId) atualizarOrcamento(editingId, form);
    else adicionarOrcamento(form);
    setForm(emptyBudget);
    setEditingId(null);
    setError("");
  }

  function editBudget(budget: Budget) {
    setEditingId(budget.id);
    setForm({ category: budget.category, limit: budget.limit });
  }

  return (
    <div className="space-y-7">
      <header>
        <p className="mb-2 text-sm font-medium text-blue-400">Planejamento</p>
        <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Orçamentos</h1>
        <p className="mt-2 text-sm text-slate-500">Defina limites mensais e receba avisos antes de ultrapassar seus gastos.</p>
      </header>
      <section className="rounded-2xl border border-white/[0.07] bg-white/[0.035] p-5 sm:p-6">
        <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
          <select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} className="rounded-xl border border-white/[0.1] bg-[#0b111d] px-3.5 py-2.5 text-sm text-white outline-none focus:border-blue-500">
            <option value="">Selecione uma categoria</option>
            {categorias.filter((category) => !orcamentos.some((budget) => budget.category === category.name && budget.id !== editingId)).map((category) => <option key={category.id} value={category.name}>{category.name}</option>)}
          </select>
          <input type="number" min="0" step="0.01" value={form.limit || ""} onChange={(event) => setForm({ ...form, limit: Number(event.target.value) })} placeholder="Limite mensal (R$)" className="rounded-xl border border-white/[0.1] bg-[#0b111d] px-3.5 py-2.5 text-sm text-white outline-none focus:border-blue-500" />
          <button type="button" onClick={saveBudget} className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-500"><Plus size={17} />{editingId ? "Salvar" : "Adicionar limite"}</button>
        </div>
        {error && <p role="alert" className="mt-3 text-sm text-rose-400">{error}</p>}
      </section>
      {orcamentos.length === 0 ? <p className="rounded-2xl border border-dashed border-white/[0.08] py-10 text-center text-sm text-slate-500">Nenhum limite cadastrado.</p> : <div className="grid gap-4 md:grid-cols-2">{orcamentos.map((budget) => <article key={budget.id} className="flex items-center justify-between rounded-2xl border border-white/[0.07] bg-white/[0.035] p-5"><div><h2 className="font-semibold text-white">{budget.category}</h2><p className="mt-1 text-sm text-slate-500">{formatCurrency(budget.limit)} por mês</p></div><div className="flex gap-1"><button type="button" onClick={() => editBudget(budget)} aria-label={`Editar limite de ${budget.category}`} className="rounded-lg p-2 text-slate-500 hover:text-blue-400"><Pencil size={16} /></button><button type="button" onClick={() => removerOrcamento(budget.id)} aria-label={`Excluir limite de ${budget.category}`} className="rounded-lg p-2 text-slate-500 hover:text-rose-400"><Trash2 size={16} /></button></div></article>)}</div>}
    </div>
  );
}

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
