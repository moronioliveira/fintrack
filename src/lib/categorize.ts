import { prisma } from "./prisma";

/** Chave de comparação: minúsculas, sem acentos, números e pontuação; até 3 palavras. */
export function descriptionKey(description: string) {
  return description
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\(\d+\/\d+\)/g, " ")
    .replace(/[^a-z\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 1)
    .slice(0, 3)
    .join(" ");
}

type Guess = { categoryId: string | null; contactId: string | null };

/**
 * Aprende com o histórico do espaço: para cada descrição já categorizada,
 * guarda a categoria/contato mais recente por tipo (receita/despesa).
 */
export async function buildCategoryGuesser(workspaceId: string) {
  const history = await prisma.transaction.findMany({
    where: { workspaceId, type: { not: "TRANSFER" }, categoryId: { not: null } },
    select: { description: true, type: true, categoryId: true, contactId: true },
    orderBy: { date: "desc" },
    take: 3000,
  });
  const map = new Map<string, Guess>();
  for (const t of history) {
    const key = `${t.type}:${descriptionKey(t.description)}`;
    if (!map.has(key)) map.set(key, { categoryId: t.categoryId, contactId: t.contactId });
  }
  return (description: string, type: "INCOME" | "EXPENSE"): Guess | null => {
    const key = descriptionKey(description);
    if (!key) return null;
    return map.get(`${type}:${key}`) ?? map.get(`${type}:${key.split(" ").slice(0, 2).join(" ")}`) ?? null;
  };
}
