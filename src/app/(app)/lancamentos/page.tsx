import type { Metadata } from "next";
import Link from "next/link";
import { ArrowDownRight, ArrowUpRight, ChevronLeft, ChevronRight, Scale } from "lucide-react";
import { getContext } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getFormOptions } from "@/lib/options";
import { num, serializeTransaction } from "@/lib/finance";
import { buildTxWhere, parseTxFilters } from "@/lib/transaction-filters";
import { formatMoney } from "@/lib/format";
import { Card, PageHeader } from "@/components/ui/primitives";
import { MonthPicker } from "@/components/ui/month-picker";
import { TransactionFiltersBar } from "@/components/transactions/filters";
import { TransactionList } from "@/components/transactions/transaction-list";
import { ImportDialogButton } from "@/components/transactions/import-dialog";

export const metadata: Metadata = { title: "Lançamentos" };

const PAGE_SIZE = 50;

export default async function TransactionsPage({ searchParams }: PageProps<"/lancamentos">) {
  const raw = await searchParams;
  const filters = parseTxFilters(raw);
  const { workspace, role } = await getContext();
  const where = buildTxWhere(workspace.id, filters);
  const options = await getFormOptions(workspace.id);

  const [items, total, totals] = await Promise.all([
    prisma.transaction.findMany({
      where,
      include: {
        category: { select: { name: true, color: true, icon: true } },
        account: { select: { name: true } },
        transferAccount: { select: { name: true } },
        contact: { select: { name: true } },
      },
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      skip: (filters.pagina - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.transaction.count({ where }),
    prisma.transaction.groupBy({ by: ["type"], where, _sum: { amount: true } }),
  ]);

  const income = num(totals.find((t) => t.type === "INCOME")?._sum.amount);
  const expense = num(totals.find((t) => t.type === "EXPENSE")?._sum.amount);
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const params: Record<string, string | undefined> = Object.fromEntries(
    Object.entries(raw).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v]),
  );
  const exportQuery = new URLSearchParams(Object.entries(params).filter(([k, v]) => v && k !== "pagina") as [string, string][]).toString();
  const pageHref = (p: number) => {
    const qs = new URLSearchParams(Object.entries({ ...params, pagina: p > 1 ? String(p) : undefined }).filter(([, v]) => v) as [string, string][]).toString();
    return qs ? `/lancamentos?${qs}` : "/lancamentos";
  };
  const canEdit = role !== "VIEWER";

  return (
    <div>
      <PageHeader
        title="Lançamentos"
        description="Todas as receitas, despesas e transferências."
        actions={
          <>
            {canEdit && <ImportDialogButton accounts={options.accounts} />}
            <a href={`/api/exportar?${exportQuery}`} className="inline-flex h-10 items-center gap-2 rounded-lg border border-border bg-surface px-4 text-sm font-medium hover:bg-surface-2">
              Exportar CSV
            </a>
          </>
        }
      />

      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        {filters.mes !== "todos" ? <MonthPicker month={filters.mes} basePath="/lancamentos" params={params} /> : <span className="text-sm font-medium">Todos os períodos</span>}
      </div>

      <Card className="mb-4 grid grid-cols-3 divide-x divide-border">
        {[
          { label: "Receitas", value: formatMoney(income, workspace.currency), icon: ArrowUpRight, tone: "text-success" },
          { label: "Despesas", value: formatMoney(expense, workspace.currency), icon: ArrowDownRight, tone: "text-danger" },
          { label: "Saldo", value: formatMoney(income - expense, workspace.currency, { signed: true }), icon: Scale, tone: income - expense >= 0 ? "text-success" : "text-danger" },
        ].map((item) => (
          <div key={item.label} className="min-w-0 px-2.5 py-3 sm:px-5 sm:py-4">
            <p className="flex items-center gap-1.5 text-xs text-muted"><item.icon className={`size-3.5 ${item.tone}`} />{item.label}</p>
            <p className="tabular mt-1 truncate text-[13px] font-semibold sm:text-xl">{item.value}</p>
          </div>
        ))}
      </Card>

      <TransactionFiltersBar options={options} filters={filters} />

      <TransactionList
        items={items.map(serializeTransaction)}
        options={options}
        currency={workspace.currency}
        canEdit={canEdit}
        total={total}
      />

      {pages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm">
          <span className="text-muted">Página {filters.pagina} de {pages} · {total} lançamentos</span>
          <div className="flex gap-2">
            {filters.pagina > 1 && <Link href={pageHref(filters.pagina - 1)} className="inline-flex h-9 items-center gap-1 rounded-lg border border-border bg-surface px-3 hover:bg-surface-2"><ChevronLeft className="size-4" /> Anterior</Link>}
            {filters.pagina < pages && <Link href={pageHref(filters.pagina + 1)} className="inline-flex h-9 items-center gap-1 rounded-lg border border-border bg-surface px-3 hover:bg-surface-2">Próxima <ChevronRight className="size-4" /></Link>}
          </div>
        </div>
      )}
    </div>
  );
}
