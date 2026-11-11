import type { Metadata } from "next";
import Link from "next/link";
import { CalendarCheck, CircleAlert, Clock, HandCoins, Receipt } from "lucide-react";
import type { Prisma } from "@prisma/client";
import { getContext } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { num } from "@/lib/finance";
import { addDays, diffInDays, formatDate, toDate, toISO, todayISO } from "@/lib/dates";
import { formatMoney } from "@/lib/format";
import { Amount, Card, EmptyState, PageHeader, StatCard } from "@/components/ui/primitives";
import { IconBadge } from "@/components/ui/icon";
import { PayButton } from "@/components/transactions/pay-button";

export const metadata: Metadata = { title: "A pagar e receber" };

const TABS = [
  { key: "todos", label: "Todos" },
  { key: "pagar", label: "A pagar" },
  { key: "receber", label: "A receber" },
  { key: "atrasados", label: "Atrasados" },
] as const;

export default async function AgendaPage({ searchParams }: PageProps<"/agenda">) {
  const { status } = await searchParams;
  const tab = TABS.find((t) => t.key === status)?.key ?? "todos";
  const { workspace, role } = await getContext();
  const today = todayISO();
  const currency = workspace.currency;

  const where: Prisma.TransactionWhereInput = {
    workspaceId: workspace.id,
    status: "PENDING",
    type: tab === "pagar" ? "EXPENSE" : tab === "receber" ? "INCOME" : { not: "TRANSFER" },
    date: tab === "atrasados" ? { lt: toDate(today) } : { lte: toDate(addDays(today, 90)) },
  };

  const [items, totals] = await Promise.all([
    prisma.transaction.findMany({
      where,
      include: { category: true, contact: true, account: true },
      orderBy: { date: "asc" },
      take: 300,
    }),
    prisma.transaction.groupBy({
      by: ["type"],
      where: { workspaceId: workspace.id, status: "PENDING", type: { not: "TRANSFER" }, date: { lte: toDate(addDays(today, 30)) } },
      _sum: { amount: true },
    }),
  ]);

  const overdueOut = items.filter((t) => t.type === "EXPENSE" && toISO(t.date) < today).reduce((a, t) => a + num(t.amount), 0);
  const payable = num(totals.find((t) => t.type === "EXPENSE")?._sum.amount);
  const receivable = num(totals.find((t) => t.type === "INCOME")?._sum.amount);

  const groups: { title: string; tone: string; items: typeof items }[] = [
    { title: "Atrasados", tone: "text-danger", items: items.filter((t) => toISO(t.date) < today) },
    { title: "Hoje", tone: "text-warning", items: items.filter((t) => toISO(t.date) === today) },
    { title: "Próximos 7 dias", tone: "text-fg", items: items.filter((t) => { const d = diffInDays(today, toISO(t.date)); return d > 0 && d <= 7; }) },
    { title: "Mais adiante", tone: "text-muted", items: items.filter((t) => diffInDays(today, toISO(t.date)) > 7) },
  ].filter((g) => g.items.length);

  return (
    <div>
      <PageHeader title="A pagar e receber" description="Compromissos pendentes, parcelas e recorrências dos próximos 90 dias." />

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <StatCard label="A pagar (próx. 30 dias + atrasados)" value={formatMoney(payable, currency)} icon={Receipt} tone="danger" />
        <StatCard label="A receber (próx. 30 dias + atrasados)" value={formatMoney(receivable, currency)} icon={HandCoins} tone="success" />
        <StatCard label="Saldo dos compromissos" value={formatMoney(receivable - payable, currency, { signed: true })} icon={Clock} tone={receivable - payable >= 0 ? "success" : "warning"} footer={overdueOut > 0 ? <span className="text-danger">{formatMoney(overdueOut, currency)} em contas atrasadas</span> : "Nenhuma conta atrasada"} />
      </div>

      <div className="mb-4 flex gap-1 overflow-x-auto rounded-xl border border-border bg-surface p-1">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={t.key === "todos" ? "/agenda" : `/agenda?status=${t.key}`}
            className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-sm transition ${tab === t.key ? "bg-primary-soft font-medium text-primary" : "text-muted hover:text-fg"}`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {groups.length ? (
        <div className="flex flex-col gap-4">
          {groups.map((g) => (
            <Card key={g.title}>
              <div className="flex items-center justify-between border-b border-border px-5 py-3">
                <h2 className={`flex items-center gap-2 text-sm font-semibold ${g.tone}`}>
                  {g.title === "Atrasados" && <CircleAlert className="size-4" />}
                  {g.title} <span className="font-normal text-muted">({g.items.length})</span>
                </h2>
                <span className="tabular text-xs text-muted">
                  {formatMoney(g.items.reduce((a, t) => a + (t.type === "INCOME" ? num(t.amount) : -num(t.amount)), 0), currency, { signed: true })}
                </span>
              </div>
              <ul>
                {g.items.map((t) => {
                  const iso = toISO(t.date);
                  const days = diffInDays(today, iso);
                  return (
                    <li key={t.id} className="flex items-center gap-3 border-b border-border px-4 py-3 last:border-0">
                      <IconBadge name={t.category?.icon ?? (t.type === "INCOME" ? "HandCoins" : "Receipt")} color={t.category?.color ?? "#64748b"} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{t.description}</p>
                        <p className="truncate text-xs text-muted">
                          {formatDate(iso)}
                          {days < 0 ? ` · ${-days} dia(s) de atraso` : days > 0 ? ` · em ${days} dia(s)` : ""}
                          {t.contact ? ` · ${t.contact.name}` : ""} · {t.account.name}
                        </p>
                      </div>
                      <Amount value={num(t.amount)} currency={currency} type={t.type} className="text-sm" />
                      {role !== "VIEWER" && <PayButton id={t.id} status={t.status} type={t.type} />}
                    </li>
                  );
                })}
              </ul>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <EmptyState icon={CalendarCheck} title="Tudo em dia!" description="Nenhum compromisso pendente para este filtro. Lançamentos não pagos e recorrências aparecem aqui." />
        </Card>
      )}
    </div>
  );
}
