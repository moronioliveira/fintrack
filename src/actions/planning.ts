"use server";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { runAction, ValidationError, type ActionState } from "@/lib/action";
import { date, money, oneOf, optStr, str } from "@/lib/form";
import { toDate, todayISO } from "@/lib/dates";
import { num } from "@/lib/finance";

// ─── Orçamentos ────────────────────────────────────────────────────────────────

export async function saveBudget(_: ActionState, form: FormData) {
  return runAction(async () => {
    const { workspace } = await requireRole("MEMBER");
    const categoryId = str(form, "categoryId", { required: "Selecione a categoria." });
    const amount = money(form, "amount", { label: "Limite" });
    const category = await prisma.category.findFirst({ where: { id: categoryId, workspaceId: workspace.id, kind: "EXPENSE" } });
    if (!category) throw new ValidationError("Categoria inválida.");
    await prisma.budget.upsert({
      where: { workspaceId_categoryId: { workspaceId: workspace.id, categoryId } },
      create: { workspaceId: workspace.id, categoryId, amount },
      update: { amount },
    });
    return "Orçamento salvo.";
  });
}

export async function deleteBudget(_: ActionState, form: FormData) {
  return runAction(async () => {
    const { workspace } = await requireRole("MEMBER");
    await prisma.budget.deleteMany({ where: { id: str(form, "id"), workspaceId: workspace.id } });
    return "Orçamento removido.";
  });
}

// ─── Metas ─────────────────────────────────────────────────────────────────────

export async function saveGoal(_: ActionState, form: FormData) {
  return runAction(async () => {
    const { workspace } = await requireRole("MEMBER");
    const id = optStr(form, "id");
    const deadline = date(form, "deadline");
    const data = {
      name: str(form, "name", { required: "Informe o nome da meta.", max: 80 }),
      targetAmount: money(form, "targetAmount", { label: "Valor alvo" }),
      currentAmount: money(form, "currentAmount", { allowZero: true, label: "Valor atual" }),
      deadline: deadline ? toDate(deadline) : null,
      color: str(form, "color") || "#10b981",
    };
    if (id) {
      const { count } = await prisma.goal.updateMany({ where: { id, workspaceId: workspace.id }, data });
      if (!count) throw new ValidationError("Meta não encontrada.");
      return "Meta atualizada.";
    }
    await prisma.goal.create({ data: { ...data, workspaceId: workspace.id } });
    return "Meta criada.";
  });
}

export async function contributeGoal(_: ActionState, form: FormData) {
  return runAction(async () => {
    const { workspace } = await requireRole("MEMBER");
    const id = str(form, "id", { required: "Meta inválida." });
    const value = money(form, "amount", { allowNegative: true, label: "Valor do aporte" });
    const goal = await prisma.goal.findFirst({ where: { id, workspaceId: workspace.id } });
    if (!goal) throw new ValidationError("Meta não encontrada.");
    const next = Math.max(0, num(goal.currentAmount) + value);
    await prisma.goal.update({ where: { id }, data: { currentAmount: next } });
    return next >= num(goal.targetAmount) ? "Meta atingida." : value > 0 ? "Aporte registrado." : "Resgate registrado.";
  });
}

export async function deleteGoal(_: ActionState, form: FormData) {
  return runAction(async () => {
    const { workspace } = await requireRole("MEMBER");
    await prisma.goal.deleteMany({ where: { id: str(form, "id"), workspaceId: workspace.id } });
    return "Meta excluída.";
  });
}

// ─── Recorrências ──────────────────────────────────────────────────────────────

export async function saveRecurring(_: ActionState, form: FormData) {
  return runAction(async () => {
    const { workspace } = await requireRole("MEMBER");
    const id = optStr(form, "id");
    const type = oneOf(form, "type", ["INCOME", "EXPENSE"] as const);
    const accountId = str(form, "accountId", { required: "Selecione a conta." });
    const categoryId = optStr(form, "categoryId");
    const contactId = optStr(form, "contactId");
    const start = date(form, "startDate", { required: true })!;
    const end = date(form, "endDate");
    if (end && end < start) throw new ValidationError("A data final deve ser posterior à inicial.");

    const [account, category, contact] = await Promise.all([
      prisma.account.findFirst({ where: { id: accountId, workspaceId: workspace.id } }),
      categoryId ? prisma.category.findFirst({ where: { id: categoryId, workspaceId: workspace.id } }) : true,
      contactId ? prisma.contact.findFirst({ where: { id: contactId, workspaceId: workspace.id } }) : true,
    ]);
    if (!account || !category || !contact) throw new ValidationError("Revise conta, categoria e contato.");

    const data = {
      type,
      description: str(form, "description", { required: "Informe a descrição.", max: 160 }),
      amount: money(form, "amount"),
      frequency: oneOf(form, "frequency", ["WEEKLY", "MONTHLY", "YEARLY"] as const),
      startDate: toDate(start),
      endDate: end ? toDate(end) : null,
      accountId,
      categoryId,
      contactId,
    };

    if (id) {
      const rule = await prisma.recurringRule.findFirst({ where: { id, workspaceId: workspace.id } });
      if (!rule) throw new ValidationError("Recorrência não encontrada.");
      const today = toDate(todayISO());
      // Lançamentos futuros ainda pendentes são recriados com os novos dados.
      await prisma.$transaction([
        prisma.transaction.deleteMany({ where: { recurringRuleId: id, status: "PENDING", date: { gte: today } } }),
        prisma.recurringRule.update({
          where: { id },
          data: { ...data, generatedUntil: new Date(today.getTime() - 86_400_000) },
        }),
      ]);
      return "Recorrência atualizada.";
    }
    await prisma.recurringRule.create({ data: { ...data, workspaceId: workspace.id } });
    return "Recorrência criada. Os próximos lançamentos foram agendados.";
  });
}

export async function toggleRecurring(_: ActionState, form: FormData) {
  return runAction(async () => {
    const { workspace } = await requireRole("MEMBER");
    const id = str(form, "id");
    const rule = await prisma.recurringRule.findFirst({ where: { id, workspaceId: workspace.id } });
    if (!rule) throw new ValidationError("Recorrência não encontrada.");
    if (rule.active) {
      await prisma.$transaction([
        prisma.transaction.deleteMany({ where: { recurringRuleId: id, status: "PENDING", date: { gte: toDate(todayISO()) } } }),
        prisma.recurringRule.update({ where: { id }, data: { active: false } }),
      ]);
      return "Recorrência pausada.";
    }
    await prisma.recurringRule.update({ where: { id }, data: { active: true, generatedUntil: new Date(toDate(todayISO()).getTime() - 86_400_000) } });
    return "Recorrência reativada.";
  });
}

export async function deleteRecurring(_: ActionState, form: FormData) {
  return runAction(async () => {
    const { workspace } = await requireRole("MEMBER");
    const id = str(form, "id");
    await prisma.$transaction([
      prisma.transaction.deleteMany({ where: { workspaceId: workspace.id, recurringRuleId: id, status: "PENDING" } }),
      prisma.recurringRule.deleteMany({ where: { id, workspaceId: workspace.id } }),
    ]);
    return "Recorrência excluída. Lançamentos já pagos foram mantidos.";
  });
}
