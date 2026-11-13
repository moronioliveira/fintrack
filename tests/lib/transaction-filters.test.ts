import { afterEach, describe, expect, it, vi } from "vitest";
import { buildTxWhere, parseTxFilters } from "@/lib/transaction-filters";

afterEach(() => vi.useRealTimers());

describe("parseTxFilters", () => {
  it("descarta valores forjados na URL", () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-11-13T15:00:00Z"));
    const f = parseTxFilters({ mes: "2026-99", tipo: "HACK", status: "x", pagina: "-5", busca: "a".repeat(300) });
    expect(f.mes).toBe("2026-11");
    expect(f.tipo).toBeUndefined();
    expect(f.status).toBeUndefined();
    expect(f.pagina).toBe(1);
    expect(f.busca).toHaveLength(100);
  });

  it("aceita valores válidos e listas repetidas na URL", () => {
    const f = parseTxFilters({ mes: "todos", tipo: ["EXPENSE", "INCOME"], status: "OVERDUE", pagina: "3" });
    expect(f).toMatchObject({ mes: "todos", tipo: "EXPENSE", status: "OVERDUE", pagina: 3 });
  });
});

describe("buildTxWhere", () => {
  const base = { mes: "2026-11", pagina: 1 } as const;

  it("SEMPRE restringe ao espaço do usuário", () => {
    const where = buildTxWhere("ws_1", { ...base, conta: "acc_9", categoria: "cat_1", busca: "x" });
    expect(where.workspaceId).toBe("ws_1");
  });

  it("filtra o mês inteiro", () => {
    const where = buildTxWhere("ws_1", { ...base });
    expect(where.date).toEqual({ gte: new Date("2026-11-01T00:00:00.000Z"), lt: new Date("2026-12-01T00:00:00.000Z") });
  });

  it("'Atrasados' = pendentes com data antes de hoje", () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-11-13T15:00:00Z"));
    const where = buildTxWhere("ws_1", { ...base, status: "OVERDUE" });
    expect(where.status).toBe("PENDING");
    expect(where.date).toEqual({ gte: new Date("2026-11-01T00:00:00.000Z"), lt: new Date("2026-11-13T00:00:00.000Z") });
    const all = buildTxWhere("ws_1", { mes: "todos", pagina: 1, status: "OVERDUE" });
    expect(all.date).toEqual({ lt: new Date("2026-11-13T00:00:00.000Z") });
  });

  it("conta inclui transferências recebidas; 'Sem categoria' vira null", () => {
    const where = buildTxWhere("ws_1", { ...base, conta: "acc_1", categoria: "none" });
    expect(where.OR).toEqual([{ accountId: "acc_1" }, { transferAccountId: "acc_1" }]);
    expect(where.categoryId).toBeNull();
  });
});
