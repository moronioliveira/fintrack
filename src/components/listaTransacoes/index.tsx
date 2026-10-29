"use client";

import { Check } from "lucide-react";
import { useState } from "react";
import type { Transaction } from "@/types/transaction";
import { TransactionCards } from "./transaction-card";
import { DeleteTransactionModal, TransactionDetailsModal } from "./transaction-modals";
import { TransactionTable } from "./transaction-table";
import { TransactionFilters, type TransactionFiltersState } from "./transaction-filters";
import type { Category } from "@/types/category";

type ListaTransacoesProps = {
  transacoes: Transaction[];
  onDelete: (id: string) => void;
  onEdit: (transaction: Transaction) => void;
  onAdd: () => void;
  categories: Category[];
};

export function ListaTransacoes({
  transacoes,
  onDelete,
  onEdit,
  onAdd,
  categories,
}: ListaTransacoesProps) {
  const [filters, setFilters] = useState<TransactionFiltersState>({
    search: "",
    type: "Todos",
    category: "Todas",
    startDate: "",
    endDate: "",
  });
  const [transacaoParaExcluir, setTransacaoParaExcluir] =
    useState<Transaction | null>(null);
  const [transacaoParaVisualizar, setTransacaoParaVisualizar] =
    useState<Transaction | null>(null);
  const [mensagem, setMensagem] = useState("");

  function confirmarExclusao() {
    if (!transacaoParaExcluir) return;
    onDelete(transacaoParaExcluir.id);
    setMensagem("Transação excluída com sucesso.");
    setTransacaoParaExcluir(null);
    window.setTimeout(() => setMensagem(""), 3000);
  }

  const transacoesFiltradas = transacoes.filter((transaction) => {
    const search = filters.search.trim().toLocaleLowerCase("pt-BR");
    const matchesSearch = !search || transaction.description.toLocaleLowerCase("pt-BR").includes(search);
    const matchesType = filters.type === "Todos" || transaction.type === filters.type;
    const matchesCategory = filters.category === "Todas" || transaction.category === filters.category;
    const matchesStartDate = !filters.startDate || transaction.date >= filters.startDate;
    const matchesEndDate = !filters.endDate || transaction.date <= filters.endDate;
    return matchesSearch && matchesType && matchesCategory && matchesStartDate && matchesEndDate;
  });

  return (
    <div className="relative w-full rounded-2xl border border-white/[0.07] bg-white/[0.035] p-5 shadow-2xl shadow-black/10 sm:p-6">
      {mensagem && (
        <div role="status" aria-live="polite" className="absolute right-5 top-5 z-10 flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300 shadow-lg shadow-black/20">
          <Check size={16} />
          {mensagem}
        </div>
      )}
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-white">Lista de transações</h3>
          <p className="mt-1 text-xs text-slate-500">Acompanhe suas últimas movimentações</p>
        </div>
        <span className="hidden rounded-lg border border-white/[0.08] px-3 py-1.5 text-xs text-slate-500 sm:block">
          {transacoesFiltradas.length} de {transacoes.length} registros
        </span>
      </div>

      <TransactionFilters filters={filters} categories={categories} onChange={setFilters} />

      {transacoes.length === 0 ? (
        <div className="py-10 text-center">
          <p className="font-medium text-slate-300">Nenhuma transação cadastrada</p>
          <p className="mt-1 text-xs text-slate-500">Adicione sua primeira receita ou despesa para começar.</p>
          <button type="button" onClick={onAdd} className="mt-4 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-500">Adicionar transação</button>
        </div>
      ) : transacoesFiltradas.length === 0 ? (
        <div className="py-10 text-center">
          <p className="font-medium text-slate-300">Nenhuma transação encontrada</p>
          <p className="mt-1 text-xs text-slate-500">Tente ajustar os filtros para visualizar outros registros.</p>
        </div>
      ) : (
        <>
          <TransactionTable
            transacoes={transacoesFiltradas}
            onView={setTransacaoParaVisualizar}
            onEdit={onEdit}
            onDelete={setTransacaoParaExcluir}
          />
          <TransactionCards
            transacoes={transacoesFiltradas}
            onView={setTransacaoParaVisualizar}
            onEdit={onEdit}
            onDelete={setTransacaoParaExcluir}
          />
        </>
      )}

      {transacaoParaExcluir && (
        <DeleteTransactionModal
          transaction={transacaoParaExcluir}
          onCancel={() => setTransacaoParaExcluir(null)}
          onConfirm={confirmarExclusao}
        />
      )}
      {transacaoParaVisualizar && (
        <TransactionDetailsModal
          transaction={transacaoParaVisualizar}
          onClose={() => setTransacaoParaVisualizar(null)}
        />
      )}
    </div>
  );
}
