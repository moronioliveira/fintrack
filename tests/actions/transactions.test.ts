import { beforeEach, describe, expect, it, vi } from "vitest";

const m = vi.hoisted(() => {
  class PermissionError extends Error {}
  const prisma = {
    account: { findFirst: vi.fn() },
    category: { findFirst: vi.fn(), findMany: vi.fn() },
    contact: { findFirst: vi.fn() },
    costCenter: { findFirst: vi.fn() },
    transaction: {
      findFirst: vi.fn(), findMany: vi.fn(), create: vi.fn(), createMany: vi.fn(), update: vi.fn(),
      updateMany: vi.fn(), delete: vi.fn(), deleteMany: vi.fn(),
    },
  };
  return { PermissionError, prisma, requireRole: vi.fn() };
});

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({ unstable_rethrow: vi.fn(), redirect: vi.fn() }));
vi.mock("@/lib/auth", () => ({ requireRole: m.requireRole, PermissionError: m.PermissionError }));
vi.mock("@/lib/prisma", () => ({ prisma: m.prisma }));

import { bulkTransactions, deleteTransaction, importTransactions, saveTransaction } from "@/actions/transactions";

const { prisma } = m;
const ctx = { workspace: { id: "ws_1" }, user: { id: "user_1" }, role: "MEMBER" };
const fd = (entries: Record<string, string | string[]>) => {
  const f = new FormData();
  for (const [k, v] of Object.entries(entries)) (Array.isArray(v) ? v : [v]).forEach((x) => f.append(k, x));
  return f;
};
const idle = { ok: true, at: 0 } as never;
const newExpense = (over: Record<string, string> = {}) =>
  fd({ type: "EXPENSE", description: "Fornecedor", amount: "100,00", date: "2026-11-13", accountId: "acc_1", categoryId: "cat_1", ...over });

beforeEach(() => {
  vi.clearAllMocks();
  m.requireRole.mockResolvedValue(ctx);
  // Por padrão, tudo que é consultado pertence ao espaço ws_1.
  prisma.account.findFirst.mockImplementation(async ({ where }: { where: { workspaceId: string } }) => (where.workspaceId === "ws_1" ? { id: "acc_1" } : null));
  prisma.category.findFirst.mockResolvedValue({ id: "cat_1", kind: "EXPENSE", name: "Fornecedores" });
  prisma.category.findMany.mockResolvedValue([{ id: "cat_vendas", kind: "INCOME", name: "Venda de produtos" }]);
  prisma.transaction.findMany.mockResolvedValue([]);
  prisma.transaction.create.mockResolvedValue({});
  prisma.transaction.createMany.mockResolvedValue({ count: 0 });
});

describe("permissões", () => {
  it("leitor recebe mensagem clara e nada é gravado", async () => {
    m.requireRole.mockRejectedValue(new m.PermissionError("Você não tem permissão para esta ação neste espaço."));
    const res = await saveTransaction(idle, newExpense());
    expect(res).toMatchObject({ ok: false, error: "Você não tem permissão para esta ação neste espaço." });
    expect(prisma.transaction.create).not.toHaveBeenCalled();
  });

  it("erro inesperado não vaza detalhes técnicos para a tela", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    prisma.transaction.create.mockRejectedValue(new Error("connection refused at 10.0.0.5:5432"));
    const res = await saveTransaction(idle, newExpense());
    expect(res).toMatchObject({ ok: false, error: "Não foi possível concluir a operação. Tente novamente." });
    expect(log).toHaveBeenCalled(); // o detalhe fica só no log do servidor
    log.mockRestore();
  });
});

describe("saveTransaction", () => {
  it("cria o lançamento no espaço do usuário", async () => {
    const res = await saveTransaction(idle, newExpense({ paid: "on" }));
    expect(res.ok).toBe(true);
    expect(prisma.transaction.create.mock.calls[0][0].data).toMatchObject({
      workspaceId: "ws_1", createdById: "user_1", amount: 100, status: "PAID", date: new Date("2026-11-13T00:00:00.000Z"),
    });
  });

  it("recusa conta de OUTRO espaço (id forjado no formulário)", async () => {
    prisma.account.findFirst.mockResolvedValue(null);
    const res = await saveTransaction(idle, newExpense({ accountId: "acc_de_outra_pessoa" }));
    expect(res).toMatchObject({ ok: false, error: "Conta inválida." });
    expect(prisma.account.findFirst).toHaveBeenCalledWith({ where: { id: "acc_de_outra_pessoa", workspaceId: "ws_1" } });
    expect(prisma.transaction.create).not.toHaveBeenCalled();
  });

  it("recusa categoria de outro espaço", async () => {
    prisma.category.findFirst.mockResolvedValue(null);
    const res = await saveTransaction(idle, newExpense({ categoryId: "cat_alheia" }));
    expect(res).toMatchObject({ ok: false, error: "Categoria inválida." });
    expect(prisma.transaction.create).not.toHaveBeenCalled();
  });

  it("não deixa editar lançamento de outro espaço", async () => {
    prisma.transaction.findFirst.mockResolvedValue(null);
    const res = await saveTransaction(idle, newExpense({ id: "tx_alheio" }));
    expect(res).toMatchObject({ ok: false, error: "Lançamento não encontrado." });
    expect(prisma.transaction.findFirst).toHaveBeenCalledWith({ where: { id: "tx_alheio", workspaceId: "ws_1" } });
    expect(prisma.transaction.update).not.toHaveBeenCalled();
  });

  it("transferência exige contas diferentes", async () => {
    const res = await saveTransaction(idle, fd({ type: "TRANSFER", description: "Reserva", amount: "50", date: "2026-11-13", accountId: "acc_1", transferAccountId: "acc_1" }));
    expect(res).toMatchObject({ ok: false, error: "As contas de origem e destino devem ser diferentes." });
  });

  it("parcelas: a soma bate exatamente com o total e a 1ª absorve os centavos", async () => {
    await saveTransaction(idle, newExpense({ amount: "100,00", installments: "3", paid: "on", date: "2026-01-31" }));
    const rows = prisma.transaction.createMany.mock.calls[0][0].data;
    expect(rows.map((r: { amount: number }) => r.amount)).toEqual([33.34, 33.33, 33.33]);
    expect(rows.reduce((s: number, r: { amount: number }) => s + r.amount, 0)).toBeCloseTo(100, 10);
    expect(rows.map((r: { date: Date }) => r.date.toISOString().slice(0, 10))).toEqual(["2026-01-31", "2026-02-28", "2026-03-31"]);
    expect(rows.map((r: { status: string }) => r.status)).toEqual(["PAID", "PENDING", "PENDING"]);
    expect(rows.map((r: { description: string }) => r.description)).toEqual(["Fornecedor (1/3)", "Fornecedor (2/3)", "Fornecedor (3/3)"]);
    expect(new Set(rows.map((r: { installmentGroup: string }) => r.installmentGroup)).size).toBe(1);
    expect(rows.every((r: { workspaceId: string }) => r.workspaceId === "ws_1")).toBe(true);
  });

  it.each([
    ["sem descrição", { description: "" }, "Informe uma descrição."],
    ["valor zero", { amount: "0" }, "Valor deve ser maior que zero."],
    ["data impossível", { date: "2026-02-31" }, "Data inválida."],
    ["tipo forjado", { type: "HACK" }, "Opção inválida."],
  ])("valida %s", async (_label, over, error) => {
    const res = await saveTransaction(idle, newExpense(over));
    expect(res).toMatchObject({ ok: false, error });
    expect(prisma.transaction.create).not.toHaveBeenCalled();
  });
});

describe("deleteTransaction", () => {
  it("não apaga lançamento de outro espaço", async () => {
    prisma.transaction.findFirst.mockResolvedValue(null);
    const res = await deleteTransaction(idle, fd({ id: "tx_alheio" }));
    expect(res).toMatchObject({ ok: false, error: "Lançamento não encontrado." });
    expect(prisma.transaction.delete).not.toHaveBeenCalled();
  });

  it("apagar parcelamento inteiro fica restrito ao espaço", async () => {
    prisma.transaction.findFirst.mockResolvedValue({ id: "tx_1", installmentGroup: "grp_1" });
    prisma.transaction.deleteMany.mockResolvedValue({ count: 3 });
    const res = await deleteTransaction(idle, fd({ id: "tx_1", scope: "group" }));
    expect(res).toMatchObject({ ok: true, message: "3 parcelas excluídas." });
    expect(prisma.transaction.deleteMany).toHaveBeenCalledWith({ where: { workspaceId: "ws_1", installmentGroup: "grp_1" } });
  });
});

describe("bulkTransactions", () => {
  it("ações em massa só atingem lançamentos do próprio espaço", async () => {
    prisma.transaction.deleteMany.mockResolvedValue({ count: 2 });
    await bulkTransactions(idle, fd({ op: "delete", ids: ["tx_1", "tx_alheio"] }));
    expect(prisma.transaction.deleteMany).toHaveBeenCalledWith({ where: { workspaceId: "ws_1", id: { in: ["tx_1", "tx_alheio"] } } });
  });

  it("marcar como pago só altera pendentes", async () => {
    prisma.transaction.updateMany.mockResolvedValue({ count: 1 });
    await bulkTransactions(idle, fd({ op: "pay", ids: ["tx_1"] }));
    expect(prisma.transaction.updateMany.mock.calls[0][0].where).toEqual({ workspaceId: "ws_1", id: { in: ["tx_1"] }, status: "PENDING" });
  });

  it("recategorizar recusa categoria de outro espaço", async () => {
    prisma.category.findFirst.mockResolvedValue(null);
    const res = await bulkTransactions(idle, fd({ op: "categorize", ids: ["tx_1"], categoryId: "cat_alheia" }));
    expect(res).toMatchObject({ ok: false, error: "Categoria inválida." });
    expect(prisma.transaction.updateMany).not.toHaveBeenCalled();
  });
});

describe("importTransactions", () => {
  const importForm = (rows: unknown, accountId = "acc_1") => fd({ accountId, rows: JSON.stringify(rows) });

  it("cria receitas e despesas pelo sinal, como pagas, no espaço do usuário", async () => {
    const res = await importTransactions(idle, importForm([
      { date: "13/11/2026", description: "PIX recebido", amount: "1.280,00", category: "Venda de produtos" },
      { date: "2026-11-14", description: "Tarifa", amount: "-69,90" },
    ]));
    expect(res.ok).toBe(true);
    const data = prisma.transaction.createMany.mock.calls[0][0].data;
    expect(data).toHaveLength(2);
    expect(data[0]).toMatchObject({ workspaceId: "ws_1", type: "INCOME", amount: 1280, status: "PAID", categoryId: "cat_vendas" });
    expect(data[1]).toMatchObject({ type: "EXPENSE", amount: 69.9 });
  });

  it("não importa duas vezes o mesmo extrato", async () => {
    prisma.transaction.findMany.mockImplementation(async (args: { where?: { categoryId?: unknown } }) =>
      args?.where && "accountId" in args.where
        ? [{ date: new Date("2026-11-13T00:00:00.000Z"), amount: 1280, type: "INCOME", description: "PIX recebido" }]
        : [],
    );
    const res = await importTransactions(idle, importForm([
      { date: "13/11/2026", description: "PIX recebido", amount: "1280,00" },
      { date: "14/11/2026", description: "Nova venda", amount: "50,00" },
      { date: "14/11/2026", description: "Nova venda", amount: "50,00" },
    ]));
    expect(prisma.transaction.createMany.mock.calls[0][0].data).toHaveLength(1);
    expect(res).toMatchObject({ ok: true });
    expect((res as { message: string }).message).toContain("2 duplicado(s) ignorado(s)");
  });

  it("ignora linhas inválidas e avisa quantas foram", async () => {
    const res = await importTransactions(idle, importForm([
      { date: "31/02/2026", description: "Data impossível", amount: "10,00" },
      { date: "13/11/2026", description: "", amount: "10,00" },
      { date: "13/11/2026", description: "Zero", amount: "0" },
      { date: "13/11/2026", description: "Ok", amount: "10,00" },
    ]));
    expect(prisma.transaction.createMany.mock.calls[0][0].data).toHaveLength(1);
    expect((res as { message: string }).message).toContain("3 linha(s) inválida(s)");
  });

  it("recusa conta de outro espaço", async () => {
    prisma.account.findFirst.mockResolvedValue(null);
    const res = await importTransactions(idle, importForm([{ date: "13/11/2026", description: "x", amount: "1" }], "acc_alheia"));
    expect(res).toMatchObject({ ok: false, error: "Conta inválida." });
    expect(prisma.transaction.createMany).not.toHaveBeenCalled();
  });

  it("limita a 2.000 linhas por importação e recusa arquivo corrompido", async () => {
    const many = Array.from({ length: 2001 }, () => ({ date: "13/11/2026", description: "x", amount: "1" }));
    expect(await importTransactions(idle, importForm(many))).toMatchObject({ ok: false, error: "Importe no máximo 2.000 linhas por vez." });
    expect(await importTransactions(idle, fd({ accountId: "acc_1", rows: "{quebrado" }))).toMatchObject({ ok: false, error: "Arquivo inválido." });
  });
});
