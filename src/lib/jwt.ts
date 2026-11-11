import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE = "fintrack_session";
export const WORKSPACE_COOKIE = "fintrack_ws";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7;

function getSecret() {
  const value = process.env.SESSION_SECRET;
  if (!value && process.env.NODE_ENV === "production") {
    throw new Error("SESSION_SECRET não está configurada.");
  }
  return new TextEncoder().encode(value ?? "development-only-fintrack-secret-change-me");
}

export async function signSession(userId: string) {
  return new SignJWT({ userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(getSecret());
}

export async function verifySession(token: string | undefined) {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return typeof payload.userId === "string" ? payload.userId : null;
  } catch {
    return null;
  }
}
