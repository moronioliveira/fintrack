"use client";

import { Pencil, Plus, Target, Trash2 } from "lucide-react";
import { useState } from "react";
import { useTransactions } from "@/contexts/transactions-context";
import type { FinancialGoal, NewFinancialGoal } from "@/types/financial-planning";

const emptyGoal: NewFinancialGoal = { name: "", targetValue: 0, currentValue: 0, deadline: "" };

export default function Planejamento() {
  const { metasFinanceiras, adicionarMetaFinanceira, atualizarMetaFinanceira, removerMetaFinanceira } = useTransactions();
  const [form, setForm] = useState<NewFinancialGoal>(emptyGoal);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  function saveGoal() {
    if (!form.name.trim() || form.targetValue <= 0 || form.currentValue < 0 || !form.deadline) {
      setError("Preencha o nome, um valor-alvo maior que zero e o prazo.");
      return;
    }
    if (editingId) atualizarMetaFinanceira(editingId, { ...form, name: form.name.trim() });
    else adicionarMetaFinanceira({ ...form, name: form.name.trim() });
    setForm(emptyGoal);
    setEditingId(null);
    setError("");
  }

  function editGoal(goal: FinancialGoal) {
    setEditingId(goal.id);
    setForm({ name: goal.name, targetValue: goal.targetValue, currentValue: goal.currentValue, deadline: goal.deadline });
    setError("");
  }

  return (
    <div className="space-y-7">
      <header>
        <p className="mb-2 text-sm font-medium text-blue-400">Planejamento</p>
        <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Metas financeiras</h1>
        <p className="mt-2 text-sm text-slate-500">Transforme seus objetivos em progresso acompanhável.</p>
      </header>
      <section className="rounded-2xl border border-white/[0.07] bg-white/[0.035] p-5 sm:p-6">
        <div className="mb-4 flex items-center gap-2 text-lg font-bold text-white"><Target className="text-blue-400" size={20} />{editingId ? "Editar meta" : "Nova meta"}</div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex.: Reserva de emergência" className="rounded-xl border border-white/[0.1] bg-[#0b111d] px-3.5 py-2.5 text-sm text-white outline-none focus:border-blue-500" />
          <input type="number" min="0" step="0.01" value={form.targetValue || ""} onChange={(e) => setForm({ ...form, targetValue: Number(e.target.value) })} placeholder="Valor-alvo" className="rounded-xl border border-white/[0.1] bg-[#0b111d] px-3.5 py-2.5 text-sm text-white outline-none focus:border-blue-500" />
          <input type="number" min="0" step="0.01" value={form.currentValue || ""} onChange={(e) => setForm({ ...form, currentValue: Number(e.target.value) })} placeholder="Valor acumulado" className="rounded-xl border border-white/[0.1] bg-[#0b111d] px-3.5 py-2.5 text-sm text-white outline-none focus:border-blue-500" />
          <input type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} className="rounded-xl border border-white/[0.1] bg-[#0b111d] px-3.5 py-2.5 text-sm text-white outline-none focus:border-blue-500" />
        </div>
        {error && <p role="alert" className="mt-3 text-sm text-rose-400">{error}</p>}
        <div className="mt-4 flex gap-2">
          <button type="button" onClick={saveGoal} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-500"><Plus size={17} />{editingId ? "Salvar alteração" : "Adicionar meta"}</button>
          {editingId && <button type="button" onClick={() => { setEditingId(null); setForm(emptyGoal); }} className="rounded-xl border border-white/10 px-4 py-2.5 text-sm text-slate-400 hover:text-white">Cancelar</button>}
        </div>
      </section>
      {metasFinanceiras.length === 0 ? (
        <EmptyState text="Nenhuma meta cadastrada. Comece definindo um objetivo financeiro." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {metasFinanceiras.map((goal) => {
            const progress = Math.min((goal.currentValue / goal.targetValue) * 100, 100);
            return <article key={goal.id} className="rounded-2xl border border-white/[0.07] bg-white/[0.035] p-5">
              <div className="flex items-start justify-between gap-3"><div><h2 className="font-semibold text-white">{goal.name}</h2><p className="mt-1 text-xs text-slate-500">Prazo: {formatDate(goal.deadline)}</p></div><div className="flex gap-1"><button type="button" onClick={() => editGoal(goal)} aria-label={`Editar ${goal.name}`} className="rounded-lg p-2 text-slate-500 hover:text-blue-400"><Pencil size={16} /></button><button type="button" onClick={() => removerMetaFinanceira(goal.id)} aria-label={`Excluir ${goal.name}`} className="rounded-lg p-2 text-slate-500 hover:text-rose-400"><Trash2 size={16} /></button></div></div>
              <div className="mt-5 flex justify-between text-sm"><span className="text-slate-400">{formatCurrency(goal.currentValue)}</span><strong className="text-white">{formatCurrency(goal.targetValue)}</strong></div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/[0.07]"><div className="h-full rounded-full bg-blue-500 transition-all" style={{ width: `${progress}%` }} /></div>
              <p className="mt-2 text-xs text-slate-500">{progress.toFixed(0)}% concluído</p>
            </article>;
          })}
        </div>
      )}
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return <p className="rounded-2xl border border-dashed border-white/[0.08] py-10 text-center text-sm text-slate-500">{text}</p>;
}
function formatCurrency(value: number) { return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }); }
function formatDate(value: string) { return new Date(`${value}T12:00:00`).toLocaleDateString("pt-BR"); }
