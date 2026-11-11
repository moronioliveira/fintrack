import { getContext } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buildTxWhere, parseTxFilters } from "@/lib/transaction-filters";
import { toISO, todayISO } from "@/lib/dates";

const TYPE = { INCOME: "Receita", EXPENSE: "Despesa", TRANSFER: "Transferência" } as const;

function cell(value: string | null | undefined) {
  const v = (value ?? "").replace(/\r?\n/g, " ");
  return /[;"]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
}

/** Exporta os lançamentos filtrados em CSV (separador ";", compatível com Excel pt-BR). */
export async function GET(request: Request) {
  const { workspace } = await getContext();
  const params = Object.fromEntries(new URL(request.url).searchParams);
  const filters = parseTxFilters(params);
  const items = await prisma.transaction.findMany({
    where: buildTxWhere(workspace.id, filters),
    include: { category: true, account: true, transferAccount: true, contact: true, costCenter: true },
    orderBy: [{ date: "asc" }, { createdAt: "asc" }],
    take: 20_000,
  });

  const header = ["Data", "Descrição", "Tipo", "Situação", "Valor", "Categoria", "Conta", "Conta destino", "Contato", "Centro de custo", "Observações"];
  const lines = items.map((t) =>
    [
      toISO(t.date).split("-").reverse().join("/"),
      t.description,
      TYPE[t.type],
      t.status === "PAID" ? "Pago" : "Pendente",
      Number(t.amount).toFixed(2).replace(".", ","),
      t.category?.name,
      t.account.name,
      t.transferAccount?.name,
      t.contact?.name,
      t.costCenter?.name,
      t.notes,
    ].map(cell).join(";"),
  );
  const csv = `﻿${[header.join(";"), ...lines].join("\r\n")}`;
  const period = filters.mes === "todos" ? "completo" : filters.mes;

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="fintrack-lancamentos-${period}-${todayISO()}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
