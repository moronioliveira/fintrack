import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const prisma = vi.hoisted(() => ({
  account: { findMany: vi.fn() },
  transaction: { groupBy: vi.fn(), findMany: vi.fn() },
  recurringRule: { findMany: vi.fn() },
}));
vi.mock("@/lib/prisma", () => ({ prisma }));

import { getCashProjection } from "@/lib/projection";

const d = (iso: string) => new Date(`${iso}T00:00:00.000Z`);

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-11-13T15:00:00Z"));
  prisma.account.findMany.mockResolvedValue([
    { id: "a", name: "Banco", type: "CHECKING", color: "#000", archived: false, initialBalance: 1000, creditLimit: null },
  ]);
  prisma.transaction.groupBy.mockResolvedValue([]);
  prisma.transaction.findMany.mockResolvedValue([]);
  prisma.recurringRule.findMany.mockResolvedValue([]);
});
afterEach(() => vi.useRealTimers());

describe("getCashProjection", () => {
  it("parte do saldo atual e soma pendentes no dia de vencimento", async () => {
    prisma.transaction.findMany.mockResolvedValue([
      { date: d("2026-11-15"), description: "Cliente", type: "INCOME", amount: 500 },
      { date: d("2026-11-20"), description: "Fornecedor", type: "EXPENSE", amount: 2000 },
    ]);
    const p = await getCashProjection("ws_1", 30);
    expect(p.startBalance).toBe(1000);
    expect(p.series).toHaveLength(31);
    expect(p.series.find((s) => s.date === "2026-11-15")?.balance).toBe(1500);
    expect(p.series.find((s) => s.date === "2026-11-20")?.balance).toBe(-500);
    expect(p.firstNegative?.date).toBe("2026-11-20");
    expect(p.lowest.balance).toBe(-500);
  });

  it("contas atrasadas entram hoje, marcadas como atrasadas", async () => {
    prisma.transaction.findMany.mockResolvedValue([{ date: d("2026-11-01"), description: "Atrasada", type: "EXPENSE", amount: 300 }]);
    const p = await getCashProjection("ws_1", 10);
    expect(p.series[0]).toMatchObject({ date: "2026-11-13", expense: 300, balance: 700 });
    expect(p.items[0]).toMatchObject({ overdue: true, date: "2026-11-13" });
  });

  it("recorrências: só ocorrências futuras ainda não geradas (sem contar duas vezes)", async () => {
    prisma.recurringRule.findMany.mockResolvedValue([
      { description: "Salário", type: "INCOME", amount: 3000, frequency: "MONTHLY", startDate: d("2026-01-05"), endDate: null, generatedUntil: d("2026-12-23") },
      { description: "Assinatura", type: "EXPENSE", amount: 50, frequency: "MONTHLY", startDate: d("2026-10-20"), endDate: d("2026-12-31"), generatedUntil: null },
    ]);
    const p = await getCashProjection("ws_1", 90);
    const recurring = p.items.filter((i) => i.source === "recurring").map((i) => `${i.description}@${i.date}`);
    expect(recurring).toEqual(["Assinatura@2026-11-20", "Assinatura@2026-12-20", "Salário@2027-01-05", "Salário@2027-02-05"]);
  });

  it("sem saldo negativo, firstNegative é null", async () => {
    const p = await getCashProjection("ws_1", 30);
    expect(p.firstNegative).toBeNull();
    expect(p.series.at(-1)?.balance).toBe(1000);
  });

  it("todas as consultas filtram pelo espaço", async () => {
    await getCashProjection("ws_1", 30);
    expect(prisma.transaction.findMany.mock.calls[0][0].where.workspaceId).toBe("ws_1");
    expect(prisma.recurringRule.findMany.mock.calls[0][0].where.workspaceId).toBe("ws_1");
  });
});
