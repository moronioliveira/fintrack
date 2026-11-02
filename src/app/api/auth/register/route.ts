import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/session";
import { defaultData } from "@/lib/default-data";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body?.password === "string" ? body.password : "";

  if (name.length < 2 || !email.includes("@") || password.length < 8) {
    return NextResponse.json({ error: "Informe nome, e-mail válido e senha com pelo menos 8 caracteres." }, { status: 400 });
  }

  try {
    if (await prisma.user.findUnique({ where: { email } })) {
      return NextResponse.json({ error: "Este e-mail já está cadastrado." }, { status: 409 });
    }

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash: await bcrypt.hash(password, 12),
        data: { create: { payload: JSON.stringify(defaultData) } },
      },
    });
    await createSession(user.id);
    return NextResponse.json({ user: { id: user.id, name: user.name, email: user.email, currency: user.currency, theme: user.theme } }, { status: 201 });
  } catch (error) {
    console.error("Falha ao criar conta:", error);
    return NextResponse.json({ error: "Não foi possível criar a conta agora." }, { status: 500 });
  }
}
