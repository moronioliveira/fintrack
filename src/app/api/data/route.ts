import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { defaultData, type PersistedData } from "@/lib/default-data";
import { getSessionUserId } from "@/lib/session";

async function authenticatedUser() {
  const userId = await getSessionUserId();
  return userId ? prisma.user.findUnique({ where: { id: userId }, include: { data: true } }) : null;
}

export async function GET() {
  const user = await authenticatedUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  const data = user.data ? JSON.parse(user.data.payload) as PersistedData : defaultData;
  return NextResponse.json(data);
}

export async function PUT(request: Request) {
  const user = await authenticatedUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  const data = await request.json().catch(() => null);
  if (!data || !Array.isArray(data.transacoes) || !Array.isArray(data.categorias)) {
    return NextResponse.json({ error: "Dados financeiros inválidos." }, { status: 400 });
  }
  await prisma.userData.upsert({
    where: { userId: user.id },
    create: { userId: user.id, payload: JSON.stringify(data) },
    update: { payload: JSON.stringify(data) },
  });
  return NextResponse.json({ ok: true });
}
