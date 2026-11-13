import { beforeEach, describe, expect, it, vi } from "vitest";

const m = vi.hoisted(() => ({
  prisma: { user: { findUnique: vi.fn() }, membership: { findMany: vi.fn() } },
  getSessionUserId: vi.fn(),
  getActiveWorkspaceCookie: vi.fn(),
  ensureUserWorkspace: vi.fn(),
  materializeRecurring: vi.fn(),
}));

vi.mock("react", () => ({ cache: (fn: unknown) => fn }));
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Error(`REDIRECT:${url}`);
  },
}));
vi.mock("@/lib/prisma", () => ({ prisma: m.prisma }));
vi.mock("@/lib/session", () => ({ getSessionUserId: m.getSessionUserId, getActiveWorkspaceCookie: m.getActiveWorkspaceCookie }));
vi.mock("@/lib/legacy-import", () => ({ ensureUserWorkspace: m.ensureUserWorkspace }));
vi.mock("@/lib/recurring", () => ({ materializeRecurring: m.materializeRecurring }));

import { getContext, hasRole, PermissionError, requireRole } from "@/lib/auth";

const membership = (workspaceId: string, role: string) => ({
  workspaceId,
  role,
  workspace: { id: workspaceId, name: workspaceId, type: "PERSONAL", currency: "BRL", document: null },
});

beforeEach(() => {
  vi.clearAllMocks();
  m.getSessionUserId.mockResolvedValue("user_1");
  m.prisma.user.findUnique.mockResolvedValue({ id: "user_1", name: "Ana", email: "ana@x.com" });
  m.ensureUserWorkspace.mockResolvedValue("ws_pessoal");
  m.getActiveWorkspaceCookie.mockResolvedValue(null);
  m.materializeRecurring.mockResolvedValue(undefined);
});

describe("hasRole", () => {
  it.each([
    ["VIEWER", "MEMBER", false],
    ["MEMBER", "MEMBER", true],
    ["MEMBER", "ADMIN", false],
    ["ADMIN", "ADMIN", true],
    ["ADMIN", "OWNER", false],
    ["OWNER", "ADMIN", true],
  ])("%s tem nível %s? %s", (role, min, expected) => {
    expect(hasRole(role as never, min as never)).toBe(expected);
  });
});

describe("getContext", () => {
  it("sem sessão, manda para /sair", async () => {
    m.getSessionUserId.mockResolvedValue(null);
    await expect(getContext()).rejects.toThrow("REDIRECT:/sair");
  });

  it("sessão de usuário que não existe mais, manda para /sair", async () => {
    m.prisma.user.findUnique.mockResolvedValue(null);
    await expect(getContext()).rejects.toThrow("REDIRECT:/sair");
  });

  it("usa o espaço do cookie quando o usuário é membro dele", async () => {
    m.getActiveWorkspaceCookie.mockResolvedValue("ws_empresa");
    m.prisma.membership.findMany.mockResolvedValue([membership("ws_pessoal", "OWNER"), membership("ws_empresa", "VIEWER")]);
    const ctx = await getContext();
    expect(ctx.workspace.id).toBe("ws_empresa");
    expect(ctx.role).toBe("VIEWER");
  });

  it("IGNORA cookie forjado com o id de um espaço de outra pessoa", async () => {
    m.getActiveWorkspaceCookie.mockResolvedValue("ws_de_outra_pessoa");
    m.prisma.membership.findMany.mockResolvedValue([membership("ws_pessoal", "OWNER")]);
    const ctx = await getContext();
    expect(ctx.workspace.id).toBe("ws_pessoal");
    expect(m.prisma.membership.findMany.mock.calls[0][0].where).toEqual({ userId: "user_1" });
  });

  it("gera as recorrências do espaço ativo", async () => {
    m.prisma.membership.findMany.mockResolvedValue([membership("ws_pessoal", "OWNER")]);
    await getContext();
    expect(m.materializeRecurring).toHaveBeenCalledWith("ws_pessoal");
  });
});

describe("requireRole", () => {
  it("bloqueia leitor (VIEWER) em ações de escrita", async () => {
    m.prisma.membership.findMany.mockResolvedValue([membership("ws_pessoal", "VIEWER")]);
    await expect(requireRole("MEMBER")).rejects.toThrow(PermissionError);
  });

  it("bloqueia membro em ações de administrador", async () => {
    m.prisma.membership.findMany.mockResolvedValue([membership("ws_pessoal", "MEMBER")]);
    await expect(requireRole("ADMIN")).rejects.toThrow("Você não tem permissão");
  });

  it("libera quem tem o papel necessário", async () => {
    m.prisma.membership.findMany.mockResolvedValue([membership("ws_pessoal", "ADMIN")]);
    await expect(requireRole("MEMBER")).resolves.toMatchObject({ role: "ADMIN" });
  });
});
