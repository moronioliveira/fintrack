import { describe, expect, it, vi } from "vitest";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({ unstable_rethrow: vi.fn(), redirect: vi.fn() }));
vi.mock("@/lib/auth", () => ({ PermissionError: class PermissionError extends Error {} }));

import { ValidationError } from "@/lib/action";
import { bool, date, int, money, oneOf, str } from "@/lib/form";

const fd = (entries: Record<string, string>) => {
  const f = new FormData();
  for (const [k, v] of Object.entries(entries)) f.set(k, v);
  return f;
};

describe("money", () => {
  it("lê valores no formato brasileiro e arredonda para centavos", () => {
    expect(money(fd({ amount: "1.234,567" }), "amount")).toBe(1234.57);
    expect(money(fd({ amount: "1.500" }), "amount")).toBe(1500);
  });

  it.each([
    ["", "Valor inválido."],
    ["abc", "Valor inválido."],
    ["0", "Valor deve ser maior que zero."],
    ["-10", "Valor não pode ser negativo."],
    ["9999999999999", "Valor muito alto."],
  ])("recusa %s", (raw, message) => {
    expect(() => money(fd({ amount: raw }), "amount")).toThrow(message);
  });

  it("os erros são ValidationError (mostrados ao usuário, não viram erro 500)", () => {
    expect(() => money(fd({ amount: "0" }), "amount")).toThrow(ValidationError);
  });

  it("permite zero e negativo só quando pedido (ex.: saldo inicial)", () => {
    expect(money(fd({ v: "0" }), "v", { allowZero: true })).toBe(0);
    expect(money(fd({ v: "-150,00" }), "v", { allowNegative: true })).toBe(-150);
  });
});

describe("date", () => {
  it("exige data válida e real", () => {
    expect(date(fd({ d: "2026-11-13" }), "d")).toBe("2026-11-13");
    expect(() => date(fd({ d: "2026-02-31" }), "d")).toThrow("Data inválida.");
    expect(() => date(fd({ d: "" }), "d", { required: true })).toThrow("Informe a data.");
    expect(date(fd({ d: "" }), "d")).toBeNull();
  });
});

describe("str / oneOf / int / bool", () => {
  it("str valida obrigatório e tamanho", () => {
    expect(str(fd({ s: "  Aluguel  " }), "s")).toBe("Aluguel");
    expect(() => str(fd({ s: " " }), "s", { required: "Informe." })).toThrow("Informe.");
    expect(() => str(fd({ s: "x".repeat(161) }), "s", { max: 160 })).toThrow("máx. 160");
  });

  it("oneOf só aceita valores da lista (impede papéis/tipos forjados)", () => {
    expect(oneOf(fd({ r: "MEMBER" }), "r", ["ADMIN", "MEMBER"] as const)).toBe("MEMBER");
    expect(() => oneOf(fd({ r: "OWNER" }), "r", ["ADMIN", "MEMBER"] as const)).toThrow("Opção inválida.");
    expect(oneOf(fd({}), "r", ["one", "group"] as const, "one")).toBe("one");
  });

  it("int limita ao intervalo (parcelas de 1 a 120)", () => {
    expect(int(fd({ n: "500" }), "n", 1, 120, 1)).toBe(120);
    expect(int(fd({ n: "-3" }), "n", 1, 120, 1)).toBe(1);
    expect(int(fd({ n: "x" }), "n", 1, 120, 1)).toBe(1);
  });

  it("bool reconhece checkbox marcado", () => {
    expect(bool(fd({ b: "on" }), "b")).toBe(true);
    expect(bool(fd({}), "b")).toBe(false);
  });
});
