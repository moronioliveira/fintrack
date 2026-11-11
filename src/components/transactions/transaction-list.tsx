"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Copy, Ellipsis, FileText, Inbox, Layers, Pencil, Repeat, Trash } from "lucide-react";
import { bulkTransactions, deleteTransaction, duplicateTransaction } from "@/actions/transactions";
import { ActionButton, useActionFeedback } from "@/components/ui/action-form";
import { Amount, Badge, EmptyState } from "@/components/ui/primitives";
import { IconBadge } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { useClickOutside } from "@/components/shell/workspace-switcher";
import { initialActionState } from "@/lib/action-state";
import { formatDate, todayISO } from "@/lib/dates";
import { formatMoney } from "@/lib/format";
import type { FormOptions } from "@/lib/options";
import { PayButton } from "./pay-button";
import { TransactionDialog, type EditableTransaction } from "./transaction-form";

export type ListItem = EditableTransaction & {
  paidAt: string | null;
  installmentGroup: string | null;
  installmentNumber: number | null;
  recurringRuleId: string | null;
  category: { name: string; color: string; icon: string } | null;
  account: { name: string };
  transferAccount: { name: string } | null;
  contact: { name: string } | null;
};

function StatusBadge({ item }: { item: ListItem }) {
  if (item.status === "PAID") return <Badge tone="success">{item.type === "INCOME" ? "Recebido" : item.type === "TRANSFER" ? "Efetivada" : "Pago"}</Badge>;
  if (item.date < todayISO()) return <Badge tone="danger">Atrasado</Badge>;
  return <Badge tone="warning">Pendente</Badge>;
}

function RowMenu({ item, onEdit }: { item: ListItem; onEdit: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useClickOutside<HTMLDivElement>(open, () => setOpen(false));
  const itemClass = "flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm hover:bg-surface-2";
  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen((v) => !v)} aria-label="Ações" className="flex size-8 items-center justify-center rounded-lg text-muted hover:bg-surface-2 hover:text-fg">
        <Ellipsis className="size-4" />
      </button>
      {open && (
        <div className="absolute right-0 top-full z-30 mt-1 w-56 rounded-xl border border-border bg-surface p-1 shadow-xl">
          <button type="button" className={itemClass} onClick={() => { setOpen(false); onEdit(); }}>
            <Pencil className="size-4 text-muted" /> Editar
          </button>
          <ActionButton action={duplicateTransaction} fields={{ id: item.id }} className={itemClass}>
            <Copy className="size-4 text-muted" /> Duplicar para hoje
          </ActionButton>
          {item.type !== "TRANSFER" && (
            <Link href={`/recibo/${item.id}`} className={itemClass} onClick={() => setOpen(false)}>
              <FileText className="size-4 text-muted" /> Gerar recibo
            </Link>
          )}
          <div className="my-1 border-t border-border" />
          <ActionButton action={deleteTransaction} fields={{ id: item.id, scope: "one" }} confirm="Excluir este lançamento?" className={`${itemClass} text-danger hover:bg-danger-soft`}>
            <Trash className="size-4" /> Excluir
          </ActionButton>
          {item.installmentGroup && (
            <ActionButton action={deleteTransaction} fields={{ id: item.id, scope: "group" }} confirm={`Excluir todas as ${item.installmentTotal} parcelas deste parcelamento?`} className={`${itemClass} text-danger hover:bg-danger-soft`}>
              <Layers className="size-4" /> Excluir todas as parcelas
            </ActionButton>
          )}
        </div>
      )}
    </div>
  );
}

function BulkBar({ ids, onDone, categories }: { ids: string[]; onDone: () => void; categories: FormOptions["categories"] }) {
  const [state, action, pending] = useActionState(bulkTransactions, initialActionState);
  useActionFeedback(state, onDone);
  return (
    <form action={action} className="sticky top-20 z-10 mb-3 flex flex-wrap items-center gap-2 rounded-xl border border-primary/30 bg-primary-soft px-4 py-2.5 text-sm">
      {ids.map((id) => <input key={id} type="hidden" name="ids" value={id} />)}
      <span className="font-medium text-primary">{ids.length} selecionado(s)</span>
      <div className="ml-auto flex flex-wrap gap-2">
        <select name="categoryId" defaultValue="" aria-label="Nova categoria" className="h-8 rounded-lg border border-border bg-surface px-2 text-xs">
          <option value="">Categoria...</option>
          <optgroup label="Despesas">{categories.filter((c) => c.kind === "EXPENSE").map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</optgroup>
          <optgroup label="Receitas">{categories.filter((c) => c.kind === "INCOME").map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</optgroup>
        </select>
        <Button type="submit" name="op" value="categorize" size="sm" variant="outline" disabled={pending}>Aplicar categoria</Button>
        <Button type="submit" name="op" value="pay" size="sm" variant="outline" disabled={pending}>Marcar como pago</Button>
        <Button
          type="submit"
          name="op"
          value="delete"
          size="sm"
          variant="danger"
          disabled={pending}
          onClick={(e) => { if (!window.confirm(`Excluir ${ids.length} lançamento(s)?`)) e.preventDefault(); }}
        >
          Excluir
        </Button>
        <Button size="sm" variant="ghost" onClick={onDone}>Cancelar</Button>
      </div>
    </form>
  );
}

export function TransactionList({ items, options, currency, canEdit, total }: { items: ListItem[]; options: FormOptions; currency: string; canEdit: boolean; total: number }) {
  const [editing, setEditing] = useState<ListItem | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const visibleSelected = items.filter((i) => selected.has(i.id)).map((i) => i.id);
  const allSelected = items.length > 0 && visibleSelected.length === items.length;

  function toggle(id: string) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  if (!items.length) {
    return (
      <div className="rounded-2xl border border-border bg-surface">
        <EmptyState icon={Inbox} title={total ? "Nada nesta página" : "Nenhum lançamento encontrado"} description="Ajuste os filtros, mude o mês ou adicione um novo lançamento." />
      </div>
    );
  }

  const describe = (t: ListItem) =>
    t.type === "TRANSFER" ? `${t.account.name} → ${t.transferAccount?.name ?? "?"}` : [t.category?.name ?? "Sem categoria", t.contact?.name].filter(Boolean).join(" · ");

  return (
    <>
      {canEdit && visibleSelected.length > 0 && <BulkBar ids={visibleSelected} categories={options.categories} onDone={() => setSelected(new Set())} />}

      {/* Desktop */}
      <div className="hidden overflow-hidden rounded-2xl border border-border bg-surface md:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted">
              {canEdit && (
                <th className="w-10 py-3 pl-4">
                  <input type="checkbox" aria-label="Selecionar todos" checked={allSelected} onChange={() => setSelected(allSelected ? new Set() : new Set(items.map((i) => i.id)))} className="accent-[var(--primary)]" />
                </th>
              )}
              <th className="px-4 py-3 font-medium">Data</th>
              <th className="px-4 py-3 font-medium">Descrição</th>
              <th className="px-4 py-3 font-medium">Conta</th>
              <th className="px-4 py-3 font-medium">Situação</th>
              <th className="px-4 py-3 text-right font-medium">Valor</th>
              {canEdit && <th className="w-28 px-4 py-3" />}
            </tr>
          </thead>
          <tbody>
            {items.map((t) => (
              <tr key={t.id} className={`border-b border-border last:border-0 hover:bg-surface-2/60 ${selected.has(t.id) ? "bg-primary-soft/50" : ""}`}>
                {canEdit && (
                  <td className="py-3 pl-4">
                    <input type="checkbox" aria-label={`Selecionar ${t.description}`} checked={selected.has(t.id)} onChange={() => toggle(t.id)} className="accent-[var(--primary)]" />
                  </td>
                )}
                <td className="tabular whitespace-nowrap px-4 py-3 text-muted">{formatDate(t.date)}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <IconBadge name={t.type === "TRANSFER" ? "Banknote" : t.category?.icon ?? "Tag"} color={t.type === "TRANSFER" ? "#6366f1" : t.category?.color ?? "#64748b"} size="sm" />
                    <div className="min-w-0">
                      <p className="flex items-center gap-1.5 truncate font-medium">
                        {t.description}
                        {t.recurringRuleId && <Repeat className="size-3 shrink-0 text-muted" aria-label="Recorrente" />}
                      </p>
                      <p className="truncate text-xs text-muted">{describe(t)}</p>
                    </div>
                  </div>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-muted">{t.account.name}</td>
                <td className="px-4 py-3"><StatusBadge item={t} /></td>
                <td className="px-4 py-3 text-right"><Amount value={t.amount} currency={currency} type={t.type} /></td>
                {canEdit && (
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <PayButton id={t.id} status={t.status} type={t.type} compact />
                      <RowMenu item={t} onEdit={() => setEditing(t)} />
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile */}
      <ul className="flex flex-col gap-2 md:hidden">
        {items.map((t) => (
          <li key={t.id} className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-3">
            <IconBadge name={t.type === "TRANSFER" ? "Banknote" : t.category?.icon ?? "Tag"} color={t.type === "TRANSFER" ? "#6366f1" : t.category?.color ?? "#64748b"} />
            <button type="button" className="min-w-0 flex-1 text-left" onClick={() => canEdit && setEditing(t)} disabled={!canEdit}>
              <p className="truncate text-sm font-medium">{t.description}</p>
              <p className="truncate text-xs text-muted">{formatDate(t.date)} · {describe(t)}</p>
              <div className="mt-1"><StatusBadge item={t} /></div>
            </button>
            <div className="flex flex-col items-end gap-1.5">
              <Amount value={t.amount} currency={currency} type={t.type} className="text-sm" />
              {canEdit && (
                <div className="flex items-center gap-1">
                  <PayButton id={t.id} status={t.status} type={t.type} compact />
                  <RowMenu item={t} onEdit={() => setEditing(t)} />
                </div>
              )}
            </div>
          </li>
        ))}
      </ul>

      <p className="mt-3 text-xs text-muted">
        Exibindo {items.length} de {total} · soma desta página: {formatMoney(items.reduce((acc, t) => acc + (t.type === "INCOME" ? t.amount : t.type === "EXPENSE" ? -t.amount : 0), 0), currency, { signed: true })}
      </p>

      {editing && (
        <TransactionDialog open onClose={() => setEditing(null)} options={options} currency={currency} transaction={editing} />
      )}
    </>
  );
}
