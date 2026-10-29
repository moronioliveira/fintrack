import { AlertTriangle, X } from "lucide-react";
import type { ReactNode } from "react";
import type { Transaction } from "@/types/transaction";

export function DeleteTransactionModal({
  transaction,
  onCancel,
  onConfirm,
}: {
  transaction: Transaction;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <Modal>
      <div className="flex items-start gap-4">
        <span className="rounded-xl bg-rose-500/10 p-3 text-rose-400"><AlertTriangle size={21} /></span>
        <div className="flex-1">
          <h2 id="confirmar-exclusao-title" className="text-lg font-bold text-white">Excluir transação?</h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            A transação <strong className="text-slate-200">{transaction.description}</strong> será removida permanentemente desta sessão.
          </p>
        </div>
        <button type="button" onClick={onCancel} aria-label="Fechar confirmação" className="rounded-lg p-1.5 text-slate-500 hover:bg-white/[0.06] hover:text-white"><X size={18} /></button>
      </div>
      <div className="mt-6 flex justify-end gap-3">
        <button type="button" onClick={onCancel} className="rounded-xl border border-white/[0.1] px-4 py-2.5 text-sm font-medium text-slate-300 hover:bg-white/[0.05]">Cancelar</button>
        <button type="button" onClick={onConfirm} className="rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-rose-500">Excluir transação</button>
      </div>
    </Modal>
  );
}

export function TransactionDetailsModal({
  transaction,
  onClose,
}: {
  transaction: Transaction;
  onClose: () => void;
}) {
  return (
    <Modal>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-400">Detalhes</p>
          <h2 id="detalhes-transacao-title" className="mt-1 text-lg font-bold text-white">{transaction.description}</h2>
        </div>
        <button type="button" onClick={onClose} aria-label="Fechar detalhes" className="rounded-lg p-1.5 text-slate-500 hover:bg-white/[0.06] hover:text-white"><X size={18} /></button>
      </div>
      <div className="mt-6 grid grid-cols-2 gap-3">
        <Detail label="Valor" value={transaction.value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} valueClass={transaction.type === "Receita" ? "text-emerald-400" : "text-rose-400"} />
        <Detail label="Tipo" value={transaction.type} />
        <Detail label="Categoria" value={transaction.category} />
        <Detail label="Data" value={transaction.date} />
      </div>
      <div className="mt-6 flex justify-end"><button type="button" onClick={onClose} className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-500">Fechar</button></div>
    </Modal>
  );
}

function Modal({ children }: { children: ReactNode }) {
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-sm"><div role="dialog" aria-modal="true" className="w-full max-w-md rounded-2xl border border-white/[0.1] bg-[#111827] p-6 shadow-2xl shadow-black/40">{children}</div></div>;
}

function Detail({ label, value, valueClass = "text-white" }: { label: string; value: string; valueClass?: string }) {
  return <div className="rounded-xl bg-white/[0.04] p-3"><p className="text-xs text-slate-500">{label}</p><p className={`mt-1 font-semibold ${valueClass}`}>{value}</p></div>;
}
