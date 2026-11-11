import type { Prisma } from "@prisma/client";
import { prisma } from "./prisma";
import { toDate } from "./dates";

export type MatrixRow = { id: string; name: string; color: string; kind: "INCOME" | "EXPENSE"; months: number[]; total: number };

/** Totais por categoria em cada mês do ano (competência). */
export async function getCategoryMatrix(workspaceId: string, year: number) {
  const [rows, categories] = await Promise.all([
    prisma.$queryRaw<{ categoryId: string | null; type: string; month: number; total: Prisma.Decimal }[]>`
      SELECT "categoryId", "type"::text AS type, EXTRACT(MONTH FROM "date")::int AS month, SUM("amount") AS total
      FROM "Transaction"
      WHERE "workspaceId" = ${workspaceId}
        AND "type" <> 'TRANSFER'
        AND "date" >= ${toDate(`${year}-01-01`)}
        AND "date" < ${toDate(`${year + 1}-01-01`)}
      GROUP BY 1, 2, 3
    `,
    prisma.category.findMany({ where: { workspaceId }, select: { id: true, name: true, color: true } }),
  ]);

  const map = new Map<string, MatrixRow>();
  for (const r of rows) {
    const kind = r.type as "INCOME" | "EXPENSE";
    const key = `${kind}:${r.categoryId ?? "none"}`;
    let row = map.get(key);
    if (!row) {
      const cat = categories.find((c) => c.id === r.categoryId);
      row = { id: key, name: cat?.name ?? "Sem categoria", color: cat?.color ?? "#94a3b8", kind, months: Array(12).fill(0), total: 0 };
      map.set(key, row);
    }
    const value = Number(r.total);
    row.months[r.month - 1] += value;
    row.total += value;
  }
  const sorted = [...map.values()].sort((a, b) => b.total - a.total);
  return { income: sorted.filter((r) => r.kind === "INCOME"), expense: sorted.filter((r) => r.kind === "EXPENSE") };
}
