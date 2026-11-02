import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const isPublic = request.nextUrl.pathname === "/login" || request.nextUrl.pathname.startsWith("/api/auth");
  if (!isPublic && !request.cookies.has("fintrack_session")) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  if (request.nextUrl.pathname === "/login" && request.cookies.has("fintrack_session")) {
    return NextResponse.redirect(new URL("/", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
