import type { Metadata } from "next";
import { CircleAlert, PiggyBank } from "lucide-react";
import { getContext, hasRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getBudgetsProgress } from "@/lib/finance";
import { currentMonth, daysInMonth, isValidMonth, todayISO } from "@/lib/dates";
import { formatMoney, formatPercent } from "@/lib/format";
import { deleteBudget, saveBudget } from "@/actions/planning";
import { Card, EmptyState, PageHeader, Progress, StatCard } from "@/components/ui/primitives";
import { IconBadge } from "@/components/ui/icon";
import { EntityDialog } from "@/components/ui/entity-dialog";
import { DeleteButton } from "@/components/ui/delete-button";
import { Field, MoneyInput, Select } from "@/components/ui/field";
import { MonthPicker } from "@/components/ui/month-picker";

export const metadata: Metadata = { title: "Orçamentos" };

export default async function BudgetsPage({ searchParams }: PageProps<"/orcamentos">) {
  const { mes } = await searchParams;
  const month = isValidMonth(typeof mes === "string" ? mes : null) ? (mes as string) : currentMonth();
  const { workspace, role } = await getContext();
  const currency = workspace.currency;
  const [budgets, categories] = await Promise.all([
    getBudgetsProgress(workspace.id, month),
    prisma.category.findMany({ where: { workspaceId: workspace.id, kind: "EXPENSE", archived: false }, orderBy: { name: "asc" } }),
  ]);
  const canEdit = hasRole(role, "MEMBER");
  const totalLimit = budgets.reduce((a, b) => a + b.limit, 0);
  const totalUsed = budgets.reduce((a, b) => a + b.used, 0);
  const [y, m] = month.split("-").map(Number);
  const isCurrent = month === currentMonth();
  const dayShare = isCurrent ? Number(todayISO().slice(8, 10)) / daysInMonth(y, m) : month < currentMonth() ? 1 : 0;
  const over = budgets.filter((b) => b.percent >= 100);

  const form = (budget?: (typeof budgets)[number]) => (
    <>
      <Field label="Categoria de despesa">
        <Select name="categoryId" required defaultValue={budget?.categoryId ?? ""}>
          <option value="" disabled>Selecione</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </Select>
      </Field>
      <Field label="Limite mensal" hint="Vale para todos os meses. Se a categoria já tiver orçamento, ele será atualizado.">
        <MoneyInput name="amount" currency={currency} required defaultValue={budget ? budget.limit.toFixed(2).replace(".", ",") : ""} />
      </Field>
    </>
  );

  return (
    <div>
      <PageHeader
        title="Orçamentos"
        description="Limites mensais de gastos por categoria."
        actions={
          <>
            <MonthPicker month={month} basePath="/orcamentos" />
            {canEdit && <EntityDialog action={saveBudget} title="Novo orçamento" triggerLabel="Novo orçamento" submitLabel="Salvar">{form()}</EntityDialog>}
          </>
        }
      />

      {budgets.length > 0 && (
        <div className="mb-6 grid gap-3 sm:grid-cols-3">
          <StatCard label="Orçado no mês" value={formatMoney(totalLimit, currency)} icon={PiggyBank} tone="primary" />
          <StatCard label="Gasto nas categorias" value={formatMoney(totalUsed, currency)} icon={PiggyBank} tone={totalUsed > totalLimit ? "danger" : "success"} footer={totalLimit ? `${formatPercent((totalUsed / totalLimit) * 100)} do total orçado` : undefined} />
          <StatCard label="Disponível" value={formatMoney(totalLimit - totalUsed, currency)} icon={PiggyBank} tone={totalLimit - totalUsed < 0 ? "danger" : "neutral"} footer={over.length ? <span className="text-danger">{over.length} categoria(s) estourada(s)</span> : "Nenhum orçamento estourado"} />
        </div>
      )}

      {budgets.length ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {budgets.map((b) => {
            const tone = b.percent >= 100 ? "danger" : b.percent >= 80 ? "warning" : "success";
            const pace = dayShare > 0 && b.used / b.limit > dayShare * 1.1 && b.percent < 100;
            return (
              <Card key={b.id} className="p-5">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <IconBadge name={b.icon} color={b.color} />
                    <div>
                      <p className="font-medium">{b.name}</p>
                      <p className="tabular text-xs text-muted">Limite {formatMoney(b.limit, currency)}</p>
                    </div>
                  </div>
                  {canEdit && (
                    <div className="flex">
                      <EntityDialog action={saveBudget} title="Editar orçamento" submitLabel="Salvar">{form(b)}</EntityDialog>
                      <DeleteButton action={deleteBudget} id={b.id} confirm={`Remover orçamento de “${b.name}”?`} />
                    </div>
                  )}
                </div>
                <div className="mt-5 flex items-end justify-between">
                  <p className="tabular text-xl font-semibold">{formatMoney(b.used, currency)}</p>
                  <p className={`tabular text-sm font-medium ${tone === "danger" ? "text-danger" : tone === "warning" ? "text-warning" : "text-success"}`}>{formatPercent(b.percent)}</p>
                </div>
                <div className="relative mt-2">
                  <Progress value={b.percent} tone={tone} />
                  {dayShare > 0 && dayShare < 1 && <span className="absolute -top-1 h-4 w-0.5 rounded bg-fg/40" style={{ left: `${dayShare * 100}%` }} title="Ritmo ideal até hoje" />}
                </div>
                <p className="mt-2 text-xs text-muted">
                  {b.percent >= 100
                    ? <span className="text-danger">Estourou {formatMoney(b.used - b.limit, currency)}</span>
                    : <>Resta {formatMoney(b.limit - b.used, currency)}</>}
                </p>
                {pace && (
                  <p className="mt-2 flex items-center gap-1.5 text-xs text-warning"><CircleAlert className="size-3.5" /> Gastando acima do ritmo do mês</p>
                )}
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <EmptyState icon={PiggyBank} title="Nenhum orçamento definido" description="Defina quanto pode gastar por categoria e acompanhe o consumo ao longo do mês." />
        </Card>
      )}
    </div>
  );
}
