import { describe, expect, it } from "vitest";
import { moneyInWords } from "@/lib/extenso";

// Usado nos recibos: erro aqui vai impresso para o cliente.
describe("moneyInWords", () => {
  it.each([
    [0, "zero reais"],
    [1, "um real"],
    [0.01, "um centavo"],
    [0.5, "cinquenta centavos"],
    [2, "dois reais"],
    [100, "cem reais"],
    [101, "cento e um reais"],
    [115.5, "cento e quinze reais e cinquenta centavos"],
    [1000, "mil reais"],
    [1001, "mil e um reais"],
    [1200, "mil e duzentos reais"],
    [1250.3, "mil duzentos e cinquenta reais e trinta centavos"],
    [21000, "vinte e um mil reais"],
    [1000000, "um milhão de reais"],
    [2500000, "dois milhões quinhentos mil reais"],
  ])("%s → %s", (value, expected) => {
    expect(moneyInWords(value)).toBe(expected);
  });

  it("ignora o sinal (o recibo já diz se é pagamento ou recebimento)", () => {
    expect(moneyInWords(-10)).toBe("dez reais");
  });

  it("arredonda para o centavo mais próximo", () => {
    expect(moneyInWords(10.999)).toBe("onze reais");
  });

  it("usa o nome da moeda do espaço", () => {
    expect(moneyInWords(1, "USD")).toBe("um dólar");
    expect(moneyInWords(3, "EUR")).toBe("três euros");
  });
});
