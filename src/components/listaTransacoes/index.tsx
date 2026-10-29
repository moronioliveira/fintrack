"use client";

import { Check } from "lucide-react";
import { useState } from "react";
import type { Transaction } from "@/types/transaction";
import { TransactionCards } from "./transaction-card";
import { DeleteTransactionModal, TransactionDetailsModal } from "./transaction-modals";
import { TransactionTable } from "./transaction-table";

type ListaTransacoesProps = {
  transacoes: Transaction[];
  onDelete: (id: string) => void;
  onEdit: (transaction: Transaction) => void;
  onAdd: () => void;
};

export function ListaTransacoes({
  transacoes,
  onDelete,
  onEdit,
  onAdd,
}: ListaTransacoesProps) {
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
          {transacoes.length} registros
        </span>
      </div>

      {transacoes.length === 0 ? (
        <div className="py-10 text-center">
          <p className="font-medium text-slate-300">Nenhuma transação cadastrada</p>
          <p className="mt-1 text-xs text-slate-500">Adicione sua primeira receita ou despesa para começar.</p>
          <button type="button" onClick={onAdd} className="mt-4 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-500">Adicionar transação</button>
        </div>
      ) : (
        <>
          <TransactionTable
            transacoes={transacoes}
            onView={setTransacaoParaVisualizar}
            onEdit={onEdit}
            onDelete={setTransacaoParaExcluir}
          />
          <TransactionCards
            transacoes={transacoes}
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
