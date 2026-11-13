import { describe, expect, it } from "vitest";
import { formatMoney, parseMoney, round2 } from "@/lib/format";

// O Intl usa espaço não separável entre "R$" e o número.
const plain = (s: string) => s.replace(/\s/g, " ");

describe("parseMoney", () => {
  it.each([
    ["1.234,56", 1234.56],
    ["1234,56", 1234.56],
    ["1234.56", 1234.56],
    ["R$ 1.234,56", 1234.56],
    ["-R$ 10,00", -10],
    ["-89,90", -89.9],
    ["0,01", 0.01],
    ["1.234.567,89", 1234567.89],
    ["1,234.56", 1234.56],
    ["1.500", 1500],
    ["12.000", 12000],
    ["1.000.000", 1000000],
    ["1.5", 1.5],
    ["10", 10],
  ])("lê %s como %s", (input, expected) => {
    expect(parseMoney(input)).toBe(expected);
  });

  it.each(["", "abc", "R$"])("retorna NaN para %s", (input) => {
    expect(parseMoney(input)).toBeNaN();
  });
});

describe("round2", () => {
  it("arredonda para centavos sem erro de ponto flutuante visível", () => {
    expect(round2(0.1 + 0.2)).toBe(0.3);
    expect(round2(10.005)).toBeCloseTo(10.01, 2);
    expect(round2(-3.333)).toBe(-3.33);
  });
});

describe("formatMoney", () => {
  it("formata em reais no padrão brasileiro", () => {
    expect(plain(formatMoney(1234.56))).toBe("R$ 1.234,56");
    expect(plain(formatMoney(-50))).toBe("-R$ 50,00");
  });

  it("nunca mostra -R$ 0,00 para resíduos de arredondamento", () => {
    expect(plain(formatMoney(-0.001))).toBe("R$ 0,00");
  });

  it("adiciona + só em valores positivos quando pedido", () => {
    expect(plain(formatMoney(10, "BRL", { signed: true }))).toBe("+R$ 10,00");
    expect(plain(formatMoney(-10, "BRL", { signed: true }))).toBe("-R$ 10,00");
  });
});
