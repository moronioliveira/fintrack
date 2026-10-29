"use client";

import { CalendarClock, Check, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { useTransactions } from "@/contexts/transactions-context";
import type { NewRecurringBill, RecurringBill } from "@/types/financial-planning";

const emptyBill: NewRecurringBill = { name: "", category: "", value: 0, dueDay: 1, status: "Pendente" };

export default function Contas() {
  const { contasRecorrentes, categorias, adicionarContaRecorrente, atualizarContaRecorrente, removerContaRecorrente, alternarStatusConta } = useTransactions();
  const [form, setForm] = useState<NewRecurringBill>(emptyBill);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  function saveBill() {
    if (!form.name.trim() || form.value <= 0 || form.dueDay < 1 || form.dueDay > 31) {
      setError("Preencha o nome, um valor maior que zero e um dia entre 1 e 31.");
      return;
    }
    const bill = { ...form, name: form.name.trim() };
    if (editingId) atualizarContaRecorrente(editingId, bill);
    else adicionarContaRecorrente(bill);
    setForm(emptyBill);
    setEditingId(null);
    setError("");
  }

  function editBill(bill: RecurringBill) {
    setEditingId(bill.id);
    setForm({ name: bill.name, category: bill.category, value: bill.value, dueDay: bill.dueDay, status: bill.status });
  }

  const totalPendente = contasRecorrentes.filter((bill) => bill.status === "Pendente").reduce((total, bill) => total + bill.value, 0);

  return (
    <div className="space-y-7">
      <header><p className="mb-2 text-sm font-medium text-blue-400">Organização</p><h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Contas recorrentes</h1><p className="mt-2 text-sm text-slate-500">Acompanhe compromissos mensais e evite esquecer vencimentos.</p></header>
      <section className="rounded-2xl border border-white/[0.07] bg-white/[0.035] p-5 sm:p-6">
        <div className="mb-4 flex items-center justify-between"><div className="flex items-center gap-2 text-lg font-bold text-white"><CalendarClock className="text-blue-400" size={20} />{editingId ? "Editar conta" : "Nova conta"}</div><span className="text-xs text-slate-500">Pendente: {formatCurrency(totalPendente)}</span></div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex.: Internet" className="rounded-xl border border-white/[0.1] bg-[#0b111d] px-3.5 py-2.5 text-sm text-white outline-none focus:border-blue-500" />
          <input type="number" min="0" step="0.01" value={form.value || ""} onChange={(e) => setForm({ ...form, value: Number(e.target.value) })} placeholder="Valor mensal" className="rounded-xl border border-white/[0.1] bg-[#0b111d] px-3.5 py-2.5 text-sm text-white outline-none focus:border-blue-500" />
          <input type="number" min="1" max="31" value={form.dueDay} onChange={(e) => setForm({ ...form, dueDay: Number(e.target.value) })} placeholder="Dia do vencimento" className="rounded-xl border border-white/[0.1] bg-[#0b111d] px-3.5 py-2.5 text-sm text-white outline-none focus:border-blue-500" />
          <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="rounded-xl border border-white/[0.1] bg-[#0b111d] px-3.5 py-2.5 text-sm text-white outline-none focus:border-blue-500"><option value="">Categoria (opcional)</option>{categorias.map((category) => <option key={category.id} value={category.name}>{category.name}</option>)}</select>
        </div>
        {error && <p role="alert" className="mt-3 text-sm text-rose-400">{error}</p>}
        <div className="mt-4 flex gap-2"><button type="button" onClick={saveBill} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-500"><Plus size={17} />{editingId ? "Salvar alteração" : "Adicionar conta"}</button>{editingId && <button type="button" onClick={() => { setEditingId(null); setForm(emptyBill); }} className="rounded-xl border border-white/10 px-4 py-2.5 text-sm text-slate-400 hover:text-white">Cancelar</button>}</div>
      </section>
      {contasRecorrentes.length === 0 ? <p className="rounded-2xl border border-dashed border-white/[0.08] py-10 text-center text-sm text-slate-500">Nenhuma conta recorrente cadastrada.</p> : <div className="grid gap-4 md:grid-cols-2">{contasRecorrentes.map((bill) => <article key={bill.id} className="rounded-2xl border border-white/[0.07] bg-white/[0.035] p-5"><div className="flex items-start justify-between gap-3"><div><h2 className="font-semibold text-white">{bill.name}</h2><p className="mt-1 text-xs text-slate-500">{bill.category || "Sem categoria"} · vence dia {bill.dueDay}</p></div><div className="flex gap-1"><button type="button" onClick={() => editBill(bill)} aria-label={`Editar ${bill.name}`} className="rounded-lg p-2 text-slate-500 hover:text-blue-400"><Pencil size={16} /></button><button type="button" onClick={() => removerContaRecorrente(bill.id)} aria-label={`Excluir ${bill.name}`} className="rounded-lg p-2 text-slate-500 hover:text-rose-400"><Trash2 size={16} /></button></div></div><div className="mt-5 flex items-center justify-between"><strong className="text-lg text-white">{formatCurrency(bill.value)}</strong><button type="button" onClick={() => alternarStatusConta(bill.id)} className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${bill.status === "Pago" ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-300"}`}>{bill.status === "Pago" && <Check size={14} />}{bill.status}</button></div></article>)}</div>}
    </div>
  );
}
function formatCurrency(value: number) { return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }); }
