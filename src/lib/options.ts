import { cache } from "react";
import { prisma } from "./prisma";

/** Opções usadas pelos formulários de lançamento (contas, categorias, contatos...). */
export const getFormOptions = cache(async (workspaceId: string) => {
  const [accounts, categories, contacts, costCenters] = await Promise.all([
    prisma.account.findMany({ where: { workspaceId, archived: false }, select: { id: true, name: true, color: true, type: true }, orderBy: { createdAt: "asc" } }),
    prisma.category.findMany({ where: { workspaceId, archived: false }, select: { id: true, name: true, kind: true, color: true, icon: true }, orderBy: { name: "asc" } }),
    prisma.contact.findMany({ where: { workspaceId }, select: { id: true, name: true, type: true }, orderBy: { name: "asc" } }),
    prisma.costCenter.findMany({ where: { workspaceId }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);
  return { accounts, categories, contacts, costCenters };
});

export type FormOptions = Awaited<ReturnType<typeof getFormOptions>>;
