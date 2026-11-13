import { beforeEach, describe, expect, it, vi } from "vitest";

const m = vi.hoisted(() => ({
  prisma: {
    user: { findUnique: vi.fn() },
    membership: { findUnique: vi.fn(), findFirst: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
    workspace: { delete: vi.fn() },
  },
  requireRole: vi.fn(),
  getContext: vi.fn(),
  setActiveWorkspaceCookie: vi.fn(),
}));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({
  unstable_rethrow: vi.fn(),
  redirect: (url: string) => {
    throw new Error(`REDIRECT:${url}`);
  },
}));
vi.mock("@/lib/prisma", () => ({ prisma: m.prisma }));
vi.mock("@/lib/session", () => ({ setActiveWorkspaceCookie: m.setActiveWorkspaceCookie }));
vi.mock("@/lib/workspace", () => ({ createWorkspace: vi.fn() }));
vi.mock("bcryptjs", () => ({ default: { compare: vi.fn(), hash: vi.fn() } }));
vi.mock("@/lib/auth", () => ({
  requireRole: m.requireRole,
  getContext: m.getContext,
  getCurrentUser: vi.fn(),
  PermissionError: class PermissionError extends Error {},
}));

import { addMember, deleteWorkspace, leaveWorkspace, removeMember, updateMemberRole } from "@/actions/workspace";

const { prisma } = m;
const idle = undefined as never;
const fd = (e: Record<string, string>) => {
  const f = new FormData();
  for (const [k, v] of Object.entries(e)) f.set(k, v);
  return f;
};
const admin = { workspace: { id: "ws_1", name: "Doce Ana" }, user: { id: "u_admin" }, role: "ADMIN", workspaces: [{ id: "ws_1" }, { id: "ws_2" }] };

beforeEach(() => {
  vi.clearAllMocks();
  m.requireRole.mockResolvedValue(admin);
  m.getContext.mockResolvedValue(admin);
});

describe("membros", () => {
  it("não dá para convidar alguém como proprietário (OWNER)", async () => {
    const res = await addMember(idle, fd({ email: "x@x.com", role: "OWNER" }));
    expect(res).toMatchObject({ ok: false, error: "Opção inválida." });
    expect(prisma.membership.create).not.toHaveBeenCalled();
  });

  it("adiciona membro existente no espaço atual", async () => {
    prisma.user.findUnique.mockResolvedValue({ id: "u_2", name: "Bia" });
    prisma.membership.findUnique.mockResolvedValue(null);
    const res = await addMember(idle, fd({ email: "  BIA@X.COM ", role: "VIEWER" }));
    expect(res.ok).toBe(true);
    expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { email: "bia@x.com" } });
    expect(prisma.membership.create).toHaveBeenCalledWith({ data: { userId: "u_2", workspaceId: "ws_1", role: "VIEWER" } });
  });

  it("não altera o papel do proprietário nem o próprio papel", async () => {
    prisma.membership.findFirst.mockResolvedValueOnce({ id: "mb_1", role: "OWNER", userId: "u_owner" });
    expect(await updateMemberRole(idle, fd({ id: "mb_1", role: "VIEWER" }))).toMatchObject({ ok: false, error: "O papel do proprietário não pode ser alterado." });
    prisma.membership.findFirst.mockResolvedValueOnce({ id: "mb_2", role: "ADMIN", userId: "u_admin" });
    expect(await updateMemberRole(idle, fd({ id: "mb_2", role: "VIEWER" }))).toMatchObject({ ok: false, error: "Você não pode alterar o próprio papel." });
    expect(prisma.membership.update).not.toHaveBeenCalled();
  });

  it("só encontra membros do próprio espaço", async () => {
    prisma.membership.findFirst.mockResolvedValue(null);
    expect(await removeMember(idle, fd({ id: "mb_alheio" }))).toMatchObject({ ok: false, error: "Membro não encontrado." });
    expect(prisma.membership.findFirst).toHaveBeenCalledWith({ where: { id: "mb_alheio", workspaceId: "ws_1" } });
    expect(prisma.membership.delete).not.toHaveBeenCalled();
  });

  it("não remove o proprietário", async () => {
    prisma.membership.findFirst.mockResolvedValue({ id: "mb_1", role: "OWNER", userId: "u_owner" });
    expect(await removeMember(idle, fd({ id: "mb_1" }))).toMatchObject({ ok: false, error: "O proprietário não pode ser removido." });
  });
});

describe("excluir / sair do espaço", () => {
  it("excluir exige digitar o nome exato do espaço", async () => {
    const res = await deleteWorkspace(idle, fd({ confirm: "doce ana" }));
    expect(res).toMatchObject({ ok: false, error: "Digite o nome do espaço exatamente para confirmar." });
    expect(prisma.workspace.delete).not.toHaveBeenCalled();
  });

  it("não exclui o único espaço do usuário", async () => {
    m.getContext.mockResolvedValue({ ...admin, workspaces: [{ id: "ws_1" }] });
    const res = await deleteWorkspace(idle, fd({ confirm: "Doce Ana" }));
    expect(res).toMatchObject({ ok: false, error: "Você precisa ter pelo menos um espaço. Crie outro antes de excluir este." });
    expect(prisma.workspace.delete).not.toHaveBeenCalled();
  });

  it("com confirmação correta, exclui e troca para outro espaço", async () => {
    await expect(deleteWorkspace(idle, fd({ confirm: "Doce Ana" }))).rejects.toThrow("REDIRECT:/");
    expect(prisma.workspace.delete).toHaveBeenCalledWith({ where: { id: "ws_1" } });
    expect(m.setActiveWorkspaceCookie).toHaveBeenCalledWith("ws_2");
  });

  it("o proprietário não pode sair do próprio espaço", async () => {
    m.getContext.mockResolvedValue({ ...admin, role: "OWNER" });
    expect(await leaveWorkspace(idle, fd({}))).toMatchObject({ ok: false, error: "O proprietário não pode sair do próprio espaço." });
    expect(prisma.membership.delete).not.toHaveBeenCalled();
  });
});
