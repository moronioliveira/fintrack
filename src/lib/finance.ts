import { Prisma, type CategoryKind } from "@prisma/client";
import { prisma } from "./prisma";
import { addDays, monthRange, shiftMonth, toDate, todayISO } from "./dates";

const num = (value: Prisma.Decimal | number | null | undefined) => Number(value ?? 0);

/** Contas com saldo realizado (pagos) e previsto (inclui pendentes). */
export async function getAccountsWithBalance(workspaceId: string, opts?: { includeArchived?: boolean }) {
  const [accounts, outgoing, incoming] = await Promise.all([
    prisma.account.findMany({
      where: { workspaceId, ...(opts?.includeArchived ? {} : { archived: false }) },
      orderBy: [{ archived: "asc" }, { createdAt: "asc" }],
    }),
    prisma.transaction.groupBy({
      by: ["accountId", "type", "status"],
      where: { workspaceId },
      _sum: { amount: true },
    }),
    prisma.transaction.groupBy({
      by: ["transferAccountId", "status"],
      where: { workspaceId, type: "TRANSFER" },
      _sum: { amount: true },
    }),
  ]);

  return accounts.map((account) => {
    let paid = num(account.initialBalance);
    let pending = 0;
    for (const row of outgoing.filter((r) => r.accountId === account.id)) {
      const value = num(row._sum.amount) * (row.type === "INCOME" ? 1 : -1);
      if (row.status === "PAID") paid += value;
      else pending += value;
    }
    for (const row of incoming.filter((r) => r.transferAccountId === account.id)) {
      if (row.status === "PAID") paid += num(row._sum.amount);
      else pending += num(row._sum.amount);
    }
    return {
      id: account.id,
      name: account.name,
      type: account.type,
      color: account.color,
      archived: account.archived,
      initialBalance: num(account.initialBalance),
      creditLimit: account.creditLimit === null ? null : num(account.creditLimit),
      balance: paid,
      projected: paid + pending,
    };
  });
}

export type AccountWithBalance = Awaited<ReturnType<typeof getAccountsWithBalance>>[number];

export async function getMonthSummary(workspaceId: string, month: string) {
  const rows = await prisma.transaction.groupBy({
    by: ["type", "status"],
    where: { workspaceId, date: monthRange(month), type: { not: "TRANSFER" } },
    _sum: { amount: true },
  });
  const pick = (type: "INCOME" | "EXPENSE", status: "PAID" | "PENDING") =>
    num(rows.find((r) => r.type === type && r.status === status)?._sum.amount);
  const income = { paid: pick("INCOME", "PAID"), pending: pick("INCOME", "PENDING") };
  const expense = { paid: pick("EXPENSE", "PAID"), pending: pick("EXPENSE", "PENDING") };
  return {
    income: { ...income, total: income.paid + income.pending },
    expense: { ...expense, total: expense.paid + expense.pending },
    result: income.paid + income.pending - expense.paid - expense.pending,
  };
}

/** Receitas e despesas (competência) por mês. */
export async function getCashflow(workspaceId: string, endMonth: string, months: number) {
  const startMonth = shiftMonth(endMonth, -(months - 1));
  const rows = await prisma.$queryRaw<{ month: string; type: string; total: Prisma.Decimal }[]>`
    SELECT to_char("date", 'YYYY-MM') AS month, "type"::text AS type, SUM("amount") AS total
    FROM "Transaction"
    WHERE "workspaceId" = ${workspaceId}
      AND "type" <> 'TRANSFER'
      AND "date" >= ${toDate(`${startMonth}-01`)}
      AND "date" < ${toDate(`${shiftMonth(endMonth, 1)}-01`)}
    GROUP BY 1, 2
  `;
  return Array.from({ length: months }, (_, i) => {
    const month = shiftMonth(startMonth, i);
    const income = num(rows.find((r) => r.month === month && r.type === "INCOME")?.total);
    const expense = num(rows.find((r) => r.month === month && r.type === "EXPENSE")?.total);
    return { month, income, expense, result: income - expense };
  });
}

export async function getCategoryBreakdown(
  workspaceId: string,
  range: { gte: Date; lt: Date },
  kind: CategoryKind,
) {
  const [rows, categories] = await Promise.all([
    prisma.transaction.groupBy({
      by: ["categoryId"],
      where: { workspaceId, type: kind, date: range },
      _sum: { amount: true },
    }),
    prisma.category.findMany({ where: { workspaceId }, select: { id: true, name: true, color: true, icon: true } }),
  ]);
  const total = rows.reduce((acc, r) => acc + num(r._sum.amount), 0);
  return rows
    .map((row) => {
      const category = categories.find((c) => c.id === row.categoryId);
      const value = num(row._sum.amount);
      return {
        id: row.categoryId ?? "none",
        name: category?.name ?? "Sem categoria",
        color: category?.color ?? "#94a3b8",
        icon: category?.icon ?? "Tag",
        value,
        share: total ? (value / total) * 100 : 0,
      };
    })
    .sort((a, b) => b.value - a.value);
}

export async function getUpcoming(workspaceId: string, days = 15, take = 8) {
  const items = await prisma.transaction.findMany({
    where: { workspaceId, status: "PENDING", date: { lte: toDate(addDays(todayISO(), days)) } },
    include: { category: true, contact: true, account: true },
    orderBy: { date: "asc" },
    take,
  });
  return items;
}

export async function getOverdueSummary(workspaceId: string) {
  const rows = await prisma.transaction.groupBy({
    by: ["type"],
    where: { workspaceId, status: "PENDING", date: { lt: toDate(todayISO()) }, type: { not: "TRANSFER" } },
    _sum: { amount: true },
    _count: true,
  });
  const get = (t: "INCOME" | "EXPENSE") => rows.find((r) => r.type === t);
  return {
    receivable: { total: num(get("INCOME")?._sum.amount), count: get("INCOME")?._count ?? 0 },
    payable: { total: num(get("EXPENSE")?._sum.amount), count: get("EXPENSE")?._count ?? 0 },
  };
}

export async function getBudgetsProgress(workspaceId: string, month: string) {
  const [budgets, spent] = await Promise.all([
    prisma.budget.findMany({ where: { workspaceId }, include: { category: true }, orderBy: { category: { name: "asc" } } }),
    prisma.transaction.groupBy({
      by: ["categoryId"],
      where: { workspaceId, type: "EXPENSE", date: monthRange(month) },
      _sum: { amount: true },
    }),
  ]);
  return budgets.map((budget) => {
    const used = num(spent.find((s) => s.categoryId === budget.categoryId)?._sum.amount);
    const limit = num(budget.amount);
    return {
      id: budget.id,
      categoryId: budget.categoryId,
      name: budget.category.name,
      color: budget.category.color,
      icon: budget.category.icon,
      limit,
      used,
      percent: limit ? (used / limit) * 100 : 0,
    };
  });
}

export function serializeTransaction<
  T extends { amount: Prisma.Decimal; date: Date; paidAt: Date | null },
>(t: T) {
  return { ...t, amount: num(t.amount), date: t.date.toISOString().slice(0, 10), paidAt: t.paidAt?.toISOString().slice(0, 10) ?? null };
}

export { num };
