import { prisma } from "./prisma";
import { createWorkspace } from "./workspace";
import { currentMonth, daysInMonth, isValidISODate, todayISO, toDate } from "./dates";
import { round2 } from "./format";

// Formato da primeira versão do FinTrack, salvo como JSON em UserData.payload.
type LegacyPayload = {
  transacoes?: { date: string; description: string; category: string; type: "Receita" | "Despesa"; value: number }[];
  categorias?: { name: string; icon: string }[];
  contasRecorrentes?: { name: string; category: string; value: number; dueDay: number }[];
  metasFinanceiras?: { name: string; targetValue: number; currentValue: number; deadline: string }[];
  orcamentos?: { category: string; limit: number }[];
};

/**
 * Garante que o usuário tenha ao menos um espaço de trabalho. Na primeira vez,
 * importa os dados da versão anterior (JSON) para o modelo relacional.
 */
export async function ensureUserWorkspace(userId: string, userName: string) {
  const existing = await prisma.membership.findFirst({ where: { userId }, select: { workspaceId: true } });
  if (existing) return existing.workspaceId;

  const legacy = await prisma.userData.findUnique({ where: { userId } });
  let payload: LegacyPayload = {};
  if (legacy && !legacy.importedAt) {
    try {
      payload = JSON.parse(legacy.payload) as LegacyPayload;
    } catch {
      payload = {};
    }
  }

  return prisma.$transaction(
    async (tx) => {
      const workspace = await createWorkspace(userId, { name: `Finanças de ${userName.split(" ")[0]}`, type: "PERSONAL" }, tx);
      const hasLegacy = (payload.transacoes?.length ?? 0) + (payload.contasRecorrentes?.length ?? 0) + (payload.metasFinanceiras?.length ?? 0) > 0;
      if (!hasLegacy) {
        if (legacy) await tx.userData.update({ where: { userId }, data: { importedAt: new Date() } });
        return workspace.id;
      }

      const account = await tx.account.findFirstOrThrow({ where: { workspaceId: workspace.id }, orderBy: { createdAt: "asc" } });
      const categories = await tx.category.findMany({ where: { workspaceId: workspace.id } });
      const byKey = new Map(categories.map((c) => [`${c.kind}:${c.name.toLowerCase()}`, c.id]));

      async function categoryId(name: string | undefined, kind: "INCOME" | "EXPENSE") {
        const clean = name?.trim();
        if (!clean) return null;
        const key = `${kind}:${clean.toLowerCase()}`;
        const found = byKey.get(key);
        if (found) return found;
        const icon = payload.categorias?.find((c) => c.name === clean)?.icon ?? "Tag";
        const created = await tx.category.create({ data: { workspaceId: workspace.id, name: clean, kind, icon } });
        byKey.set(key, created.id);
        return created.id;
      }

      for (const t of payload.transacoes ?? []) {
        const kind = t.type === "Receita" ? "INCOME" : "EXPENSE";
        const date = isValidISODate(t.date?.slice(0, 10)) ? t.date.slice(0, 10) : todayISO();
        await tx.transaction.create({
          data: {
            workspaceId: workspace.id,
            accountId: account.id,
            type: kind,
            status: "PAID",
            description: t.description || "Lançamento importado",
            amount: round2(Math.abs(Number(t.value) || 0)),
            date: toDate(date),
            paidAt: toDate(date),
            categoryId: await categoryId(t.category, kind),
            createdById: userId,
          },
        });
      }

      const month = currentMonth();
      const [y, m] = month.split("-").map(Number);
      for (const bill of payload.contasRecorrentes ?? []) {
        const day = Math.min(Math.max(Number(bill.dueDay) || 1, 1), daysInMonth(y, m));
        await tx.recurringRule.create({
          data: {
            workspaceId: workspace.id,
            accountId: account.id,
            type: "EXPENSE",
            description: bill.name,
            amount: round2(Math.abs(Number(bill.value) || 0)),
            frequency: "MONTHLY",
            startDate: toDate(`${month}-${String(day).padStart(2, "0")}`),
            categoryId: await categoryId(bill.category, "EXPENSE"),
          },
        });
      }

      for (const goal of payload.metasFinanceiras ?? []) {
        await tx.goal.create({
          data: {
            workspaceId: workspace.id,
            name: goal.name,
            targetAmount: round2(Number(goal.targetValue) || 0),
            currentAmount: round2(Number(goal.currentValue) || 0),
            deadline: isValidISODate(goal.deadline) ? toDate(goal.deadline) : null,
          },
        });
      }

      for (const budget of payload.orcamentos ?? []) {
        const id = await categoryId(budget.category, "EXPENSE");
        if (!id) continue;
        await tx.budget.upsert({
          where: { workspaceId_categoryId: { workspaceId: workspace.id, categoryId: id } },
          create: { workspaceId: workspace.id, categoryId: id, amount: round2(Number(budget.limit) || 0) },
          update: { amount: round2(Number(budget.limit) || 0) },
        });
      }

      await tx.userData.update({ where: { userId }, data: { importedAt: new Date() } });
      return workspace.id;
    },
    { timeout: 60_000 },
  );
}
