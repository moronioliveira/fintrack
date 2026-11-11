import type { Metadata } from "next";
import Link from "next/link";
import { ArrowDownRight, ArrowUpRight, ChevronLeft, ChevronRight, Scale, TrendingDown } from "lucide-react";
import { getContext } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCashflow, getCategoryBreakdown, num } from "@/lib/finance";
import { formatMonth, toDate, todayISO } from "@/lib/dates";
import { formatMoney, formatPercent } from "@/lib/format";
import { Card, CardHeader, EmptyState, PageHeader, StatCard } from "@/components/ui/primitives";
import { CashflowChart } from "@/components/charts/cashflow-chart";
import { DonutChart } from "@/components/charts/donut-chart";
import { PrintButton } from "@/components/ui/print-button";
import { getCategoryMatrix } from "@/lib/category-matrix";
import { CategoryMatrixTable } from "@/components/reports/category-matrix-table";

export const metadata: Metadata = { title: "Relatórios" };

export default async function ReportsPage({ searchParams }: PageProps<"/relatorios">) {
  const { ano } = await searchParams;
  const thisYear = Number(todayISO().slice(0, 4));
  const parsed = Number(typeof ano === "string" ? ano : NaN);
  const year = Number.isInteger(parsed) && parsed > 1990 && parsed < 2200 ? parsed : thisYear;
  const { workspace } = await getContext();
  const wid = workspace.id;
  const currency = workspace.currency;
  const range = { gte: toDate(`${year}-01-01`), lt: toDate(`${year + 1}-01-01`) };
  const isBusiness = workspace.type === "BUSINESS";

  const [months, expenses, incomes, byContact, byCostCenter, contacts, costCenters, matrix] = await Promise.all([
    getCashflow(wid, `${year}-12`, 12),
    getCategoryBreakdown(wid, range, "EXPENSE"),
    getCategoryBreakdown(wid, range, "INCOME"),
    prisma.transaction.groupBy({ by: ["contactId", "type"], where: { workspaceId: wid, date: range, contactId: { not: null }, type: { not: "TRANSFER" } }, _sum: { amount: true } }),
    prisma.transaction.groupBy({ by: ["costCenterId", "type"], where: { workspaceId: wid, date: range, costCenterId: { not: null }, type: { not: "TRANSFER" } }, _sum: { amount: true } }),
    prisma.contact.findMany({ where: { workspaceId: wid }, select: { id: true, name: true } }),
    prisma.costCenter.findMany({ where: { workspaceId: wid }, select: { id: true, name: true } }),
    getCategoryMatrix(wid, year),
  ]);

  const income = months.reduce((a, m) => a + m.income, 0);
  const expense = months.reduce((a, m) => a + m.expense, 0);
  const activeMonths = months.filter((m) => m.income || m.expense).length || 1;
  const rows = months.map((m, i) => ({ ...m, accumulated: months.slice(0, i + 1).reduce((a, x) => a + x.result, 0) }));

  const contactRank = (type: "INCOME" | "EXPENSE") =>
    byContact
      .filter((r) => r.type === type)
      .map((r) => ({ name: contacts.find((c) => c.id === r.contactId)?.name ?? "Sem nome", value: num(r._sum.amount) }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

  const centers = costCenters
    .map((cc) => {
      const inc = num(byCostCenter.find((r) => r.costCenterId === cc.id && r.type === "INCOME")?._sum.amount);
      const exp = num(byCostCenter.find((r) => r.costCenterId === cc.id && r.type === "EXPENSE")?._sum.amount);
      return { ...cc, income: inc, expense: exp, result: inc - exp };
    })
    .filter((c) => c.income || c.expense);

  const yearLink = (y: number) => (y === thisYear ? "/relatorios" : `/relatorios?ano=${y}`);
  const hasData = income > 0 || expense > 0;

  return (
    <div>
      <PageHeader
        title="Relatórios"
        description={`Demonstrativo de resultados de ${workspace.name}.`}
        actions={
          <>
            <div className="flex items-center gap-1 rounded-xl border border-border bg-surface p-1">
              <Link href={yearLink(year - 1)} className="flex size-9 items-center justify-center rounded-lg text-muted hover:bg-surface-2" aria-label="Ano anterior"><ChevronLeft className="size-4" /></Link>
              <span className="tabular min-w-16 text-center text-sm font-medium">{year}</span>
              <Link href={yearLink(year + 1)} className="flex size-9 items-center justify-center rounded-lg text-muted hover:bg-surface-2" aria-label="Próximo ano"><ChevronRight className="size-4" /></Link>
            </div>
            <a href={`/api/exportar?mes=todos`} className="inline-flex h-10 items-center rounded-lg border border-border bg-surface px-4 text-sm font-medium hover:bg-surface-2">Exportar CSV</a>
            <PrintButton />
          </>
        }
      />

      <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label={`Receitas em ${year}`} value={formatMoney(income, currency)} icon={ArrowUpRight} tone="success" />
        <StatCard label={`Despesas em ${year}`} value={formatMoney(expense, currency)} icon={ArrowDownRight} tone="danger" />
        <StatCard label="Resultado do ano" value={formatMoney(income - expense, currency, { signed: true })} icon={Scale} tone={income - expense >= 0 ? "success" : "danger"} footer={income ? `Margem de ${formatPercent(((income - expense) / income) * 100, 1)}` : undefined} />
        <StatCard label="Despesa média mensal" value={formatMoney(expense / activeMonths, currency)} icon={TrendingDown} tone="neutral" footer={`Considerando ${activeMonths} mês(es) com movimento`} />
      </div>

      {!hasData ? (
        <Card><EmptyState icon={Scale} title={`Sem movimentações em ${year}`} description="Os relatórios são montados automaticamente a partir dos lançamentos." /></Card>
      ) : (
        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader title="Receitas x despesas por mês" description="Regime de competência (data do lançamento), incluindo pendentes." />
            <div className="p-5 pt-3"><CashflowChart data={months} currency={currency} /></div>
          </Card>

          <Card className="overflow-hidden">
            <CardHeader title="Demonstrativo mensal" />
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[560px] text-sm">
                <thead>
                  <tr className="border-y border-border bg-surface-2/60 text-left text-xs text-muted">
                    <th className="px-5 py-2.5 font-medium">Mês</th>
                    <th className="px-5 py-2.5 text-right font-medium">Receitas</th>
                    <th className="px-5 py-2.5 text-right font-medium">Despesas</th>
                    <th className="px-5 py-2.5 text-right font-medium">Resultado</th>
                    <th className="px-5 py-2.5 text-right font-medium">Acumulado</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.month} className="border-b border-border last:border-0">
                      <td className="px-5 py-2.5">
                        <Link href={`/lancamentos?mes=${r.month}`} className="hover:underline">{formatMonth(r.month)}</Link>
                      </td>
                      <td className="tabular px-5 py-2.5 text-right">{formatMoney(r.income, currency)}</td>
                      <td className="tabular px-5 py-2.5 text-right">{formatMoney(r.expense, currency)}</td>
                      <td className={`tabular px-5 py-2.5 text-right font-medium ${r.result < 0 ? "text-danger" : r.result > 0 ? "text-success" : "text-muted"}`}>{formatMoney(r.result, currency, { signed: true })}</td>
                      <td className={`tabular px-5 py-2.5 text-right ${r.accumulated < 0 ? "text-danger" : ""}`}>{formatMoney(r.accumulated, currency)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-border font-semibold">
                    <td className="px-5 py-3">Total</td>
                    <td className="tabular px-5 py-3 text-right">{formatMoney(income, currency)}</td>
                    <td className="tabular px-5 py-3 text-right">{formatMoney(expense, currency)}</td>
                    <td className={`tabular px-5 py-3 text-right ${income - expense < 0 ? "text-danger" : "text-success"}`}>{formatMoney(income - expense, currency, { signed: true })}</td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          </Card>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader title="Despesas por categoria" description={String(year)} />
              <div className="p-5">{expenses.length ? <DonutChart data={expenses} currency={currency} totalLabel="Despesas" /> : <p className="text-sm text-muted">Sem despesas.</p>}</div>
            </Card>
            <Card>
              <CardHeader title="Receitas por categoria" description={String(year)} />
              <div className="p-5">{incomes.length ? <DonutChart data={incomes} currency={currency} totalLabel="Receitas" /> : <p className="text-sm text-muted">Sem receitas.</p>}</div>
            </Card>
          </div>

          <Card className="overflow-hidden">
            <CardHeader
              title="Categorias mês a mês"
              description="Clique em um valor para ver os lançamentos."
              action={<a href={`/api/exportar/categorias?ano=${year}`} className="no-print text-xs font-medium text-primary hover:underline">Exportar CSV</a>}
            />
            <div className="mt-3"><CategoryMatrixTable income={matrix.income} expense={matrix.expense} currency={currency} year={year} /></div>
          </Card>

          {(byContact.length > 0 || centers.length > 0 || isBusiness) && (
            <div className="grid gap-4 lg:grid-cols-3">
              <RankCard title={isBusiness ? "Maiores clientes" : "Quem mais te pagou"} items={contactRank("INCOME")} currency={currency} />
              <RankCard title={isBusiness ? "Maiores fornecedores" : "Para quem mais pagou"} items={contactRank("EXPENSE")} currency={currency} />
              <Card>
                <CardHeader title="Resultado por centro de custo" />
                <ul className="p-3">
                  {centers.length ? centers.map((c) => (
                    <li key={c.id} className="flex items-center justify-between gap-2 rounded-lg px-2 py-2 text-sm">
                      <span className="truncate">{c.name}</span>
                      <span className={`tabular font-medium ${c.result < 0 ? "text-danger" : "text-success"}`}>{formatMoney(c.result, currency, { signed: true })}</span>
                    </li>
                  )) : <li className="px-2 py-4 text-sm text-muted">Atribua centros de custo aos lançamentos para ver este relatório.</li>}
                </ul>
              </Card>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function RankCard({ title, items, currency }: { title: string; items: { name: string; value: number }[]; currency: string }) {
  const max = Math.max(...items.map((i) => i.value), 1);
  return (
    <Card>
      <CardHeader title={title} />
      <ul className="flex flex-col gap-3 p-5">
        {items.length ? items.map((i) => (
          <li key={i.name}>
            <div className="mb-1 flex justify-between gap-2 text-sm">
              <span className="truncate">{i.name}</span>
              <span className="tabular font-medium">{formatMoney(i.value, currency)}</span>
            </div>
            <div className="h-1.5 rounded-full bg-surface-2"><div className="h-full rounded-full bg-primary" style={{ width: `${(i.value / max) * 100}%` }} /></div>
          </li>
        )) : <li className="text-sm text-muted">Vincule contatos aos lançamentos para ver este ranking.</li>}
      </ul>
    </Card>
  );
}
