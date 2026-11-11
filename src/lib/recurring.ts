import type { Frequency, RecurringRule } from "@prisma/client";
import { prisma } from "./prisma";
import { addDays, addMonths, toDate, toISO, todayISO } from "./dates";

/** Quantos dias à frente os lançamentos recorrentes são gerados como pendentes. */
const HORIZON_DAYS = 40;

export function nextOccurrence(iso: string, frequency: Frequency, anchorDay: number) {
  if (frequency === "WEEKLY") return addDays(iso, 7);
  if (frequency === "YEARLY") return addMonths(iso, 12, anchorDay);
  return addMonths(iso, 1, anchorDay);
}

function occurrencesFor(rule: RecurringRule, horizon: string) {
  const start = toISO(rule.startDate);
  const anchorDay = Number(start.slice(8, 10));
  const end = rule.endDate ? toISO(rule.endDate) : null;
  const after = rule.generatedUntil ? toISO(rule.generatedUntil) : null;
  const dates: string[] = [];
  let cursor = start;
  let guard = 0;
  while (cursor <= horizon && (!end || cursor <= end) && guard < 500) {
    if (!after || cursor > after) dates.push(cursor);
    cursor = nextOccurrence(cursor, rule.frequency, anchorDay);
    guard++;
  }
  return dates;
}

/**
 * Gera, de forma idempotente, os lançamentos pendentes das regras recorrentes
 * até o horizonte configurado. Executado a cada acesso ao espaço de trabalho.
 */
export async function materializeRecurring(workspaceId: string) {
  const horizon = addDays(todayISO(), HORIZON_DAYS);
  const rules = await prisma.recurringRule.findMany({
    where: {
      workspaceId,
      active: true,
      startDate: { lte: toDate(horizon) },
      OR: [{ generatedUntil: null }, { generatedUntil: { lt: toDate(horizon) } }],
    },
  });

  for (const rule of rules) {
    const dates = occurrencesFor(rule, horizon);
    if (dates.length) {
      await prisma.transaction.createMany({
        skipDuplicates: true,
        data: dates.map((date) => ({
          workspaceId,
          recurringRuleId: rule.id,
          type: rule.type,
          status: "PENDING" as const,
          description: rule.description,
          amount: rule.amount,
          date: toDate(date),
          accountId: rule.accountId,
          categoryId: rule.categoryId,
          contactId: rule.contactId,
        })),
      });
    }
    await prisma.recurringRule.update({ where: { id: rule.id }, data: { generatedUntil: toDate(horizon) } });
  }
}
