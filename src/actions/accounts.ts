"use server";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { runAction, ValidationError, type ActionState } from "@/lib/action";
import { bool, money, oneOf, optStr, str } from "@/lib/form";
import { ACCOUNT_TYPES } from "@/lib/constants";
import type { AccountType } from "@prisma/client";

const TYPES = Object.keys(ACCOUNT_TYPES) as AccountType[];

export async function saveAccount(_: ActionState, form: FormData) {
  return runAction(async () => {
    const { workspace } = await requireRole("ADMIN");
    const id = optStr(form, "id");
    const type = oneOf(form, "type", TYPES);
    const data = {
      name: str(form, "name", { required: "Informe o nome da conta.", max: 60 }),
      type,
      color: str(form, "color") || "#6366f1",
      initialBalance: money(form, "initialBalance", { allowZero: true, allowNegative: true, label: "Saldo inicial" }),
      creditLimit: type === "CREDIT_CARD" && String(form.get("creditLimit") ?? "").trim()
        ? money(form, "creditLimit", { allowZero: true, label: "Limite" })
        : null,
      archived: bool(form, "archived"),
    };
    if (id) {
      const { count } = await prisma.account.updateMany({ where: { id, workspaceId: workspace.id }, data });
      if (!count) throw new ValidationError("Conta não encontrada.");
      return "Conta atualizada.";
    }
    await prisma.account.create({ data: { ...data, workspaceId: workspace.id } });
    return "Conta criada.";
  });
}

export async function deleteAccount(_: ActionState, form: FormData) {
  return runAction(async () => {
    const { workspace } = await requireRole("ADMIN");
    const id = str(form, "id", { required: "Conta inválida." });
    const used = await prisma.transaction.count({
      where: { workspaceId: workspace.id, OR: [{ accountId: id }, { transferAccountId: id }] },
    });
    if (used) throw new ValidationError(`Esta conta possui ${used} lançamento(s). Arquive-a em vez de excluir.`);
    const remaining = await prisma.account.count({ where: { workspaceId: workspace.id } });
    if (remaining <= 1) throw new ValidationError("O espaço precisa ter ao menos uma conta.");
    await prisma.account.deleteMany({ where: { id, workspaceId: workspace.id } });
    return "Conta excluída.";
  });
}
