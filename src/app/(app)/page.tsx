import Link from "next/link";
import type { Metadata } from "next";
import {
  ArrowDownRight, ArrowRight, ArrowUpRight, CalendarClock, CircleAlert, Inbox, Landmark, PiggyBank, Scale, Target,
} from "lucide-react";
import { getContext } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  getAccountsWithBalance, getBudgetsProgress, getCashflow, getCategoryBreakdown, getMonthSummary, getOverdueSummary, getUpcoming, num,
} from "@/lib/finance";
import { currentMonth, diffInDays, formatDayMonth, formatMonth, isValidMonth, lastDayOfMonth, monthRange, shiftMonth, toDate, toISO, todayISO } from "@/lib/dates";
import { formatMoney, formatPercent } from "@/lib/format";
import { ACCOUNT_TYPES } from "@/lib/constants";
import { Amount, Badge, Card, CardHeader, EmptyState, Progress, StatCard } from "@/components/ui/primitives";
import { IconBadge } from "@/components/ui/icon";
import { MonthPicker } from "@/components/ui/month-picker";
import { CashflowChart } from "@/components/charts/cashflow-chart";
import { DonutChart } from "@/components/charts/donut-chart";
import { PayButton } from "@/components/transactions/pay-button";

export const metadata: Metadata = { title: "Visão geral" };

function variation(current: number, previous: number) {
  if (!previous) return null;
  return ((current - previous) / Math.abs(previous)) * 100;
}

function Delta({ value, inverse }: { value: number | null; inverse?: boolean }) {
  if (value === null || !Number.isFinite(value)) return <span>sem base no mês anterior</span>;
  const good = inverse ? value <= 0 : value >= 0;
  return (
    <span className={good ? "text-success" : "text-danger"}>
      {value >= 0 ? "▲" : "▼"} {formatPercent(Math.abs(value))} <span className="text-muted">vs. mês anterior</span>
    </span>
  );
}

export default async function DashboardPage({ searchParams }: PageProps<"/">) {
  const { mes } = await searchParams;
  const month = isValidMonth(typeof mes === "string" ? mes : null) ? (mes as string) : currentMonth();
  const { user, workspace, role } = await getContext();
  const wid = workspace.id;
  const currency = workspace.currency;
  const canEdit = role !== "VIEWER";

  const [summary, prevSummary, accounts, cashflow, expenses, upcoming, overdue, budgets, recent, goals, pendingUntilEnd, txCount] = await Promise.all([
    getMonthSummary(wid, month),
    getMonthSummary(wid, shiftMonth(month, -1)),
    getAccountsWithBalance(wid),
    getCashflow(wid, month, 6),
    getCategoryBreakdown(wid, monthRange(month), "EXPENSE"),
    getUpcoming(wid, 15, 6),
    getOverdueSummary(wid),
    getBudgetsProgress(wid, month),
    prisma.transaction.findMany({
      where: { workspaceId: wid, date: { lte: toDate(todayISO()) } },
      include: { category: true, account: true, transferAccount: true },
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      take: 6,
    }),
    prisma.goal.findMany({ where: { workspaceId: wid }, orderBy: { createdAt: "asc" }, take: 3 }),
    prisma.transaction.groupBy({
      by: ["type"],
      where: { workspaceId: wid, status: "PENDING", type: { not: "TRANSFER" }, date: { lte: toDate(lastDayOfMonth(month)) } },
      _sum: { amount: true },
    }),
    prisma.transaction.count({ where: { workspaceId: wid } }),
  ]);

  const balance = accounts.reduce((acc, a) => acc + a.balance, 0);
  const pendingIn = num(pendingUntilEnd.find((r) => r.type === "INCOME")?._sum.amount);
  const pendingOut = num(pendingUntilEnd.find((r) => r.type === "EXPENSE")?._sum.amount);
  const projected = balance + pendingIn - pendingOut;
  const today = todayISO();
  const firstName = user.name.split(" ")[0];
  const hasOverdue = overdue.payable.count + overdue.receivable.count > 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-muted">{workspace.name} · {firstName}</p>
          <h1 className="text-2xl font-semibold tracking-tight">Visão geral</h1>
        </div>
        <MonthPicker month={month} basePath="/" />
      </div>

      {hasOverdue && (
        <Link href="/agenda?status=atrasados" className="flex items-center gap-3 rounded-2xl border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger transition hover:border-danger/60">
          <CircleAlert className="size-5 shrink-0" />
          <span className="flex-1">
            {overdue.payable.count > 0 && <>Você tem <strong>{overdue.payable.count} conta(s) a pagar em atraso</strong> ({formatMoney(overdue.payable.total, currency)}). </>}
            {overdue.receivable.count > 0 && <><strong>{overdue.receivable.count} recebimento(s) atrasado(s)</strong> ({formatMoney(overdue.receivable.total, currency)}).</>}
          </span>
          <ArrowRight className="size-4" />
        </Link>
      )}

      {txCount === 0 && <GettingStarted />}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Saldo em contas"
          value={formatMoney(balance, currency)}
          icon={Landmark}
          tone="primary"
          footer={<>Previsto até {formatDayMonth(lastDayOfMonth(month))}: <strong className={`tabular ${projected < 0 ? "text-danger" : "text-fg"}`}>{formatMoney(projected, currency)}</strong></>}
        />
        <StatCard
          label="Receitas do mês"
          value={formatMoney(summary.income.total, currency)}
          icon={ArrowUpRight}
          tone="success"
          footer={summary.income.pending > 0 ? <>{formatMoney(summary.income.paid, currency)} recebido · {formatMoney(summary.income.pending, currency)} a receber</> : <Delta value={variation(summary.income.total, prevSummary.income.total)} />}
        />
        <StatCard
          label="Despesas do mês"
          value={formatMoney(summary.expense.total, currency)}
          icon={ArrowDownRight}
          tone="danger"
          footer={summary.expense.pending > 0 ? <>{formatMoney(summary.expense.paid, currency)} pago · {formatMoney(summary.expense.pending, currency)} a pagar</> : <Delta value={variation(summary.expense.total, prevSummary.expense.total)} inverse />}
        />
        <StatCard
          label="Resultado do mês"
          value={formatMoney(summary.result, currency, { signed: true })}
          icon={Scale}
          tone={summary.result >= 0 ? "success" : "danger"}
          footer={summary.income.total > 0 ? <>Taxa de economia: <strong className="text-fg">{formatPercent(Math.max(-999, (summary.result / summary.income.total) * 100))}</strong></> : "Sem receitas neste mês"}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader title="Fluxo de caixa" description={`Receitas x despesas · ${formatMonth(shiftMonth(month, -5))} a ${formatMonth(month)}`} action={<Link href="/relatorios" className="text-xs font-medium text-primary hover:underline">Relatórios</Link>} />
          <div className="p-5 pt-3">
            <CashflowChart data={cashflow} currency={currency} />
          </div>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader title="Despesas por categoria" description={formatMonth(month)} />
          <div className="p-5 pt-4">
            {expenses.length ? (
              <DonutChart data={expenses} currency={currency} totalLabel="Despesas" />
            ) : (
              <EmptyState icon={PiggyBank} title="Sem despesas no mês" description="Quando houver despesas, a distribuição por categoria aparece aqui." />
            )}
          </div>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader title="Próximos vencimentos" description="Pendentes até 15 dias à frente" action={<Link href="/agenda" className="text-xs font-medium text-primary hover:underline">Ver todos</Link>} />
          <div className="p-3">
            {upcoming.length ? (
              <ul className="flex flex-col">
                {upcoming.map((t) => {
                  const iso = toISO(t.date);
                  const days = diffInDays(today, iso);
                  return (
                    <li key={t.id} className="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-surface-2">
                      <IconBadge name={t.category?.icon ?? "Receipt"} color={t.category?.color ?? "#64748b"} size="sm" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{t.description}</p>
                        <p className="text-xs">
                          {days < 0 ? <span className="text-danger">Atrasado há {-days} dia(s)</span> : days === 0 ? <span className="text-warning">Vence hoje</span> : <span className="text-muted">{formatDayMonth(iso)} · em {days} dia(s)</span>}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <Amount value={num(t.amount)} currency={currency} type={t.type} className="text-sm" />
                      </div>
                      {canEdit && <PayButton id={t.id} status={t.status} type={t.type} compact />}
                    </li>
                  );
                })}
              </ul>
            ) : (
              <EmptyState icon={CalendarClock} title="Nada a vencer" description="Contas pendentes e recorrências aparecem aqui." />
            )}
          </div>
        </Card>

        <Card>
          <CardHeader title="Orçamentos do mês" action={<Link href="/orcamentos" className="text-xs font-medium text-primary hover:underline">Gerenciar</Link>} />
          <div className="flex flex-col gap-4 p-5">
            {budgets.length ? (
              budgets
                .sort((a, b) => b.percent - a.percent)
                .slice(0, 5)
                .map((b) => (
                  <div key={b.id}>
                    <div className="mb-1.5 flex items-center justify-between gap-2 text-sm">
                      <span className="truncate">{b.name}</span>
                      <span className="tabular text-xs text-muted">{formatMoney(b.used, currency)} / {formatMoney(b.limit, currency)}</span>
                    </div>
                    <Progress value={b.percent} tone={b.percent >= 100 ? "danger" : b.percent >= 80 ? "warning" : "success"} />
                  </div>
                ))
            ) : (
              <EmptyState icon={PiggyBank} title="Nenhum orçamento" description="Defina limites mensais por categoria para controlar gastos." action={<Link href="/orcamentos" className="text-sm font-medium text-primary">Criar orçamento</Link>} />
            )}
          </div>
        </Card>

        <Card>
          <CardHeader title="Contas" action={<Link href="/contas" className="text-xs font-medium text-primary hover:underline">Ver contas</Link>} />
          <ul className="flex flex-col p-3">
            {accounts.map((a) => (
              <li key={a.id} className="flex items-center gap-3 rounded-xl px-2 py-2">
                <span className="size-2.5 shrink-0 rounded-full" style={{ background: a.color }} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{a.name}</p>
                  <p className="text-xs text-muted">{ACCOUNT_TYPES[a.type]}</p>
                </div>
                <span className={`tabular text-sm font-medium ${a.balance < 0 ? "text-danger" : ""}`}>{formatMoney(a.balance, currency)}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Últimos lançamentos" action={<Link href="/lancamentos" className="text-xs font-medium text-primary hover:underline">Ver todos</Link>} />
          <div className="p-3">
            {recent.length ? (
              <ul>
                {recent.map((t) => (
                  <li key={t.id} className="flex items-center gap-3 rounded-xl px-2 py-2">
                    <IconBadge name={t.type === "TRANSFER" ? "Banknote" : t.category?.icon ?? "Tag"} color={t.type === "TRANSFER" ? "#6366f1" : t.category?.color ?? "#64748b"} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{t.description}</p>
                      <p className="truncate text-xs text-muted">
                        {formatDayMonth(t.date)} · {t.type === "TRANSFER" ? `${t.account.name} → ${t.transferAccount?.name}` : `${t.category?.name ?? "Sem categoria"} · ${t.account.name}`}
                      </p>
                    </div>
                    {t.status === "PENDING" && <Badge tone="warning">Pendente</Badge>}
                    <Amount value={num(t.amount)} currency={currency} type={t.type} className="text-sm" />
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState icon={Inbox} title="Nenhum lançamento ainda" description="Use o botão “Novo lançamento” no topo para registrar sua primeira receita ou despesa." />
            )}
          </div>
        </Card>
        <Card>
          <CardHeader title="Metas" action={<Link href="/metas" className="text-xs font-medium text-primary hover:underline">Ver metas</Link>} />
          <div className="flex flex-col gap-4 p-5">
            {goals.length ? (
              goals.map((g) => {
                const pct = num(g.targetAmount) ? (num(g.currentAmount) / num(g.targetAmount)) * 100 : 0;
                return (
                  <div key={g.id}>
                    <div className="mb-1.5 flex items-center justify-between gap-2 text-sm">
                      <span className="truncate font-medium">{g.name}</span>
                      <span className="tabular text-xs text-muted">{formatPercent(Math.min(pct, 100))}</span>
                    </div>
                    <Progress value={pct} color={g.color} />
                    <p className="tabular mt-1 text-xs text-muted">{formatMoney(num(g.currentAmount), currency)} de {formatMoney(num(g.targetAmount), currency)}</p>
                  </div>
                );
              })
            ) : (
              <EmptyState icon={Target} title="Sem metas" description="Crie metas como reserva de emergência ou capital de giro." action={<Link href="/metas" className="text-sm font-medium text-primary">Criar meta</Link>} />
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

function GettingStarted() {
  const steps = [
    { href: "/contas", title: "Revise suas contas", text: "Informe o saldo inicial de cada conta bancária, carteira ou cartão." },
    { href: "/lancamentos", title: "Registre lançamentos", text: "Adicione receitas e despesas ou importe um extrato CSV do seu banco." },
    { href: "/recorrencias", title: "Cadastre contas fixas", text: "Aluguel, salários, assinaturas: o FinTrack agenda tudo automaticamente." },
    { href: "/orcamentos", title: "Defina orçamentos", text: "Limites mensais por categoria com alertas de consumo." },
  ];
  return (
    <Card className="overflow-hidden">
      <div className="border-b border-border px-5 py-4">
        <div>
          <p className="text-sm font-semibold">Primeiros passos</p>
          <p className="text-xs text-muted">Configure o espaço em quatro etapas.</p>
        </div>
      </div>
      <ol className="grid gap-px bg-border sm:grid-cols-2 xl:grid-cols-4">
        {steps.map((s, i) => (
          <li key={s.href} className="bg-surface">
            <Link href={s.href} className="flex h-full gap-3 p-4 transition hover:bg-surface-2">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-fg">{i + 1}</span>
              <span>
                <span className="block text-sm font-medium">{s.title}</span>
                <span className="block text-xs text-muted">{s.text}</span>
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </Card>
  );
}
