"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getContext, getCurrentUser, requireRole } from "@/lib/auth";
import { runAction, ValidationError, type ActionState } from "@/lib/action";
import { oneOf, optStr, str } from "@/lib/form";
import { setActiveWorkspaceCookie } from "@/lib/session";
import { createWorkspace } from "@/lib/workspace";

export async function switchWorkspace(workspaceId: string) {
  const user = await getCurrentUser();
  const membership = await prisma.membership.findUnique({ where: { userId_workspaceId: { userId: user.id, workspaceId } } });
  if (!membership) return;
  await setActiveWorkspaceCookie(workspaceId);
  revalidatePath("/", "layout");
  redirect("/");
}

export async function createWorkspaceAction(_: ActionState, form: FormData): Promise<ActionState> {
  const user = await getCurrentUser();
  let id: string;
  try {
    const name = str(form, "name", { required: "Informe o nome do espaço.", max: 80 });
    const type = oneOf(form, "type", ["PERSONAL", "BUSINESS"] as const);
    const currency = oneOf(form, "currency", ["BRL", "USD", "EUR"] as const, "BRL");
    const workspace = await createWorkspace(user.id, { name, type, currency, document: optStr(form, "document") });
    id = workspace.id;
  } catch (error) {
    if (error instanceof ValidationError) return { ok: false, error: error.message, at: Date.now() };
    console.error(error);
    return { ok: false, error: "Não foi possível criar o espaço.", at: Date.now() };
  }
  await setActiveWorkspaceCookie(id);
  revalidatePath("/", "layout");
  redirect("/");
}

export async function updateWorkspace(_: ActionState, form: FormData) {
  return runAction(async () => {
    const { workspace } = await requireRole("ADMIN");
    await prisma.workspace.update({
      where: { id: workspace.id },
      data: {
        name: str(form, "name", { required: "Informe o nome do espaço.", max: 80 }),
        type: oneOf(form, "type", ["PERSONAL", "BUSINESS"] as const),
        currency: oneOf(form, "currency", ["BRL", "USD", "EUR"] as const),
        document: optStr(form, "document"),
      },
    });
    return "Espaço atualizado.";
  });
}

export async function deleteWorkspace(_: ActionState, form: FormData): Promise<ActionState> {
  const { workspace, workspaces } = await getContext();
  const result = await runAction(async () => {
    await requireRole("OWNER");
    if (str(form, "confirm") !== workspace.name) throw new ValidationError("Digite o nome do espaço exatamente para confirmar.");
    if (workspaces.length <= 1) throw new ValidationError("Você precisa ter pelo menos um espaço. Crie outro antes de excluir este.");
    await prisma.workspace.delete({ where: { id: workspace.id } });
  });
  if (!result.ok) return result;
  const next = workspaces.find((w) => w.id !== workspace.id)!;
  await setActiveWorkspaceCookie(next.id);
  redirect("/");
}

export async function addMember(_: ActionState, form: FormData) {
  return runAction(async () => {
    const { workspace } = await requireRole("ADMIN");
    const email = str(form, "email", { required: "Informe o e-mail." }).toLowerCase();
    const role = oneOf(form, "role", ["ADMIN", "MEMBER", "VIEWER"] as const);
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new ValidationError("Nenhum usuário com esse e-mail. Peça para a pessoa criar uma conta no FinTrack primeiro.");
    const exists = await prisma.membership.findUnique({ where: { userId_workspaceId: { userId: user.id, workspaceId: workspace.id } } });
    if (exists) throw new ValidationError("Essa pessoa já faz parte do espaço.");
    await prisma.membership.create({ data: { userId: user.id, workspaceId: workspace.id, role } });
    return `${user.name} foi adicionado(a) ao espaço.`;
  });
}

export async function updateMemberRole(_: ActionState, form: FormData) {
  return runAction(async () => {
    const { workspace, user } = await requireRole("ADMIN");
    const id = str(form, "id");
    const role = oneOf(form, "role", ["ADMIN", "MEMBER", "VIEWER"] as const);
    const member = await prisma.membership.findFirst({ where: { id, workspaceId: workspace.id } });
    if (!member) throw new ValidationError("Membro não encontrado.");
    if (member.role === "OWNER") throw new ValidationError("O papel do proprietário não pode ser alterado.");
    if (member.userId === user.id) throw new ValidationError("Você não pode alterar o próprio papel.");
    await prisma.membership.update({ where: { id }, data: { role } });
    return "Permissão atualizada.";
  });
}

export async function removeMember(_: ActionState, form: FormData) {
  return runAction(async () => {
    const { workspace, user } = await requireRole("ADMIN");
    const id = str(form, "id");
    const member = await prisma.membership.findFirst({ where: { id, workspaceId: workspace.id } });
    if (!member) throw new ValidationError("Membro não encontrado.");
    if (member.role === "OWNER") throw new ValidationError("O proprietário não pode ser removido.");
    if (member.userId === user.id) throw new ValidationError("Use “Sair do espaço” para remover a si mesmo.");
    await prisma.membership.delete({ where: { id } });
    return "Membro removido.";
  });
}

export async function leaveWorkspace(_: ActionState, form: FormData): Promise<ActionState> {
  void form;
  const { workspace, role, user, workspaces } = await getContext();
  if (role === "OWNER") return { ok: false, error: "O proprietário não pode sair do próprio espaço.", at: Date.now() };
  if (workspaces.length <= 1) return { ok: false, error: "Este é seu único espaço.", at: Date.now() };
  await prisma.membership.delete({ where: { userId_workspaceId: { userId: user.id, workspaceId: workspace.id } } });
  await setActiveWorkspaceCookie(workspaces.find((w) => w.id !== workspace.id)!.id);
  redirect("/");
}

export async function updateProfile(_: ActionState, form: FormData) {
  return runAction(async () => {
    const user = await getCurrentUser();
    const name = str(form, "name", { required: "Informe seu nome.", max: 80 });
    if (name.length < 2) throw new ValidationError("Informe seu nome.");
    await prisma.user.update({ where: { id: user.id }, data: { name } });
    return "Perfil atualizado.";
  });
}

export async function changePassword(_: ActionState, form: FormData) {
  return runAction(async () => {
    const { id } = await getCurrentUser();
    const current = String(form.get("current") ?? "");
    const next = String(form.get("next") ?? "");
    const confirm = String(form.get("confirm") ?? "");
    const user = await prisma.user.findUniqueOrThrow({ where: { id } });
    if (!(await bcrypt.compare(current, user.passwordHash))) throw new ValidationError("Senha atual incorreta.");
    if (next.length < 8) throw new ValidationError("A nova senha deve ter pelo menos 8 caracteres.");
    if (next !== confirm) throw new ValidationError("A confirmação não confere.");
    await prisma.user.update({ where: { id }, data: { passwordHash: await bcrypt.hash(next, 12) } });
    return "Senha alterada.";
  });
}
