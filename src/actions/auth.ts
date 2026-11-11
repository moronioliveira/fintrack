"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createSession, destroySession, setActiveWorkspaceCookie } from "@/lib/session";
import { createWorkspace } from "@/lib/workspace";
import type { ActionState } from "@/lib/action";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function loginAction(_: ActionState, form: FormData): Promise<ActionState> {
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");
  if (!EMAIL_RE.test(email) || !password) return { ok: false, error: "Informe e-mail e senha.", at: Date.now() };

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return { ok: false, error: "E-mail ou senha inválidos.", at: Date.now() };
    }
    await createSession(user.id);
  } catch (error) {
    console.error("Falha ao realizar login:", error);
    return { ok: false, error: "Não foi possível entrar agora. Tente novamente.", at: Date.now() };
  }
  redirect("/");
}

export async function registerAction(_: ActionState, form: FormData): Promise<ActionState> {
  const name = String(form.get("name") ?? "").trim();
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");
  const usage = form.get("usage") === "BUSINESS" ? "BUSINESS" : "PERSONAL";
  const company = String(form.get("company") ?? "").trim();

  if (name.length < 2) return { ok: false, error: "Informe seu nome.", at: Date.now() };
  if (!EMAIL_RE.test(email)) return { ok: false, error: "Informe um e-mail válido.", at: Date.now() };
  if (password.length < 8) return { ok: false, error: "A senha deve ter pelo menos 8 caracteres.", at: Date.now() };
  if (usage === "BUSINESS" && company.length < 2) return { ok: false, error: "Informe o nome da empresa.", at: Date.now() };

  try {
    if (await prisma.user.findUnique({ where: { email } })) {
      return { ok: false, error: "Este e-mail já está cadastrado.", at: Date.now() };
    }
    const passwordHash = await bcrypt.hash(password, 12);
    const workspaceId = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({ data: { name, email, passwordHash } });
      const workspace = await createWorkspace(
        user.id,
        usage === "BUSINESS"
          ? { name: company, type: "BUSINESS" }
          : { name: `Finanças de ${name.split(" ")[0]}`, type: "PERSONAL" },
        tx,
      );
      return { userId: user.id, workspaceId: workspace.id };
    });
    await createSession(workspaceId.userId);
    await setActiveWorkspaceCookie(workspaceId.workspaceId);
  } catch (error) {
    console.error("Falha ao criar conta:", error);
    return { ok: false, error: "Não foi possível criar a conta agora.", at: Date.now() };
  }
  redirect("/");
}

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}
