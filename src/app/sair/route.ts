import { NextResponse } from "next/server";
import { SESSION_COOKIE, WORKSPACE_COOKIE } from "@/lib/jwt";

// Encerra sessões inválidas (ex.: usuário removido) sem causar loop de redirecionamento.
export function GET(request: Request) {
  const response = NextResponse.redirect(new URL("/login", request.url));
  response.cookies.delete(SESSION_COOKIE);
  response.cookies.delete(WORKSPACE_COOKIE);
  return response;
}
