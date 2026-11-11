import type { Metadata } from "next";
import Link from "next/link";
import { CircleAlert, Landmark, TrendingDown, TrendingUp } from "lucide-react";
import { getContext } from "@/lib/auth";
import { getCashProjection } from "@/lib/projection";
import { addDays, diffInDays, formatDate, todayISO } from "@/lib/dates";
import { formatMoney } from "@/lib/format";
import { Badge, Card, CardHeader, PageHeader, StatCard } from "@/components/ui/primitives";
import { ProjectionChart } from "@/components/charts/projection-chart";

export const metadata: Metadata = { title: "Projeção de caixa" };

const RANGES = [30, 60, 90, 180] as const;

export default async function ProjectionPage({ searchParams }: PageProps<"/projecao">) {
  const { dias } = await searchParams;
  const days = RANGES.find((r) => String(r) === dias) ?? 90;
  const { workspace } = await getContext();
  const currency = workspace.currency;
  const { startBalance, series, items, lowest, firstNegative } = await getCashProjection(workspace.id, days);
  const end = series[series.length - 1];
  const totalIn = items.filter((i) => i.type === "INCOME").reduce((s, i) => s + i.amount, 0);
  const totalOut = items.filter((i) => i.type === "EXPENSE").reduce((s, i) => s + i.amount, 0);
  const today = todayISO();

  // Agrupa por semana para a tabela.
  const weeks = Array.from({ length: Math.ceil((days + 1) / 7) }, (_, w) => {
    const from = addDays(today, w * 7);
    const to = addDays(today, Math.min(days, w * 7 + 6));
    const slice = series.filter((d) => d.date >= from && d.date <= to);
    return {
      from,
      to,
      income: slice.reduce((s, d) => s + d.income, 0),
      expense: slice.reduce((s, d) => s + d.expense, 0),
      closing: slice[slice.length - 1]?.balance ?? 0,
    };
  });

  return (
    <div>
      <PageHeader
        title="Projeção de caixa"
        description="Saldo futuro estimado com base em contas a pagar, a receber e recorrências."
        actions={
          <div className="flex gap-1 rounded-xl border border-border bg-surface p-1">
            {RANGES.map((r) => (
              <Link
                key={r}
                href={r === 90 ? "/projecao" : `/projecao?dias=${r}`}
                className={`rounded-lg px-3 py-1.5 text-sm ${r === days ? "bg-primary-soft font-medium text-primary" : "text-muted hover:text-fg"}`}
              >
                {r} dias
              </Link>
            ))}
          </div>
        }
      />

      {firstNegative && (
        <div className="mb-4 flex items-start gap-3 rounded-2xl border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger">
          <CircleAlert className="mt-0.5 size-5 shrink-0" />
          <p>
            O saldo fica negativo em <strong>{formatDate(firstNegative.date)}</strong> (daqui a {diffInDays(today, firstNegative.date)} dias) e chega a{" "}
            <strong>{formatMoney(lowest.balance, currency)}</strong> em {formatDate(lowest.date)}. Antecipe recebimentos ou renegocie vencimentos antes disso.
          </p>
        </div>
      )}

      <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Saldo hoje" value={formatMoney(startBalance, currency)} icon={Landmark} tone="primary" />
        <StatCard label={`Saldo em ${days} dias`} value={formatMoney(end.balance, currency)} icon={end.balance >= startBalance ? TrendingUp : TrendingDown} tone={end.balance < 0 ? "danger" : end.balance >= startBalance ? "success" : "warning"} footer={<>Variação de {formatMoney(end.balance - startBalance, currency, { signed: true })}</>} />
        <StatCard label="Menor saldo no período" value={formatMoney(lowest.balance, currency)} icon={TrendingDown} tone={lowest.balance < 0 ? "danger" : "neutral"} footer={`Em ${formatDate(lowest.date)}`} />
        <StatCard label="Entradas x saídas previstas" value={formatMoney(totalIn - totalOut, currency, { signed: true })} icon={TrendingUp} tone={totalIn - totalOut >= 0 ? "success" : "danger"} footer={<>{formatMoney(totalIn, currency)} a receber · {formatMoney(totalOut, currency)} a pagar</>} />
      </div>

      <Card className="mb-4">
        <CardHeader title="Saldo projetado por dia" description="Lançamentos atrasados entram como se fossem pagos hoje." />
        <div className="p-5 pt-4"><ProjectionChart data={series} currency={currency} /></div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="overflow-hidden lg:col-span-2">
          <CardHeader title="Resumo semanal" />
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-y border-border bg-surface-2/60 text-left text-xs text-muted">
                  <th className="px-4 py-2 font-medium">Semana</th>
                  <th className="px-4 py-2 text-right font-medium">Entradas</th>
                  <th className="px-4 py-2 text-right font-medium">Saídas</th>
                  <th className="px-4 py-2 text-right font-medium">Saldo final</th>
                </tr>
              </thead>
              <tbody>
                {weeks.map((w) => (
                  <tr key={w.from} className="border-b border-border last:border-0">
                    <td className="tabular whitespace-nowrap px-4 py-2 text-muted">{formatDate(w.from).slice(0, 5)} a {formatDate(w.to).slice(0, 5)}</td>
                    <td className="tabular px-4 py-2 text-right">{w.income ? formatMoney(w.income, currency) : "–"}</td>
                    <td className="tabular px-4 py-2 text-right">{w.expense ? formatMoney(w.expense, currency) : "–"}</td>
                    <td className={`tabular px-4 py-2 text-right font-medium ${w.closing < 0 ? "text-danger" : ""}`}>{formatMoney(w.closing, currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader title="Movimentações previstas" description={`${items.length} item(ns) até ${formatDate(end.date)}`} action={<Link href="/agenda" className="text-xs font-medium text-primary hover:underline">A pagar e receber</Link>} />
          <ul className="mt-2 max-h-[28rem] overflow-y-auto">
            {items.length ? items.map((it, i) => (
              <li key={`${it.date}-${it.description}-${i}`} className="flex items-center gap-3 border-b border-border px-5 py-2.5 text-sm last:border-0">
                <span className="tabular w-12 shrink-0 text-xs text-muted">{formatDate(it.date).slice(0, 5)}</span>
                <span className="min-w-0 flex-1 truncate">{it.description}</span>
                {it.overdue && <Badge tone="danger">Atrasado</Badge>}
                {it.source === "recurring" && <Badge>Recorrência</Badge>}
                <span className={`tabular whitespace-nowrap font-medium ${it.type === "INCOME" ? "text-success" : ""}`}>
                  {it.type === "INCOME" ? "+" : "−"} {formatMoney(it.amount, currency)}
                </span>
              </li>
            )) : <li className="px-5 py-8 text-center text-sm text-muted">Nenhuma movimentação prevista. Cadastre contas pendentes ou recorrências.</li>}
          </ul>
        </Card>
      </div>
    </div>
  );
}
