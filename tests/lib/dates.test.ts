import { afterEach, describe, expect, it, vi } from "vitest";
import {
  addDays,
  addMonths,
  diffInDays,
  isValidISODate,
  isValidMonth,
  lastDayOfMonth,
  monthRange,
  parseFlexibleDate,
  shiftMonth,
  todayISO,
} from "@/lib/dates";

afterEach(() => {
  vi.useRealTimers();
});

describe("addMonths (vencimentos de parcelas e recorrências)", () => {
  it("limita ao último dia do mês", () => {
    expect(addMonths("2026-01-31", 1)).toBe("2026-02-28");
    expect(addMonths("2028-01-31", 1)).toBe("2028-02-29");
    expect(addMonths("2026-03-31", -1)).toBe("2026-02-28");
  });

  it("volta ao dia preferido depois de um mês curto", () => {
    expect(addMonths("2026-02-28", 1, 31)).toBe("2026-03-31");
    expect(addMonths("2026-02-28", 2, 30)).toBe("2026-04-30");
  });

  it("atravessa a virada do ano nos dois sentidos", () => {
    expect(addMonths("2026-12-15", 1)).toBe("2027-01-15");
    expect(addMonths("2026-01-10", -13)).toBe("2024-12-10");
  });
});

describe("addDays / shiftMonth / intervalos", () => {
  it("soma dias atravessando mês, ano e ano bissexto", () => {
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2028-02-28", 1)).toBe("2028-02-29");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
  });

  it("muda de mês", () => {
    expect(shiftMonth("2026-01", -1)).toBe("2025-12");
    expect(shiftMonth("2026-12", 1)).toBe("2027-01");
  });

  it("monthRange cobre o mês inteiro e nada além", () => {
    const r = monthRange("2026-12");
    expect(r.gte.toISOString()).toBe("2026-12-01T00:00:00.000Z");
    expect(r.lt.toISOString()).toBe("2027-01-01T00:00:00.000Z");
  });

  it("último dia e diferença em dias", () => {
    expect(lastDayOfMonth("2026-02")).toBe("2026-02-28");
    expect(lastDayOfMonth("2028-02")).toBe("2028-02-29");
    expect(diffInDays("2026-11-13", "2026-12-13")).toBe(30);
    expect(diffInDays("2026-11-13", "2026-11-09")).toBe(-4);
  });
});

describe("validação de datas", () => {
  it("recusa datas que não existem no calendário", () => {
    expect(isValidISODate("2026-02-31")).toBe(false);
    expect(isValidISODate("2026-04-31")).toBe(false);
    expect(isValidISODate("2027-02-29")).toBe(false);
    expect(isValidISODate("2026-13-01")).toBe(false);
  });

  it("aceita datas reais", () => {
    expect(isValidISODate("2028-02-29")).toBe(true);
    expect(isValidISODate("2026-11-13")).toBe(true);
  });

  it("valida o parâmetro de mês da URL", () => {
    expect(isValidMonth("2026-11")).toBe(true);
    expect(isValidMonth("2026-13")).toBe(false);
    expect(isValidMonth("2026-1")).toBe(false);
    expect(isValidMonth(undefined)).toBe(false);
  });
});

describe("parseFlexibleDate (datas de extrato)", () => {
  it.each([
    ["13/11/2026", "2026-11-13"],
    ["1/2/26", "2026-02-01"],
    ["13.11.2026", "2026-11-13"],
    ["13-11-2026", "2026-11-13"],
    [" 2026-11-13 ", "2026-11-13"],
  ])("lê %s como %s", (input, expected) => {
    expect(parseFlexibleDate(input)).toBe(expected);
  });

  it.each(["31/02/2026", "32/01/2026", "abc", "", "2026/11/13"])("recusa %s", (input) => {
    expect(parseFlexibleDate(input)).toBeNull();
  });
});

describe("todayISO", () => {
  it("usa o fuso de São Paulo, não o do servidor (UTC)", () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-11-14T02:30:00.000Z")); // 23:30 do dia 13 em São Paulo
    expect(todayISO()).toBe("2026-11-13");
  });
});
