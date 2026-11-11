import type { Prisma } from "@prisma/client";
import { currentMonth, isValidMonth, monthRange, toDate, todayISO } from "./dates";

export type TxFilters = {
  mes: string;
  tipo?: "INCOME" | "EXPENSE" | "TRANSFER";
  status?: "PAID" | "PENDING" | "OVERDUE";
  conta?: string;
  categoria?: string;
  contato?: string;
  centro?: string;
  busca?: string;
  pagina: number;
};

type Raw = Record<string, string | string[] | undefined>;

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) || undefined;

export function parseTxFilters(raw: Raw): TxFilters {
  const mes = first(raw.mes);
  const tipo = first(raw.tipo);
  const status = first(raw.status);
  return {
    mes: mes === "todos" ? "todos" : isValidMonth(mes) ? mes : currentMonth(),
    tipo: tipo === "INCOME" || tipo === "EXPENSE" || tipo === "TRANSFER" ? tipo : undefined,
    status: status === "PAID" || status === "PENDING" || status === "OVERDUE" ? status : undefined,
    conta: first(raw.conta),
    categoria: first(raw.categoria),
    contato: first(raw.contato),
    centro: first(raw.centro),
    busca: first(raw.busca)?.slice(0, 100),
    pagina: Math.max(1, Number.parseInt(first(raw.pagina) ?? "1", 10) || 1),
  };
}

export function buildTxWhere(workspaceId: string, f: TxFilters): Prisma.TransactionWhereInput {
  const where: Prisma.TransactionWhereInput = { workspaceId };
  if (f.mes !== "todos") where.date = monthRange(f.mes);
  if (f.tipo) where.type = f.tipo;
  if (f.status === "OVERDUE") {
    where.status = "PENDING";
    const today = toDate(todayISO());
    const range = f.mes !== "todos" ? monthRange(f.mes) : null;
    where.date = range ? { gte: range.gte, lt: range.lt < today ? range.lt : today } : { lt: today };
  } else if (f.status) where.status = f.status;
  if (f.conta) where.OR = [{ accountId: f.conta }, { transferAccountId: f.conta }];
  if (f.categoria) where.categoryId = f.categoria === "none" ? null : f.categoria;
  if (f.contato) where.contactId = f.contato;
  if (f.centro) where.costCenterId = f.centro;
  if (f.busca) {
    where.AND = [{ OR: [{ description: { contains: f.busca, mode: "insensitive" } }, { notes: { contains: f.busca, mode: "insensitive" } }] }];
  }
  return where;
}
