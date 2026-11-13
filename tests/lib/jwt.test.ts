import { afterEach, describe, expect, it, vi } from "vitest";
import { SignJWT } from "jose";
import { signSession, verifySession, SESSION_MAX_AGE } from "@/lib/jwt";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.useRealTimers();
});

describe("sessão (JWT)", () => {
  it("assina e lê de volta o id do usuário", async () => {
    vi.stubEnv("SESSION_SECRET", "segredo-de-teste-bem-comprido-123456");
    const token = await signSession("user_1");
    expect(await verifySession(token)).toBe("user_1");
  });

  it("recusa token adulterado", async () => {
    vi.stubEnv("SESSION_SECRET", "segredo-de-teste-bem-comprido-123456");
    const token = await signSession("user_1");
    const [h, p, s] = token.split(".");
    const forged = Buffer.from(JSON.stringify({ userId: "admin", iat: 1 })).toString("base64url");
    expect(await verifySession(`${h}.${forged}.${s}`)).toBeNull();
    expect(await verifySession(`${h}.${p}.${s.slice(0, -2)}xx`)).toBeNull();
  });

  it("recusa token assinado com outro segredo", async () => {
    const other = await new SignJWT({ userId: "user_1" })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("1h")
      .sign(new TextEncoder().encode("outro-segredo-qualquer-0000000000"));
    vi.stubEnv("SESSION_SECRET", "segredo-de-teste-bem-comprido-123456");
    expect(await verifySession(other)).toBeNull();
  });

  it("expira depois de 7 dias", async () => {
    vi.stubEnv("SESSION_SECRET", "segredo-de-teste-bem-comprido-123456");
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-11-01T12:00:00Z"));
    const token = await signSession("user_1");
    vi.setSystemTime(new Date(Date.now() + (SESSION_MAX_AGE - 60) * 1000));
    expect(await verifySession(token)).toBe("user_1");
    vi.setSystemTime(new Date(Date.now() + 120 * 1000));
    expect(await verifySession(token)).toBeNull();
  });

  it("sem token ou com lixo, não autentica", async () => {
    expect(await verifySession(undefined)).toBeNull();
    expect(await verifySession("")).toBeNull();
    expect(await verifySession("abc.def.ghi")).toBeNull();
  });

  it("em produção, recusa funcionar sem SESSION_SECRET", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("SESSION_SECRET", undefined);
    await expect(signSession("user_1")).rejects.toThrow("SESSION_SECRET");
  });
});
