"use server";

import { randomUUID } from "node:crypto";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { runAction, ValidationError, type ActionState } from "@/lib/action";
import { bool, date, int, money, oneOf, optStr, str } from "@/lib/form";
import { addMonths, parseFlexibleDate, toDate, todayISO } from "@/lib/dates";
import { parseMoney, round2 } from "@/lib/format";
import { buildCategoryGuesser } from "@/lib/categorize";

async function assertOwned(workspaceId: string, refs: { accountId?: string | null; transferAccountId?: string | null; categoryId?: string | null; contactId?: string | null; costCenterId?: string | null }) {
  const checks: Promise<unknown>[] = [];
  const check = (p: Promise<unknown>, label: string) =>
    checks.push(p.then((r) => { if (!r) throw new ValidationError(`${label} inválida.`); }));
  if (refs.accountId) check(prisma.account.findFirst({ where: { id: refs.accountId, workspaceId } }), "Conta");
  if (refs.transferAccountId) check(prisma.account.findFirst({ where: { id: refs.transferAccountId, workspaceId } }), "Conta de destino");
  if (refs.categoryId) check(prisma.category.findFirst({ where: { id: refs.categoryId, workspaceId } }), "Categoria");
  if (refs.contactId) check(prisma.contact.findFirst({ where: { id: refs.contactId, workspaceId } }), "Contato");
  if (refs.costCenterId) check(prisma.costCenter.findFirst({ where: { id: refs.costCenterId, workspaceId } }), "Centro de custo");
  await Promise.all(checks);
}

export async function saveTransaction(_: ActionState, form: FormData) {
  return runAction(async () => {
    const { workspace, user } = await requireRole("MEMBER");
    const id = optStr(form, "id");
    const type = oneOf(form, "type", ["INCOME", "EXPENSE", "TRANSFER"] as const);
    const description = str(form, "description", { required: "Informe uma descrição.", max: 160 });
    const amount = money(form, "amount");
    const when = date(form, "date", { required: true })!;
    const paid = bool(form, "paid");
    const accountId = str(form, "accountId", { required: "Selecione a conta." });
    const transferAccountId = type === "TRANSFER" ? str(form, "transferAccountId", { required: "Selecione a conta de destino." }) : null;
    if (transferAccountId && transferAccountId === accountId) throw new ValidationError("As contas de origem e destino devem ser diferentes.");
    let categoryId = type === "TRANSFER" ? null : optStr(form, "categoryId");
    let contactId = type === "TRANSFER" ? null : optStr(form, "contactId");
    let guessed = false;
    // Novo lançamento sem categoria: sugere a partir de lançamentos parecidos.
    if (!optStr(form, "id") && type !== "TRANSFER" && !categoryId) {
      const guess = (await buildCategoryGuesser(workspace.id))(description, type);
      if (guess?.categoryId) {
        categoryId = guess.categoryId;
        contactId = contactId ?? guess.contactId;
        guessed = true;
      }
    }
    const costCenterId = type === "TRANSFER" ? null : optStr(form, "costCenterId");
    const notes = optStr(form, "notes");
    await assertOwned(workspace.id, { accountId, transferAccountId, categoryId, contactId, costCenterId });

    const base = {
      type,
      description,
      accountId,
      transferAccountId,
      categoryId,
      contactId,
      costCenterId,
      notes,
      status: paid ? ("PAID" as const) : ("PENDING" as const),
    };

    if (id) {
      const existing = await prisma.transaction.findFirst({ where: { id, workspaceId: workspace.id } });
      if (!existing) throw new ValidationError("Lançamento não encontrado.");
      await prisma.transaction.update({
        where: { id },
        data: { ...base, amount, date: toDate(when), paidAt: paid ? (existing.paidAt ?? toDate(todayISO())) : null },
      });
      return "Lançamento atualizado.";
    }

    const installments = type === "TRANSFER" ? 1 : int(form, "installments", 1, 120, 1);
    if (installments > 1) {
      const group = randomUUID();
      const part = round2(Math.floor((amount / installments) * 100) / 100);
      const first = round2(amount - part * (installments - 1));
      const day = Number(when.slice(8, 10));
      await prisma.transaction.createMany({
        data: Array.from({ length: installments }, (_, i) => {
          const d = addMonths(when, i, day);
          const isPaid = paid && i === 0;
          return {
            ...base,
            workspaceId: workspace.id,
            createdById: user.id,
            description: `${description} (${i + 1}/${installments})`,
            amount: i === 0 ? first : part,
            date: toDate(d),
            status: isPaid ? ("PAID" as const) : ("PENDING" as const),
            paidAt: isPaid ? toDate(d) : null,
            installmentGroup: group,
            installmentNumber: i + 1,
            installmentTotal: installments,
          };
        }),
      });
      return `${installments} parcelas criadas.`;
    }

    await prisma.transaction.create({
      data: { ...base, workspaceId: workspace.id, createdById: user.id, amount, date: toDate(when), paidAt: paid ? toDate(when) : null },
    });
    if (type === "TRANSFER") return "Transferência registrada.";
    return guessed ? "Lançamento criado e categorizado com base no histórico." : "Lançamento criado.";
  });
}

export async function toggleTransactionStatus(_: ActionState, form: FormData) {
  return runAction(async () => {
    const { workspace } = await requireRole("MEMBER");
    const id = str(form, "id", { required: "Lançamento inválido." });
    const existing = await prisma.transaction.findFirst({ where: { id, workspaceId: workspace.id } });
    if (!existing) throw new ValidationError("Lançamento não encontrado.");
    const paid = existing.status === "PENDING";
    await prisma.transaction.update({
      where: { id },
      data: { status: paid ? "PAID" : "PENDING", paidAt: paid ? toDate(todayISO()) : null },
    });
    return paid ? "Marcado como pago." : "Marcado como pendente.";
  });
}

export async function deleteTransaction(_: ActionState, form: FormData) {
  return runAction(async () => {
    const { workspace } = await requireRole("MEMBER");
    const id = str(form, "id", { required: "Lançamento inválido." });
    const scope = oneOf(form, "scope", ["one", "group"] as const, "one");
    const existing = await prisma.transaction.findFirst({ where: { id, workspaceId: workspace.id } });
    if (!existing) throw new ValidationError("Lançamento não encontrado.");
    if (scope === "group" && existing.installmentGroup) {
      const { count } = await prisma.transaction.deleteMany({ where: { workspaceId: workspace.id, installmentGroup: existing.installmentGroup } });
      return `${count} parcelas excluídas.`;
    }
    await prisma.transaction.delete({ where: { id } });
    return "Lançamento excluído.";
  });
}

export async function duplicateTransaction(_: ActionState, form: FormData) {
  return runAction(async () => {
    const { workspace, user } = await requireRole("MEMBER");
    const id = str(form, "id", { required: "Lançamento inválido." });
    const t = await prisma.transaction.findFirst({ where: { id, workspaceId: workspace.id } });
    if (!t) throw new ValidationError("Lançamento não encontrado.");
    await prisma.transaction.create({
      data: {
        workspaceId: workspace.id,
        createdById: user.id,
        type: t.type,
        description: t.description.replace(/\s\(\d+\/\d+\)$/, ""),
        amount: t.amount,
        date: toDate(todayISO()),
        status: "PENDING",
        accountId: t.accountId,
        transferAccountId: t.transferAccountId,
        categoryId: t.categoryId,
        contactId: t.contactId,
        costCenterId: t.costCenterId,
        notes: t.notes,
      },
    });
    return "Lançamento duplicado para hoje (pendente).";
  });
}

export async function bulkTransactions(_: ActionState, form: FormData) {
  return runAction(async () => {
    const { workspace } = await requireRole("MEMBER");
    const ids = form.getAll("ids").map(String).filter(Boolean).slice(0, 500);
    const op = oneOf(form, "op", ["pay", "delete", "categorize"] as const);
    if (!ids.length) throw new ValidationError("Selecione ao menos um lançamento.");
    const where: Prisma.TransactionWhereInput = { workspaceId: workspace.id, id: { in: ids } };
    if (op === "categorize") {
      const categoryId = str(form, "categoryId", { required: "Escolha a categoria." });
      const category = await prisma.category.findFirst({ where: { id: categoryId, workspaceId: workspace.id } });
      if (!category) throw new ValidationError("Categoria inválida.");
      const { count } = await prisma.transaction.updateMany({ where: { ...where, type: category.kind }, data: { categoryId } });
      const skipped = ids.length - count;
      return `${count} lançamento(s) movido(s) para ${category.name}${skipped ? `; ${skipped} ignorado(s) por serem de outro tipo` : ""}.`;
    }
    if (op === "delete") {
      const { count } = await prisma.transaction.deleteMany({ where });
      return `${count} lançamento(s) excluído(s).`;
    }
    const { count } = await prisma.transaction.updateMany({
      where: { ...where, status: "PENDING" },
      data: { status: "PAID", paidAt: toDate(todayISO()) },
    });
    return `${count} lançamento(s) marcado(s) como pago(s).`;
  });
}

type ImportRow = { date: string; description: string; amount: string; category?: string };

/** Importa linhas de extrato CSV já interpretadas no cliente. */
export async function importTransactions(_: ActionState, form: FormData) {
  return runAction(async () => {
    const { workspace, user } = await requireRole("MEMBER");
    const accountId = str(form, "accountId", { required: "Selecione a conta de destino." });
    await assertOwned(workspace.id, { accountId });
    let rows: ImportRow[];
    try {
      rows = JSON.parse(String(form.get("rows") ?? "[]"));
    } catch {
      throw new ValidationError("Arquivo inválido.");
    }
    if (!Array.isArray(rows) || !rows.length) throw new ValidationError("Nenhuma linha válida encontrada.");
    if (rows.length > 2000) throw new ValidationError("Importe no máximo 2.000 linhas por vez.");

    const [categories, guess] = await Promise.all([
      prisma.category.findMany({ where: { workspaceId: workspace.id } }),
      buildCategoryGuesser(workspace.id),
    ]);
    const findCategory = (name: string | undefined, kind: "INCOME" | "EXPENSE") =>
      name ? categories.find((c) => c.kind === kind && c.name.toLowerCase() === name.trim().toLowerCase())?.id ?? null : null;

    const data: Prisma.TransactionCreateManyInput[] = [];
    let skipped = 0;
    let duplicates = 0;
    let categorized = 0;
    const parsedDates = rows.map((r) => parseFlexibleDate(String(r.date ?? ""))).filter((d): d is string => !!d).sort();
    // Lançamentos já existentes na conta no período do arquivo (evita importar o mesmo extrato duas vezes).
    const existing = parsedDates.length
      ? await prisma.transaction.findMany({
          where: { workspaceId: workspace.id, accountId, date: { gte: toDate(parsedDates[0]), lte: toDate(parsedDates[parsedDates.length - 1]) } },
          select: { date: true, amount: true, type: true, description: true },
        })
      : [];
    const seen = new Set(existing.map((t) => `${t.date.toISOString().slice(0, 10)}|${t.type}|${Number(t.amount).toFixed(2)}|${t.description.trim().toLowerCase()}`));
    for (const row of rows) {
      const iso = parseFlexibleDate(String(row.date ?? ""));
      const value = parseMoney(String(row.amount ?? ""));
      const description = String(row.description ?? "").trim().slice(0, 160);
      if (!iso || !Number.isFinite(value) || value === 0 || !description) {
        skipped++;
        continue;
      }
      const type = value > 0 ? "INCOME" : "EXPENSE";
      const key = `${iso}|${type}|${Math.abs(value).toFixed(2)}|${description.toLowerCase()}`;
      if (seen.has(key)) {
        duplicates++;
        continue;
      }
      seen.add(key);
      let categoryId = findCategory(row.category, type);
      let contactId: string | null = null;
      if (!categoryId) {
        const g = guess(description, type);
        if (g?.categoryId) {
          categoryId = g.categoryId;
          contactId = g.contactId;
          categorized++;
        }
      }
      data.push({
        workspaceId: workspace.id,
        createdById: user.id,
        accountId,
        type,
        status: "PAID",
        description,
        amount: round2(Math.abs(value)),
        date: toDate(iso),
        paidAt: toDate(iso),
        categoryId,
        contactId,
      });
    }
    if (!data.length) {
      if (duplicates) throw new ValidationError(`Todas as ${duplicates} linha(s) já estavam lançadas nesta conta.`);
      throw new ValidationError("Nenhuma linha válida encontrada. Verifique as colunas data, descrição e valor.");
    }
    await prisma.transaction.createMany({ data });
    const parts = [`${data.length} lançamento(s) importado(s)`];
    if (categorized) parts.push(`${categorized} categorizado(s) pelo histórico`);
    if (duplicates) parts.push(`${duplicates} duplicado(s) ignorado(s)`);
    if (skipped) parts.push(`${skipped} linha(s) inválida(s)`);
    return `${parts.join(", ")}.`;
  });
}
