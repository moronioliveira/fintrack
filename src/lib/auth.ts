import { cache } from "react";
import { redirect } from "next/navigation";
import type { Role } from "@prisma/client";
import { prisma } from "./prisma";
import { getActiveWorkspaceCookie, getSessionUserId } from "./session";
import { ensureUserWorkspace } from "./legacy-import";
import { materializeRecurring } from "./recurring";

export const getCurrentUser = cache(async () => {
  const userId = await getSessionUserId();
  if (!userId) redirect("/sair");
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true },
  });
  if (!user) redirect("/sair");
  return user;
});

/**
 * Contexto do espaço de trabalho ativo. Centraliza a checagem de sessão e de
 * associação (Data Access Layer): toda leitura/escrita passa por aqui.
 */
export const getContext = cache(async () => {
  const user = await getCurrentUser();
  const fallbackId = await ensureUserWorkspace(user.id, user.name);
  const preferred = await getActiveWorkspaceCookie();

  const memberships = await prisma.membership.findMany({
    where: { userId: user.id },
    include: { workspace: { select: { id: true, name: true, type: true, currency: true, document: true } } },
    orderBy: { createdAt: "asc" },
  });

  const active =
    memberships.find((m) => m.workspaceId === preferred) ??
    memberships.find((m) => m.workspaceId === fallbackId) ??
    memberships[0];
  if (!active) redirect("/sair");

  await materializeRecurring(active.workspaceId);

  return {
    user,
    workspace: active.workspace,
    role: active.role,
    workspaces: memberships.map((m) => ({ ...m.workspace, role: m.role })),
  };
});

export type AppContext = Awaited<ReturnType<typeof getContext>>;

const RANK: Record<Role, number> = { VIEWER: 0, MEMBER: 1, ADMIN: 2, OWNER: 3 };

export function hasRole(role: Role, minimum: Role) {
  return RANK[role] >= RANK[minimum];
}

export class PermissionError extends Error {}

/** Para Server Actions: retorna o contexto ou lança erro se o papel for insuficiente. */
export async function requireRole(minimum: Role) {
  const ctx = await getContext();
  if (!hasRole(ctx.role, minimum)) {
    throw new PermissionError("Você não tem permissão para esta ação neste espaço.");
  }
  return ctx;
}
