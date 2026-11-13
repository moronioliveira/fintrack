import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const prisma = vi.hoisted(() => ({
  recurringRule: { findMany: vi.fn(), update: vi.fn() },
  transaction: { createMany: vi.fn() },
}));
vi.mock("@/lib/prisma", () => ({ prisma }));

import { materializeRecurring, nextOccurrence } from "@/lib/recurring";

const d = (iso: string) => new Date(`${iso}T00:00:00.000Z`);
const rule = (over: Record<string, unknown> = {}) => ({
  id: "r1",
  workspaceId: "ws_1",
  type: "EXPENSE",
  description: "Aluguel",
  amount: 1500,
  frequency: "MONTHLY",
  startDate: d("2026-10-31"),
  endDate: null,
  generatedUntil: null,
  accountId: "acc_1",
  categoryId: "cat_1",
  contactId: null,
  active: true,
  ...over,
});

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-11-13T15:00:00Z")); // horizonte = 23/12/2026
  prisma.recurringRule.update.mockResolvedValue({});
  prisma.transaction.createMany.mockResolvedValue({ count: 0 });
});
afterEach(() => vi.useRealTimers());

const createdDates = () => prisma.transaction.createMany.mock.calls.flatMap((c) => c[0].data.map((t: { date: Date }) => t.date.toISOString().slice(0, 10)));

describe("nextOccurrence", () => {
  it("mensal mantém o dia 31 depois de meses curtos", () => {
    expect(nextOccurrence("2026-01-31", "MONTHLY", 31)).toBe("2026-02-28");
    expect(nextOccurrence("2026-02-28", "MONTHLY", 31)).toBe("2026-03-31");
  });
  it("semanal e anual", () => {
    expect(nextOccurrence("2026-12-28", "WEEKLY", 28)).toBe("2027-01-04");
    expect(nextOccurrence("2028-02-29", "YEARLY", 29)).toBe("2029-02-28");
  });
});

describe("materializeRecurring", () => {
  it("gera as ocorrências até o horizonte de 40 dias, como pendentes", async () => {
    prisma.recurringRule.findMany.mockResolvedValue([rule()]);
    await materializeRecurring("ws_1");
    expect(createdDates()).toEqual(["2026-10-31", "2026-11-30"]);
    const data = prisma.transaction.createMany.mock.calls[0][0];
    expect(data.skipDuplicates).toBe(true);
    expect(data.data[0]).toMatchObject({ workspaceId: "ws_1", recurringRuleId: "r1", status: "PENDING", amount: 1500, accountId: "acc_1" });
    expect(prisma.recurringRule.update).toHaveBeenCalledWith({ where: { id: "r1" }, data: { generatedUntil: d("2026-12-23") } });
  });

  it("é idempotente: não gera de novo o que já foi gerado", async () => {
    prisma.recurringRule.findMany.mockResolvedValue([rule({ generatedUntil: d("2026-11-30") })]);
    await materializeRecurring("ws_1");
    expect(prisma.transaction.createMany).not.toHaveBeenCalled();
    expect(prisma.recurringRule.update).toHaveBeenCalledTimes(1);
  });

  it("respeita a data final da regra", async () => {
    prisma.recurringRule.findMany.mockResolvedValue([rule({ startDate: d("2026-11-01"), frequency: "WEEKLY", endDate: d("2026-11-20") })]);
    await materializeRecurring("ws_1");
    expect(createdDates()).toEqual(["2026-11-01", "2026-11-08", "2026-11-15"]);
  });

  it("consulta só as regras ativas do espaço", async () => {
    prisma.recurringRule.findMany.mockResolvedValue([]);
    await materializeRecurring("ws_1");
    expect(prisma.recurringRule.findMany.mock.calls[0][0].where).toMatchObject({ workspaceId: "ws_1", active: true });
  });
});
