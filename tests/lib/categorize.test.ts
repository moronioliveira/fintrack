import { beforeEach, describe, expect, it, vi } from "vitest";

const prisma = vi.hoisted(() => ({ transaction: { findMany: vi.fn() } }));
vi.mock("@/lib/prisma", () => ({ prisma }));

import { buildCategoryGuesser, descriptionKey } from "@/lib/categorize";

beforeEach(() => vi.clearAllMocks());

describe("descriptionKey", () => {
  it("normaliza acentos, números, pontuação e marcação de parcela", () => {
    expect(descriptionKey("Farmácia São João (2/10)")).toBe("farmacia sao joao");
    expect(descriptionKey("PIX RECEBIDO - 12345 - CAFE CENTRAL")).toBe("pix recebido cafe");
    expect(descriptionKey("123 456")).toBe("");
  });
});

describe("buildCategoryGuesser", () => {
  it("só lê o histórico do próprio espaço", async () => {
    prisma.transaction.findMany.mockResolvedValue([]);
    await buildCategoryGuesser("ws_1");
    expect(prisma.transaction.findMany.mock.calls[0][0].where.workspaceId).toBe("ws_1");
  });

  it("usa a categoria mais recente para a mesma descrição e tipo", async () => {
    // findMany já vem ordenado do mais recente para o mais antigo
    prisma.transaction.findMany.mockResolvedValue([
      { description: "Supermercado Bom Preço", type: "EXPENSE", categoryId: "alimentacao", contactId: "c1" },
      { description: "Supermercado Bom Preço", type: "EXPENSE", categoryId: "outros", contactId: null },
      { description: "Supermercado Bom Preço", type: "INCOME", categoryId: "reembolso", contactId: null },
    ]);
    const guess = await buildCategoryGuesser("ws_1");
    expect(guess("SUPERMERCADO BOM PRECO", "EXPENSE")).toEqual({ categoryId: "alimentacao", contactId: "c1" });
    expect(guess("Supermercado Bom Preço", "INCOME")).toEqual({ categoryId: "reembolso", contactId: null });
  });

  it("cai para as duas primeiras palavras quando não acha a frase exata", async () => {
    prisma.transaction.findMany.mockResolvedValue([{ description: "Posto Shell", type: "EXPENSE", categoryId: "transporte", contactId: null }]);
    const guess = await buildCategoryGuesser("ws_1");
    expect(guess("Posto Shell Avenida", "EXPENSE")?.categoryId).toBe("transporte");
    expect(guess("Padaria", "EXPENSE")).toBeNull();
    expect(guess("1234", "EXPENSE")).toBeNull();
  });
});
