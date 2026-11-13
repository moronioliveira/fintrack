import { beforeEach, describe, expect, it, vi } from "vitest";

const m = vi.hoisted(() => ({ verifySession: vi.fn() }));

// Resposta mínima no formato do NextResponse, para inspecionar o resultado.
vi.mock("next/server", () => {
  const make = (kind: string, location?: string) => {
    const deleted: string[] = [];
    return { kind, location, deleted, cookies: { delete: (name: string) => deleted.push(name) } };
  };
  return {
    NextResponse: {
      next: () => make("next"),
      redirect: (url: URL) => make("redirect", url.pathname),
    },
  };
});
vi.mock("@/lib/jwt", () => ({ SESSION_COOKIE: "fintrack_session", WORKSPACE_COOKIE: "fintrack_ws", verifySession: m.verifySession }));

import { config, proxy } from "@/proxy";

type Res = { kind: string; location?: string; deleted: string[] };
const req = (path: string, token?: string) =>
  ({
    nextUrl: { pathname: path },
    url: `https://fintrack.test${path}`,
    cookies: { get: (name: string) => (name === "fintrack_session" && token ? { value: token } : undefined) },
  }) as never;

beforeEach(() => vi.clearAllMocks());

describe("proteção de rotas", () => {
  it("visitante sem sessão vai para /login e os cookies são limpos", async () => {
    m.verifySession.mockResolvedValue(null);
    const res = (await proxy(req("/lancamentos"))) as unknown as Res;
    expect(res).toMatchObject({ kind: "redirect", location: "/login" });
    expect(res.deleted).toEqual(["fintrack_session", "fintrack_ws"]);
  });

  it("token inválido também vai para /login", async () => {
    m.verifySession.mockResolvedValue(null);
    const res = (await proxy(req("/", "token-falso"))) as unknown as Res;
    expect(m.verifySession).toHaveBeenCalledWith("token-falso");
    expect(res.location).toBe("/login");
  });

  it("logado acessa as páginas do app", async () => {
    m.verifySession.mockResolvedValue("user_1");
    expect(((await proxy(req("/agenda", "ok"))) as unknown as Res).kind).toBe("next");
  });

  it("logado que abre /login ou /cadastro volta para a visão geral", async () => {
    m.verifySession.mockResolvedValue("user_1");
    expect(((await proxy(req("/login", "ok"))) as unknown as Res).location).toBe("/");
    expect(((await proxy(req("/cadastro", "ok"))) as unknown as Res).location).toBe("/");
  });

  it("login e cadastro ficam abertos para visitantes; /sair sempre passa", async () => {
    m.verifySession.mockResolvedValue(null);
    expect(((await proxy(req("/login"))) as unknown as Res).kind).toBe("next");
    expect(((await proxy(req("/cadastro"))) as unknown as Res).kind).toBe("next");
    expect(((await proxy(req("/sair"))) as unknown as Res).kind).toBe("next");
  });
});

describe("arquivos públicos do app instalável", () => {
  const matcher = new RegExp(`^${config.matcher[0]}$`);
  it.each(["/manifest.webmanifest", "/sw.js", "/offline.html", "/icon-192.png", "/favicon.ico"])("%s não exige login", (path) => {
    expect(matcher.test(path)).toBe(false);
  });
  it.each(["/", "/lancamentos", "/api/exportar"])("%s exige login", (path) => {
    expect(matcher.test(path)).toBe(true);
  });
});
