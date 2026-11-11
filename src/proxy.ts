import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE, WORKSPACE_COOKIE, verifySession } from "@/lib/jwt";

const PUBLIC_PATHS = ["/login", "/cadastro"];

// Verificação otimista do token. A autorização real (usuário existe, é membro do
// espaço etc.) acontece no servidor, em lib/auth.ts e em cada Server Action.
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname === "/sair") return NextResponse.next();

  const userId = await verifySession(request.cookies.get(SESSION_COOKIE)?.value);
  const isPublic = PUBLIC_PATHS.includes(pathname);

  if (!isPublic && !userId) {
    const response = NextResponse.redirect(new URL("/login", request.url));
    response.cookies.delete(SESSION_COOKIE);
    response.cookies.delete(WORKSPACE_COOKIE);
    return response;
  }
  if (isPublic && userId) {
    return NextResponse.redirect(new URL("/", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|ico)$).*)"],
};
