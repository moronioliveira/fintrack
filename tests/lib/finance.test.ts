import { beforeEach, describe, expect, it, vi } from "vitest";

const prisma = vi.hoisted(() => ({
  account: { findMany: vi.fn() },
  transaction: { groupBy: vi.fn() },
  budget: { findMany: vi.fn() },
}));
vi.mock("@/lib/prisma", () => ({ prisma }));

import { getAccountsWithBalance, getBudgetsProgress, getMonthSummary } from "@/lib/finance";

beforeEach(() => vi.clearAllMocks());

describe("getAccountsWithBalance", () => {
  it("saldo = inicial + recebidos − pagos ± transferências; previsto inclui pendentes", async () => {
    prisma.account.findMany.mockResolvedValue([
      { id: "a", name: "Banco", type: "CHECKING", color: "#000", archived: false, initialBalance: 1000, creditLimit: null },
      { id: "b", name: "Caixa", type: "CASH", color: "#000", archived: false, initialBalance: 0, creditLimit: null },
    ]);
    prisma.transaction.groupBy
      .mockResolvedValueOnce([
        { accountId: "a", type: "INCOME", status: "PAID", _sum: { amount: 500 } },
        { accountId: "a", type: "EXPENSE", status: "PAID", _sum: { amount: 200 } },
        { accountId: "a", type: "EXPENSE", status: "PENDING", _sum: { amount: 300 } },
        { accountId: "a", type: "TRANSFER", status: "PAID", _sum: { amount: 100 } },
        { accountId: "b", type: "INCOME", status: "PENDING", _sum: { amount: 50 } },
      ])
      .mockResolvedValueOnce([{ transferAccountId: "b", status: "PAID", _sum: { amount: 100 } }]);

    const [a, b] = await getAccountsWithBalance("ws_1");
    expect(a.balance).toBe(1200); // 1000 + 500 − 200 − 100 (transferência saiu)
    expect(a.projected).toBe(900); // − 300 pendente
    expect(b.balance).toBe(100); // transferência entrou
    expect(b.projected).toBe(150);
  });

  it("todas as consultas filtram pelo espaço", async () => {
    prisma.account.findMany.mockResolvedValue([]);
    prisma.transaction.groupBy.mockResolvedValue([]);
    await getAccountsWithBalance("ws_1");
    expect(prisma.account.findMany.mock.calls[0][0].where.workspaceId).toBe("ws_1");
    for (const call of prisma.transaction.groupBy.mock.calls) expect(call[0].where.workspaceId).toBe("ws_1");
  });
});

describe("getMonthSummary", () => {
  it("separa pago/pendente e calcula o resultado (sem contar transferências)", async () => {
    prisma.transaction.groupBy.mockResolvedValue([
      { type: "INCOME", status: "PAID", _sum: { amount: 1000 } },
      { type: "INCOME", status: "PENDING", _sum: { amount: 250 } },
      { type: "EXPENSE", status: "PAID", _sum: { amount: 400 } },
      { type: "EXPENSE", status: "PENDING", _sum: { amount: null } },
    ]);
    const s = await getMonthSummary("ws_1", "2026-11");
    expect(s.income).toEqual({ paid: 1000, pending: 250, total: 1250 });
    expect(s.expense).toEqual({ paid: 400, pending: 0, total: 400 });
    expect(s.result).toBe(850);
    expect(prisma.transaction.groupBy.mock.calls[0][0].where).toMatchObject({ workspaceId: "ws_1", type: { not: "TRANSFER" } });
  });
});

describe("getBudgetsProgress", () => {
  it("calcula o percentual usado de cada orçamento", async () => {
    prisma.budget.findMany.mockResolvedValue([
      { id: "b1", categoryId: "c1", amount: 500, category: { name: "Mercado", color: "#f00", icon: "Tag" } },
      { id: "b2", categoryId: "c2", amount: 0, category: { name: "Lazer", color: "#0f0", icon: "Tag" } },
    ]);
    prisma.transaction.groupBy.mockResolvedValue([{ categoryId: "c1", _sum: { amount: 600 } }]);
    const [mercado, lazer] = await getBudgetsProgress("ws_1", "2026-11");
    expect(mercado).toMatchObject({ used: 600, limit: 500, percent: 120 });
    expect(lazer).toMatchObject({ used: 0, percent: 0 });
  });
});
