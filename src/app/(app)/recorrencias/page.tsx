import type { Metadata } from "next";
import { Pause, Play, Repeat } from "lucide-react";
import type { RecurringRule } from "@prisma/client";
import { getContext, hasRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getFormOptions, type FormOptions } from "@/lib/options";
import { num } from "@/lib/finance";
import { formatDate, toISO, todayISO } from "@/lib/dates";
import { formatMoney } from "@/lib/format";
import { FREQUENCIES } from "@/lib/constants";
import { deleteRecurring, saveRecurring, toggleRecurring } from "@/actions/planning";
import { Amount, Badge, Card, EmptyState, PageHeader, StatCard } from "@/components/ui/primitives";
import { IconBadge } from "@/components/ui/icon";
import { EntityDialog } from "@/components/ui/entity-dialog";
import { DeleteButton } from "@/components/ui/delete-button";
import { ActionButton } from "@/components/ui/action-form";
import { Field, Input, MoneyInput, Select } from "@/components/ui/field";

export const metadata: Metadata = { title: "Recorrências" };

function RecurringFields({ rule, options, currency }: { rule?: RecurringRule; options: FormOptions; currency: string }) {
  return (
    <>
      {rule && <input type="hidden" name="id" value={rule.id} />}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Tipo">
          <Select name="type" defaultValue={rule?.type ?? "EXPENSE"}>
            <option value="EXPENSE">Despesa (a pagar)</option>
            <option value="INCOME">Receita (a receber)</option>
          </Select>
        </Field>
        <Field label="Valor"><MoneyInput name="amount" currency={currency} required defaultValue={rule ? num(rule.amount).toFixed(2).replace(".", ",") : ""} /></Field>
      </div>
      <Field label="Descrição"><Input name="description" required maxLength={160} defaultValue={rule?.description} placeholder="Ex.: Aluguel, Internet, Mensalidade do cliente X" /></Field>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Frequência">
          <Select name="frequency" defaultValue={rule?.frequency ?? "MONTHLY"}>
            {Object.entries(FREQUENCIES).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </Select>
        </Field>
        <Field label="Primeiro vencimento"><Input type="date" name="startDate" required defaultValue={rule ? toISO(rule.startDate) : todayISO()} /></Field>
        <Field label="Termina em (opcional)"><Input type="date" name="endDate" defaultValue={rule?.endDate ? toISO(rule.endDate) : ""} /></Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Conta">
          <Select name="accountId" required defaultValue={rule?.accountId ?? options.accounts[0]?.id}>
            {options.accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </Select>
        </Field>
        <Field label="Categoria">
          <Select name="categoryId" defaultValue={rule?.categoryId ?? ""}>
            <option value="">Sem categoria</option>
            <optgroup label="Despesas">{options.categories.filter((c) => c.kind === "EXPENSE").map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</optgroup>
            <optgroup label="Receitas">{options.categories.filter((c) => c.kind === "INCOME").map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</optgroup>
          </Select>
        </Field>
      </div>
      {options.contacts.length > 0 && (
        <Field label="Contato">
          <Select name="contactId" defaultValue={rule?.contactId ?? ""}>
            <option value="">Nenhum</option>
            {options.contacts.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
        </Field>
      )}
      <p className="rounded-lg bg-surface-2 px-3 py-2 text-xs text-muted">Os lançamentos são criados automaticamente como pendentes com até 40 dias de antecedência e aparecem em “A pagar e receber”.</p>
    </>
  );
}

const toMonthly = (amount: number, frequency: string) => (frequency === "WEEKLY" ? (amount * 52) / 12 : frequency === "YEARLY" ? amount / 12 : amount);

export default async function RecurringPage() {
  const { workspace, role } = await getContext();
  const [rules, options, next] = await Promise.all([
    prisma.recurringRule.findMany({ where: { workspaceId: workspace.id }, include: { category: true, account: true, contact: true }, orderBy: [{ active: "desc" }, { description: "asc" }] }),
    getFormOptions(workspace.id),
    prisma.transaction.groupBy({ by: ["recurringRuleId"], where: { workspaceId: workspace.id, status: "PENDING", recurringRuleId: { not: null } }, _min: { date: true } }),
  ]);
  const currency = workspace.currency;
  const canEdit = hasRole(role, "MEMBER");
  const active = rules.filter((r) => r.active);
  const monthlyOut = active.filter((r) => r.type === "EXPENSE").reduce((a, r) => a + toMonthly(num(r.amount), r.frequency), 0);
  const monthlyIn = active.filter((r) => r.type === "INCOME").reduce((a, r) => a + toMonthly(num(r.amount), r.frequency), 0);

  return (
    <div>
      <PageHeader
        title="Recorrências"
        description="Contas fixas e receitas que se repetem: aluguel, salários, assinaturas, mensalidades."
        actions={canEdit && (
          <EntityDialog action={saveRecurring} title="Nova recorrência" triggerLabel="Nova recorrência" submitLabel="Criar" size="lg">
            <RecurringFields options={options} currency={currency} />
          </EntityDialog>
        )}
      />

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <StatCard label="Despesas fixas / mês" value={formatMoney(monthlyOut, currency)} icon={Repeat} tone="danger" />
        <StatCard label="Receitas fixas / mês" value={formatMoney(monthlyIn, currency)} icon={Repeat} tone="success" />
        <StatCard label="Resultado fixo / mês" value={formatMoney(monthlyIn - monthlyOut, currency, { signed: true })} icon={Repeat} tone={monthlyIn - monthlyOut >= 0 ? "success" : "warning"} />
      </div>

      {rules.length ? (
        <Card>
          <ul>
            {rules.map((r) => {
              const nextDate = next.find((n) => n.recurringRuleId === r.id)?._min.date;
              return (
                <li key={r.id} className={`flex flex-wrap items-center gap-3 border-b border-border px-4 py-3 last:border-0 sm:flex-nowrap ${r.active ? "" : "opacity-60"}`}>
                  <IconBadge name={r.category?.icon ?? "Receipt"} color={r.category?.color ?? "#64748b"} />
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-2 truncate text-sm font-medium">
                      {r.description} {!r.active && <Badge>Pausada</Badge>}
                    </p>
                    <p className="truncate text-xs text-muted">
                      {FREQUENCIES[r.frequency]} · {r.account.name}
                      {r.contact ? ` · ${r.contact.name}` : ""}
                      {r.active && nextDate ? ` · próximo: ${formatDate(nextDate)}` : ""}
                      {r.endDate ? ` · até ${formatDate(r.endDate)}` : ""}
                    </p>
                  </div>
                  <Amount value={num(r.amount)} currency={currency} type={r.type} className="text-sm" />
                  {canEdit && (
                    <div className="flex">
                      <ActionButton action={toggleRecurring} fields={{ id: r.id }} title={r.active ? "Pausar" : "Reativar"} className="flex size-8 items-center justify-center rounded-lg text-muted hover:bg-surface-2 hover:text-fg">
                        {r.active ? <Pause className="size-4" /> : <Play className="size-4" />}
                      </ActionButton>
                      <EntityDialog action={saveRecurring} title="Editar recorrência" submitLabel="Salvar" size="lg">
                        <RecurringFields rule={r} options={options} currency={currency} />
                      </EntityDialog>
                      <DeleteButton action={deleteRecurring} id={r.id} confirm={`Excluir “${r.description}”? Lançamentos pendentes futuros serão removidos; os já pagos ficam.`} />
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </Card>
      ) : (
        <Card>
          <EmptyState icon={Repeat} title="Nenhuma recorrência" description="Cadastre contas fixas uma única vez e o FinTrack agenda os próximos vencimentos automaticamente." />
        </Card>
      )}
    </div>
  );
}
