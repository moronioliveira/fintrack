import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { currentMonth, formatMonth, shiftMonth } from "@/lib/dates";

type Props = { month: string; basePath: string; params?: Record<string, string | undefined> };

function href(basePath: string, params: Record<string, string | undefined>, month: string) {
  const search = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v && k !== "mes" && k !== "pagina") search.set(k, v);
  if (month !== currentMonth()) search.set("mes", month);
  const qs = search.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}

export function MonthPicker({ month, basePath, params = {} }: Props) {
  const isCurrent = month === currentMonth();
  const linkClass = "flex size-9 items-center justify-center rounded-lg text-muted hover:bg-surface-2 hover:text-fg";
  return (
    <div className="flex items-center gap-1 rounded-xl border border-border bg-surface p-1">
      <Link href={href(basePath, params, shiftMonth(month, -1))} className={linkClass} aria-label="Mês anterior">
        <ChevronLeft className="size-4" />
      </Link>
      <span className="min-w-36 text-center text-sm font-medium">{formatMonth(month)}</span>
      <Link href={href(basePath, params, shiftMonth(month, 1))} className={linkClass} aria-label="Próximo mês">
        <ChevronRight className="size-4" />
      </Link>
      {!isCurrent && (
        <Link href={href(basePath, params, currentMonth())} className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-primary hover:bg-primary-soft">
          Hoje
        </Link>
      )}
    </div>
  );
}
