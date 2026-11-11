"use server";

import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { runAction, ValidationError, type ActionState } from "@/lib/action";
import { oneOf, optStr, str } from "@/lib/form";

export async function saveContact(_: ActionState, form: FormData) {
  return runAction(async () => {
    const { workspace } = await requireRole("MEMBER");
    const id = optStr(form, "id");
    const email = optStr(form, "email");
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new ValidationError("E-mail inválido.");
    const data = {
      name: str(form, "name", { required: "Informe o nome.", max: 120 }),
      type: oneOf(form, "type", ["CUSTOMER", "SUPPLIER", "BOTH"] as const),
      document: optStr(form, "document"),
      email,
      phone: optStr(form, "phone"),
      notes: optStr(form, "notes"),
    };
    if (id) {
      const { count } = await prisma.contact.updateMany({ where: { id, workspaceId: workspace.id }, data });
      if (!count) throw new ValidationError("Contato não encontrado.");
      return "Contato atualizado.";
    }
    await prisma.contact.create({ data: { ...data, workspaceId: workspace.id } });
    return "Contato criado.";
  });
}

export async function deleteContact(_: ActionState, form: FormData) {
  return runAction(async () => {
    const { workspace } = await requireRole("MEMBER");
    const id = str(form, "id", { required: "Contato inválido." });
    await prisma.contact.deleteMany({ where: { id, workspaceId: workspace.id } });
    return "Contato excluído.";
  });
}

export async function saveCostCenter(_: ActionState, form: FormData) {
  return runAction(async () => {
    const { workspace } = await requireRole("ADMIN");
    const id = optStr(form, "id");
    const name = str(form, "name", { required: "Informe o nome do centro de custo.", max: 60 });
    try {
      if (id) {
        await prisma.costCenter.updateMany({ where: { id, workspaceId: workspace.id }, data: { name } });
        return "Centro de custo atualizado.";
      }
      await prisma.costCenter.create({ data: { name, workspaceId: workspace.id } });
      return "Centro de custo criado.";
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new ValidationError("Já existe um centro de custo com esse nome.");
      }
      throw error;
    }
  });
}

export async function deleteCostCenter(_: ActionState, form: FormData) {
  return runAction(async () => {
    const { workspace } = await requireRole("ADMIN");
    const id = str(form, "id", { required: "Centro de custo inválido." });
    await prisma.costCenter.deleteMany({ where: { id, workspaceId: workspace.id } });
    return "Centro de custo excluído.";
  });
}
