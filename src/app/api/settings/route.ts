import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/session";

export async function PUT(request: Request) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  const body = await request.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const currency = typeof body?.currency === "string" ? body.currency : "";
  const theme = typeof body?.theme === "string" ? body.theme : "";
  const newPassword = typeof body?.newPassword === "string" ? body.newPassword : "";
  if (name.length < 2 || !["BRL", "USD", "EUR"].includes(currency) || !["dark", "light"].includes(theme)) {
    return NextResponse.json({ error: "Revise os dados do perfil." }, { status: 400 });
  }
  const data: { name: string; currency: string; theme: string; passwordHash?: string } = { name, currency, theme };
  if (newPassword) {
    if (newPassword.length < 8) return NextResponse.json({ error: "A nova senha deve ter pelo menos 8 caracteres." }, { status: 400 });
    data.passwordHash = await bcrypt.hash(newPassword, 12);
  }
  const user = await prisma.user.update({ where: { id: userId }, data, select: { id: true, name: true, email: true, currency: true, theme: true } });
  return NextResponse.json({ user });
}
