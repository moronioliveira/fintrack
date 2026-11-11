import Link from "next/link";
import type { MatrixRow } from "@/lib/category-matrix";
import { formatMoney } from "@/lib/format";

const MONTHS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

const whole = new Map<string, Intl.NumberFormat>();

/** Valores inteiros (sem centavos) para manter a tabela compacta e uniforme. */
function compact(value: number, currency: string) {
  if (!value) return "–";
  let f = whole.get(currency);
  if (!f) {
    f = new Intl.NumberFormat("pt-BR", { style: "currency", currency, maximumFractionDigits: 0 });
    whole.set(currency, f);
  }
  return f.format(value);
}

function Section({ title, rows, currency, year }: { title: string; rows: MatrixRow[]; currency: string; year: number }) {
  if (!rows.length) return null;
  const totals = Array.from({ length: 12 }, (_, i) => rows.reduce((s, r) => s + r.months[i], 0));
  const sum = totals.reduce((a, b) => a + b, 0);
  return (
    <>
      <tr className="bg-surface-2/60">
        <th colSpan={15} className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-muted">{title}</th>
      </tr>
      {rows.map((r) => (
        <tr key={r.id} className="border-b border-border">
          <td className="sticky left-0 z-[1] bg-surface px-4 py-2">
            <span className="flex items-center gap-2 whitespace-nowrap">
              <span className="size-2 shrink-0 rounded-sm" style={{ background: r.color }} />
              {r.id.endsWith(":none") ? r.name : <Link href={`/lancamentos?categoria=${r.id.split(":")[1]}&mes=todos`} className="hover:underline">{r.name}</Link>}
            </span>
          </td>
          {r.months.map((v, i) => (
            <td key={i} className={`tabular px-3 py-2 text-right ${v ? "" : "text-muted/60"}`}>
              {v ? <Link href={`/lancamentos?mes=${year}-${String(i + 1).padStart(2, "0")}${r.id.endsWith(":none") ? "&categoria=none" : `&categoria=${r.id.split(":")[1]}`}`} className="hover:underline">{compact(v, currency)}</Link> : "–"}
            </td>
          ))}
          <td className="tabular px-3 py-2 text-right font-medium">{formatMoney(r.total, currency)}</td>
          <td className="tabular px-4 py-2 text-right text-muted">{formatMoney(r.total / 12, currency)}</td>
        </tr>
      ))}
      <tr className="border-b-2 border-border font-semibold">
        <td className="sticky left-0 z-[1] bg-surface px-4 py-2">Total</td>
        {totals.map((v, i) => <td key={i} className="tabular px-3 py-2 text-right">{compact(v, currency)}</td>)}
        <td className="tabular px-3 py-2 text-right">{formatMoney(sum, currency)}</td>
        <td className="tabular px-4 py-2 text-right">{formatMoney(sum / 12, currency)}</td>
      </tr>
    </>
  );
}

/** Tabela categoria x mês; cada célula leva aos lançamentos correspondentes. */
export function CategoryMatrixTable({ income, expense, currency, year }: { income: MatrixRow[]; expense: MatrixRow[]; currency: string; year: number }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1100px] text-xs">
        <thead>
          <tr className="border-y border-border text-muted">
            <th className="sticky left-0 z-[1] bg-surface px-4 py-2 text-left font-medium">Categoria</th>
            {MONTHS.map((m) => <th key={m} className="px-3 py-2 text-right font-medium">{m}</th>)}
            <th className="px-3 py-2 text-right font-medium">Total</th>
            <th className="px-4 py-2 text-right font-medium">Média/mês</th>
          </tr>
        </thead>
        <tbody>
          <Section title="Receitas" rows={income} currency={currency} year={year} />
          <Section title="Despesas" rows={expense} currency={currency} year={year} />
        </tbody>
      </table>
    </div>
  );
}
