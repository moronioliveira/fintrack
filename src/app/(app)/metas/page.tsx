import type { Metadata } from "next";
import { CalendarDays, Target, Trophy } from "lucide-react";
import type { Goal } from "@prisma/client";
import { getContext, hasRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { num } from "@/lib/finance";
import { diffInDays, formatDate, toISO, todayISO } from "@/lib/dates";
import { formatMoney, formatPercent } from "@/lib/format";
import { contributeGoal, deleteGoal, saveGoal } from "@/actions/planning";
import { Badge, Card, EmptyState, PageHeader, Progress } from "@/components/ui/primitives";
import { EntityDialog } from "@/components/ui/entity-dialog";
import { DeleteButton } from "@/components/ui/delete-button";
import { Field, Input, MoneyInput } from "@/components/ui/field";
import { ColorPicker } from "@/components/ui/pickers";

export const metadata: Metadata = { title: "Metas" };

function GoalFields({ goal, currency }: { goal?: Goal; currency: string }) {
  const money = (v: unknown) => num(v as never).toFixed(2).replace(".", ",");
  return (
    <>
      {goal && <input type="hidden" name="id" value={goal.id} />}
      <Field label="Nome da meta">
        <Input name="name" required maxLength={80} defaultValue={goal?.name} placeholder="Ex.: Reserva de emergência" />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Valor alvo"><MoneyInput name="targetAmount" currency={currency} required defaultValue={goal ? money(goal.targetAmount) : ""} /></Field>
        <Field label="Já guardado"><MoneyInput name="currentAmount" currency={currency} defaultValue={goal ? money(goal.currentAmount) : "0,00"} /></Field>
      </div>
      <Field label="Prazo (opcional)">
        <Input type="date" name="deadline" defaultValue={goal?.deadline ? toISO(goal.deadline) : ""} />
      </Field>
      <ColorPicker defaultValue={goal?.color ?? "#10b981"} />
    </>
  );
}

export default async function GoalsPage() {
  const { workspace, role } = await getContext();
  const goals = await prisma.goal.findMany({ where: { workspaceId: workspace.id }, orderBy: { createdAt: "asc" } });
  const currency = workspace.currency;
  const canEdit = hasRole(role, "MEMBER");
  const today = todayISO();

  return (
    <div>
      <PageHeader
        title="Metas"
        description="Objetivos financeiros com acompanhamento de progresso e quanto guardar por mês."
        actions={canEdit && (
          <EntityDialog action={saveGoal} title="Nova meta" triggerLabel="Nova meta" submitLabel="Criar meta">
            <GoalFields currency={currency} />
          </EntityDialog>
        )}
      />

      {goals.length ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {goals.map((g) => {
            const target = num(g.targetAmount);
            const current = num(g.currentAmount);
            const pct = target ? (current / target) * 100 : 0;
            const done = current >= target;
            const deadline = g.deadline ? toISO(g.deadline) : null;
            const days = deadline ? diffInDays(today, deadline) : null;
            const months = days !== null ? Math.max(1, Math.ceil(days / 30)) : null;
            const perMonth = months && !done ? (target - current) / months : null;
            return (
              <Card key={g.id} className="flex flex-col p-5">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <span className="flex size-10 items-center justify-center rounded-xl" style={{ backgroundColor: `${g.color}1f`, color: g.color }}>
                      {done ? <Trophy className="size-5" /> : <Target className="size-5" />}
                    </span>
                    <div>
                      <p className="font-medium">{g.name}</p>
                      {deadline && (
                        <p className="flex items-center gap-1 text-xs text-muted"><CalendarDays className="size-3" /> {formatDate(deadline)}</p>
                      )}
                    </div>
                  </div>
                  {canEdit && (
                    <div className="flex">
                      <EntityDialog action={saveGoal} title="Editar meta" submitLabel="Salvar"><GoalFields goal={g} currency={currency} /></EntityDialog>
                      <DeleteButton action={deleteGoal} id={g.id} confirm={`Excluir a meta “${g.name}”?`} />
                    </div>
                  )}
                </div>

                <div className="mt-5 flex items-end justify-between">
                  <div>
                    <p className="tabular text-xl font-semibold">{formatMoney(current, currency)}</p>
                    <p className="tabular text-xs text-muted">de {formatMoney(target, currency)}</p>
                  </div>
                  <span className="tabular text-sm font-semibold" style={{ color: g.color }}>{formatPercent(Math.min(pct, 100))}</span>
                </div>
                <div className="mt-2"><Progress value={pct} color={g.color} /></div>

                <div className="mt-3 flex-1 text-xs text-muted">
                  {done ? (
                    <Badge tone="success">Meta atingida</Badge>
                  ) : days !== null && days < 0 ? (
                    <span className="text-danger">Prazo vencido · faltam {formatMoney(target - current, currency)}</span>
                  ) : perMonth ? (
                    <>Guarde <strong className="tabular text-fg">{formatMoney(perMonth, currency)}/mês</strong> para chegar no prazo</>
                  ) : (
                    <>Faltam {formatMoney(target - current, currency)}</>
                  )}
                </div>

                {canEdit && (
                  <div className="mt-4 border-t border-border pt-4">
                    <EntityDialog action={contributeGoal} title={`Movimentar “${g.name}”`} description="Use um valor negativo para registrar um resgate." triggerLabel="Aportar / resgatar" triggerVariant="outline" submitLabel="Confirmar" size="sm">
                      <input type="hidden" name="id" value={g.id} />
                      <Field label="Valor"><MoneyInput name="amount" currency={currency} required /></Field>
                    </EntityDialog>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <EmptyState icon={Target} title="Nenhuma meta ainda" description="Viagem, carro novo, reserva de emergência ou capital de giro: defina o objetivo e acompanhe." />
        </Card>
      )}
    </div>
  );
}
