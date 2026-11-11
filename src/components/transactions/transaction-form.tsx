"use client";

import { useState } from "react";
import { ArrowDownRight, ArrowLeftRight, ArrowUpRight } from "lucide-react";
import { saveTransaction } from "@/actions/transactions";
import { ActionForm } from "@/components/ui/action-form";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input, MoneyInput, Select, Textarea } from "@/components/ui/field";
import { todayISO } from "@/lib/dates";
import type { FormOptions } from "@/lib/options";

export type TxType = "INCOME" | "EXPENSE" | "TRANSFER";

export type EditableTransaction = {
  id: string;
  type: TxType;
  status: "PAID" | "PENDING";
  description: string;
  amount: number;
  date: string;
  accountId: string;
  transferAccountId: string | null;
  categoryId: string | null;
  contactId: string | null;
  costCenterId: string | null;
  notes: string | null;
  installmentTotal: number | null;
};

const TYPES: { value: TxType; label: string; icon: typeof ArrowUpRight; active: string }[] = [
  { value: "EXPENSE", label: "Despesa", icon: ArrowDownRight, active: "bg-danger-soft text-danger" },
  { value: "INCOME", label: "Receita", icon: ArrowUpRight, active: "bg-success-soft text-success" },
  { value: "TRANSFER", label: "Transferência", icon: ArrowLeftRight, active: "bg-primary-soft text-primary" },
];

type Props = {
  options: FormOptions;
  currency: string;
  transaction?: EditableTransaction;
  defaultType?: TxType;
  onDone: () => void;
};

export function TransactionForm({ options, currency, transaction, defaultType = "EXPENSE", onDone }: Props) {
  const [type, setType] = useState<TxType>(transaction?.type ?? defaultType);
  const [when, setWhen] = useState(transaction?.date ?? todayISO());
  const [paid, setPaid] = useState(transaction ? transaction.status === "PAID" : true);
  const [paidTouched, setPaidTouched] = useState(!!transaction);
  const [more, setMore] = useState(!!(transaction?.notes || transaction?.costCenterId));
  const categories = options.categories.filter((c) => c.kind === (type === "INCOME" ? "INCOME" : "EXPENSE"));
  const contacts = options.contacts.filter((c) => c.type === "BOTH" || c.type === (type === "INCOME" ? "CUSTOMER" : "SUPPLIER"));
  const isFuture = when > todayISO();

  return (
    <ActionForm action={saveTransaction} onSuccess={onDone} onCancel={onDone} submitLabel={transaction ? "Salvar alterações" : "Adicionar"}>
      {transaction && <input type="hidden" name="id" value={transaction.id} />}
      <input type="hidden" name="type" value={type} />

      <div className="grid grid-cols-3 gap-1 rounded-xl bg-surface-2 p-1">
        {TYPES.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.value}
              type="button"
              onClick={() => setType(t.value)}
              className={`flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-medium transition sm:text-sm ${type === t.value ? `${t.active} shadow-sm` : "text-muted hover:text-fg"}`}
            >
              <Icon className="size-4" /> {t.label}
            </button>
          );
        })}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Valor">
          <MoneyInput name="amount" currency={currency} required autoFocus defaultValue={transaction ? transaction.amount.toFixed(2).replace(".", ",") : ""} />
        </Field>
        <Field label={paid ? "Data" : "Vencimento"}>
          <Input
            type="date"
            name="date"
            required
            value={when}
            onChange={(e) => {
              setWhen(e.target.value);
              if (!paidTouched) setPaid(e.target.value <= todayISO());
            }}
          />
        </Field>
      </div>

      <Field label="Descrição">
        <Input name="description" required maxLength={160} defaultValue={transaction?.description} placeholder={type === "TRANSFER" ? "Ex.: Reserva de emergência" : type === "INCOME" ? "Ex.: Salário de março" : "Ex.: Supermercado"} />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={type === "TRANSFER" ? "Conta de origem" : "Conta"}>
          <Select name="accountId" required defaultValue={transaction?.accountId ?? options.accounts[0]?.id}>
            {options.accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </Select>
        </Field>
        {type === "TRANSFER" ? (
          <Field label="Conta de destino">
            <Select name="transferAccountId" required defaultValue={transaction?.transferAccountId ?? options.accounts[1]?.id ?? ""}>
              <option value="" disabled>Selecione</option>
              {options.accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </Select>
          </Field>
        ) : (
          <Field label="Categoria">
            <Select key={type} name="categoryId" defaultValue={transaction?.type === type ? transaction.categoryId ?? "" : ""}>
              <option value="">Sem categoria</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
          </Field>
        )}
      </div>

      {type !== "TRANSFER" && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={type === "INCOME" ? "Cliente / pagador" : "Fornecedor / favorecido"}>
            <Select name="contactId" defaultValue={transaction?.contactId ?? ""}>
              <option value="">Nenhum</option>
              {contacts.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
          </Field>
          {!transaction && (
            <Field label="Parcelas" hint="O valor total é dividido entre as parcelas mensais.">
              <Select name="installments" defaultValue="1">
                {Array.from({ length: 24 }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={n}>{n === 1 ? "À vista" : `${n}x`}</option>
                ))}
              </Select>
            </Field>
          )}
        </div>
      )}

      <label className="flex items-center justify-between gap-3 rounded-xl border border-border px-3 py-2.5">
        <span className="text-sm">
          <span className="font-medium">{type === "INCOME" ? "Recebido" : type === "TRANSFER" ? "Efetivada" : "Pago"}</span>
          <span className="block text-xs text-muted">
            {paid ? "Afeta o saldo da conta agora." : isFuture ? "Fica agendado em “A pagar e receber”." : "Fica pendente (em aberto)."}
          </span>
        </span>
        <input
          type="checkbox"
          name="paid"
          checked={paid}
          onChange={(e) => {
            setPaid(e.target.checked);
            setPaidTouched(true);
          }}
          className="size-5 accent-[var(--primary)]"
        />
      </label>

      {!more ? (
        <button type="button" onClick={() => setMore(true)} className="self-start text-xs font-medium text-primary hover:underline">
          + Mais opções (observações{options.costCenters.length ? ", centro de custo" : ""})
        </button>
      ) : (
        <div className="grid gap-4">
          {type !== "TRANSFER" && options.costCenters.length > 0 && (
            <Field label="Centro de custo">
              <Select name="costCenterId" defaultValue={transaction?.costCenterId ?? ""}>
                <option value="">Nenhum</option>
                {options.costCenters.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </Select>
            </Field>
          )}
          <Field label="Observações">
            <Textarea name="notes" defaultValue={transaction?.notes ?? ""} maxLength={1000} placeholder="Nº da nota fiscal, detalhes do pagamento..." />
          </Field>
        </div>
      )}
    </ActionForm>
  );
}

export function TransactionDialog({
  open, onClose, ...props
}: Omit<Props, "onDone"> & { open: boolean; onClose: () => void }) {
  return (
    <Dialog open={open} onClose={onClose} title={props.transaction ? "Editar lançamento" : "Novo lançamento"}>
      <TransactionForm {...props} onDone={onClose} />
    </Dialog>
  );
}
