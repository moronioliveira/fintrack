import { prisma } from "./prisma";
import { addDays, toDate, toISO, todayISO } from "./dates";
import { getAccountsWithBalance, num } from "./finance";
import { nextOccurrence } from "./recurring";

export type ProjectionDay = { date: string; income: number; expense: number; balance: number };
export type ProjectionItem = { date: string; description: string; type: "INCOME" | "EXPENSE"; amount: number; source: "pending" | "recurring"; overdue: boolean };

/**
 * Projeta o saldo diário a partir do saldo atual, somando lançamentos pendentes
 * (atrasados entram hoje) e ocorrências futuras de recorrências ainda não geradas.
 */
export async function getCashProjection(workspaceId: string, days: number) {
  const today = todayISO();
  const horizon = addDays(today, days);
  const [accounts, pending, rules] = await Promise.all([
    getAccountsWithBalance(workspaceId),
    prisma.transaction.findMany({
      where: { workspaceId, status: "PENDING", type: { not: "TRANSFER" }, date: { lte: toDate(horizon) } },
      select: { date: true, description: true, type: true, amount: true },
      orderBy: { date: "asc" },
    }),
    prisma.recurringRule.findMany({ where: { workspaceId, active: true, type: { not: "TRANSFER" } } }),
  ]);

  const items: ProjectionItem[] = pending.map((t) => {
    const iso = toISO(t.date);
    return { date: iso < today ? today : iso, description: t.description, type: t.type as "INCOME" | "EXPENSE", amount: num(t.amount), source: "pending", overdue: iso < today };
  });

  // Ocorrências além do que já foi materializado como lançamento pendente.
  for (const rule of rules) {
    const start = toISO(rule.startDate);
    const anchor = Number(start.slice(8, 10));
    const after = rule.generatedUntil ? toISO(rule.generatedUntil) : null;
    const end = rule.endDate ? toISO(rule.endDate) : null;
    let cursor = start;
    for (let guard = 0; guard < 1000 && cursor <= horizon && (!end || cursor <= end); guard++) {
      if (cursor > today && (!after || cursor > after)) {
        items.push({ date: cursor, description: rule.description, type: rule.type as "INCOME" | "EXPENSE", amount: num(rule.amount), source: "recurring", overdue: false });
      }
      cursor = nextOccurrence(cursor, rule.frequency, anchor);
    }
  }

  const startBalance = accounts.reduce((sum, a) => sum + a.balance, 0);
  const series: ProjectionDay[] = [];
  let balance = startBalance;
  for (let i = 0; i <= days; i++) {
    const date = addDays(today, i);
    const dayItems = items.filter((it) => it.date === date);
    const income = dayItems.filter((it) => it.type === "INCOME").reduce((s, it) => s + it.amount, 0);
    const expense = dayItems.filter((it) => it.type === "EXPENSE").reduce((s, it) => s + it.amount, 0);
    balance += income - expense;
    series.push({ date, income, expense, balance });
  }

  const lowest = series.reduce((min, d) => (d.balance < min.balance ? d : min), series[0]);
  const firstNegative = series.find((d) => d.balance < 0) ?? null;
  items.sort((a, b) => a.date.localeCompare(b.date) || a.type.localeCompare(b.type));

  return { startBalance, series, items, lowest, firstNegative };
}
