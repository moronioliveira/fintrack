import { ArrowDownCircle, ArrowUpCircle, Edit2, Eye, Trash2 } from "lucide-react";
import type { Transaction } from "@/types/transaction";

type Props = {
  transacoes: Transaction[];
  onView: (transaction: Transaction) => void;
  onEdit: (transaction: Transaction) => void;
  onDelete: (transaction: Transaction) => void;
};

export function TransactionTable({
  transacoes,
  onView,
  onEdit,
  onDelete,
}: Props) {
  return (
    <div className="hidden overflow-x-auto md:block">
      <table className="w-full border-collapse text-left">
        <thead>
          <tr className="border-b border-white/[0.07] text-xs font-semibold uppercase tracking-wide text-slate-500">
            <th className="pb-3 pl-2">Data</th>
            <th className="pb-3">Descrição</th>
            <th className="pb-3">Categoria</th>
            <th className="pb-3">Tipo</th>
            <th className="pb-3">Valor</th>
            <th className="pb-3 pr-2 text-right">Ações</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-800/50 text-sm text-gray-300">
          {transacoes.map((transaction) => (
            <tr
              key={transaction.id}
              className="transition-colors hover:bg-white/[0.025]"
            >
              <td className="whitespace-nowrap py-4 pl-2 text-slate-500">
                {transaction.date}
              </td>
              <td className="py-4 font-medium text-white">
                {transaction.description}
              </td>
              <td className="py-4">
                <span className="rounded-full border border-white/[0.08] bg-white/[0.05] px-2.5 py-1 text-xs text-slate-300">
                  {transaction.category}
                </span>
              </td>
              <td className="py-4">
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
              </td>
              <td
                className={`py-4 font-semibold ${
                  transaction.type === "Receita"
                    ? "text-emerald-400"
                    : "text-rose-400"
                }`}
              >
                {transaction.value.toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                })}
              </td>
              <td className="py-4 pr-2 text-right">
                <Actions transaction={transaction} onView={onView} onEdit={onEdit} onDelete={onDelete} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
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
      <button type="button" onClick={() => onView(transaction)} aria-label={`Visualizar ${transaction.description}`} className="rounded-md p-1.5 text-slate-500 transition-colors hover:bg-white/[0.06] hover:text-white">
        <Eye size={16} />
      </button>
      <button type="button" onClick={() => onEdit(transaction)} aria-label={`Editar ${transaction.description}`} className="rounded-md p-1.5 text-slate-500 transition-colors hover:bg-white/[0.06] hover:text-blue-400">
        <Edit2 size={16} />
      </button>
      <button type="button" onClick={() => onDelete(transaction)} aria-label={`Excluir ${transaction.description}`} className="rounded-md p-1.5 text-slate-500 transition-colors hover:bg-white/[0.06] hover:text-rose-400">
        <Trash2 size={16} />
      </button>
    </div>
  );
}
