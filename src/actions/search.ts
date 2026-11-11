"use server";

import { prisma } from "@/lib/prisma";
import { getContext } from "@/lib/auth";

export type SearchResult = {
  id: string;
  description: string;
  date: string;
  amount: number;
  type: "INCOME" | "EXPENSE" | "TRANSFER";
  status: "PAID" | "PENDING";
  category: string | null;
};

/** Busca rápida de lançamentos no espaço ativo (descrição, observação, contato ou categoria). */
export async function searchTransactions(query: string): Promise<SearchResult[]> {
  const q = query.trim().slice(0, 80);
  if (q.length < 2) return [];
  const { workspace } = await getContext();
  const items = await prisma.transaction.findMany({
    where: {
      workspaceId: workspace.id,
      OR: [
        { description: { contains: q, mode: "insensitive" } },
        { notes: { contains: q, mode: "insensitive" } },
        { contact: { name: { contains: q, mode: "insensitive" } } },
        { category: { name: { contains: q, mode: "insensitive" } } },
      ],
    },
    include: { category: { select: { name: true } } },
    orderBy: { date: "desc" },
    take: 8,
  });
  return items.map((t) => ({
    id: t.id,
    description: t.description,
    date: t.date.toISOString().slice(0, 10),
    amount: Number(t.amount),
    type: t.type,
    status: t.status,
    category: t.category?.name ?? null,
  }));
}
