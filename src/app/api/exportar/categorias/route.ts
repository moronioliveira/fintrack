import { getContext } from "@/lib/auth";
import { getCategoryMatrix } from "@/lib/category-matrix";
import { todayISO } from "@/lib/dates";

const MONTHS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
const fmt = (v: number) => v.toFixed(2).replace(".", ",");
const cell = (v: string) => (/[;"]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);

/** Exporta o relatório de categorias x meses do ano em CSV. */
export async function GET(request: Request) {
  const { workspace } = await getContext();
  const param = Number(new URL(request.url).searchParams.get("ano"));
  const year = Number.isInteger(param) && param > 1990 && param < 2200 ? param : Number(todayISO().slice(0, 4));
  const { income, expense } = await getCategoryMatrix(workspace.id, year);

  const lines = [["Tipo", "Categoria", ...MONTHS, "Total", "Média mensal"].join(";")];
  for (const [label, rows] of [["Receita", income], ["Despesa", expense]] as const) {
    for (const r of rows) lines.push([label, cell(r.name), ...r.months.map(fmt), fmt(r.total), fmt(r.total / 12)].join(";"));
    const totals = Array.from({ length: 12 }, (_, i) => rows.reduce((s, r) => s + r.months[i], 0));
    const sum = totals.reduce((a, b) => a + b, 0);
    lines.push([`Total ${label.toLowerCase()}s`, "", ...totals.map(fmt), fmt(sum), fmt(sum / 12)].join(";"));
  }

  return new Response(`﻿${lines.join("\r\n")}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="fintrack-categorias-${year}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
