import { ArrowDownCircle, ArrowUpCircle, Edit2, Eye, Trash2 } from "lucide-react";
import type { Transaction } from "@/types/transaction";

type Props = {
  transacoes: Transaction[];
  onView: (transaction: Transaction) => void;
  onEdit: (transaction: Transaction) => void;
  onDelete: (transaction: Transaction) => void;
};

export function TransactionCards({
  transacoes,
  onView,
  onEdit,
  onDelete,
}: Props) {
  return (
    <div className="space-y-3 md:hidden">
      {transacoes.map((transaction) => (
        <article
          key={transaction.id}
          className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-4"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-medium text-white">{transaction.description}</p>
              <p className="mt-1 text-xs text-slate-500">
                {transaction.category} · {transaction.date}
              </p>
            </div>
            <p
              className={`whitespace-nowrap font-semibold ${
                transaction.type === "Receita"
                  ? "text-emerald-400"
                  : "text-rose-400"
              }`}
            >
              {transaction.value.toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              })}
            </p>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <span
              className={`flex items-center gap-1.5 text-xs font-semibold ${
                transaction.type === "Receita"
                  ? "text-emerald-400"
                  : "text-rose-400"
              }`}
            >
              {transaction.type === "Receita" ? (
                <ArrowUpCircle size={14} />
              ) : (
                <ArrowDownCircle size={14} />
              )}
              {transaction.type}
            </span>
            <Actions
              transaction={transaction}
              onView={onView}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          </div>
        </article>
      ))}
    </div>
  );
}

function Actions({
  transaction,
  onView,
  onEdit,
  onDelete,
}: {
  transaction: Transaction;
  onView: (transaction: Transaction) => void;
  onEdit: (transaction: Transaction) => void;
  onDelete: (transaction: Transaction) => void;
}) {
  return (
    <div className="flex items-center justify-end gap-2">
      <button type="button" onClick={() => onView(transaction)} aria-label={`Visualizar ${transaction.description}`} className="rounded-lg p-2 text-slate-500 hover:bg-white/[0.06] hover:text-white"><Eye size={16} /></button>
      <button type="button" onClick={() => onEdit(transaction)} aria-label={`Editar ${transaction.description}`} className="rounded-lg p-2 text-slate-500 hover:bg-white/[0.06] hover:text-blue-400"><Edit2 size={16} /></button>
      <button type="button" onClick={() => onDelete(transaction)} aria-label={`Excluir ${transaction.description}`} className="rounded-lg p-2 text-slate-500 hover:bg-white/[0.06] hover:text-rose-400"><Trash2 size={16} /></button>
    </div>
  );
}
