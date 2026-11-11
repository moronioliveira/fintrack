import { cookies } from "next/headers";
import { SESSION_COOKIE, SESSION_MAX_AGE, WORKSPACE_COOKIE, signSession, verifySession } from "./jwt";

const cookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
};

export async function createSession(userId: string) {
  const token = await signSession(userId);
  (await cookies()).set(SESSION_COOKIE, token, { ...cookieOptions, maxAge: SESSION_MAX_AGE });
}

export async function getSessionUserId() {
  return verifySession((await cookies()).get(SESSION_COOKIE)?.value);
}

export async function destroySession() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
  store.delete(WORKSPACE_COOKIE);
}

export async function getActiveWorkspaceCookie() {
  return (await cookies()).get(WORKSPACE_COOKIE)?.value ?? null;
}

export async function setActiveWorkspaceCookie(workspaceId: string) {
  (await cookies()).set(WORKSPACE_COOKIE, workspaceId, { ...cookieOptions, maxAge: 60 * 60 * 24 * 365 });
}
