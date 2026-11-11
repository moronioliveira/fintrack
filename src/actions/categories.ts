"use server";

import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { runAction, ValidationError, type ActionState } from "@/lib/action";
import { oneOf, optStr, str } from "@/lib/form";

export async function saveCategory(_: ActionState, form: FormData) {
  return runAction(async () => {
    const { workspace } = await requireRole("MEMBER");
    const id = optStr(form, "id");
    const data = {
      name: str(form, "name", { required: "Informe o nome da categoria.", max: 50 }),
      kind: oneOf(form, "kind", ["INCOME", "EXPENSE"] as const),
      color: str(form, "color") || "#64748b",
      icon: str(form, "icon") || "Tag",
    };
    try {
      if (id) {
        const { count } = await prisma.category.updateMany({ where: { id, workspaceId: workspace.id }, data });
        if (!count) throw new ValidationError("Categoria não encontrada.");
        return "Categoria atualizada.";
      }
      await prisma.category.create({ data: { ...data, workspaceId: workspace.id } });
      return "Categoria criada.";
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new ValidationError("Já existe uma categoria com esse nome.");
      }
      throw error;
    }
  });
}

export async function deleteCategory(_: ActionState, form: FormData) {
  return runAction(async () => {
    const { workspace } = await requireRole("MEMBER");
    const id = str(form, "id", { required: "Categoria inválida." });
    const used = await prisma.transaction.count({ where: { workspaceId: workspace.id, categoryId: id } });
    await prisma.category.deleteMany({ where: { id, workspaceId: workspace.id } });
    return used ? `Categoria excluída. ${used} lançamento(s) ficaram sem categoria.` : "Categoria excluída.";
  });
}
