"use client";

import { useEffect, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { FunnelX, LoaderCircle, Search } from "lucide-react";
import { Input, Select } from "@/components/ui/field";
import type { FormOptions } from "@/lib/options";
import type { TxFilters } from "@/lib/transaction-filters";

export function TransactionFiltersBar({ options, filters }: { options: FormOptions; filters: TxFilters }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [search, setSearch] = useState(filters.busca ?? "");

  function update(changes: Record<string, string | undefined>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(changes)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    params.delete("pagina");
    startTransition(() => router.replace(`${pathname}${params.size ? `?${params}` : ""}`, { scroll: false }));
  }

  useEffect(() => {
    if (search === (filters.busca ?? "")) return;
    const timeout = window.setTimeout(() => update({ busca: search.trim() || undefined }), 350);
    return () => window.clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const hasFilters = !!(filters.tipo || filters.status || filters.conta || filters.categoria || filters.contato || filters.centro || filters.busca);
  const select = "h-9 w-[calc(50%-0.25rem)] text-xs sm:w-auto sm:text-sm";

  return (
    <div className="no-print mb-4 flex flex-col gap-2 rounded-2xl border border-border bg-surface p-3">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por descrição ou observação" className="h-9 pl-9" aria-label="Buscar" />
        {pending && <LoaderCircle className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted" />}
      </div>
      <div className="flex flex-wrap gap-2">
        <Select className={select} value={filters.tipo ?? ""} onChange={(e) => update({ tipo: e.target.value || undefined })} aria-label="Tipo">
          <option value="">Todos os tipos</option>
          <option value="INCOME">Receitas</option>
          <option value="EXPENSE">Despesas</option>
          <option value="TRANSFER">Transferências</option>
        </Select>
        <Select className={select} value={filters.status ?? ""} onChange={(e) => update({ status: e.target.value || undefined })} aria-label="Situação">
          <option value="">Qualquer situação</option>
          <option value="PAID">Pagos / recebidos</option>
          <option value="PENDING">Pendentes</option>
          <option value="OVERDUE">Atrasados</option>
        </Select>
        <Select className={select} value={filters.conta ?? ""} onChange={(e) => update({ conta: e.target.value || undefined })} aria-label="Conta">
          <option value="">Todas as contas</option>
          {options.accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
        </Select>
        <Select className={select} value={filters.categoria ?? ""} onChange={(e) => update({ categoria: e.target.value || undefined })} aria-label="Categoria">
          <option value="">Todas as categorias</option>
          <option value="none">Sem categoria</option>
          <optgroup label="Receitas">
            {options.categories.filter((c) => c.kind === "INCOME").map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </optgroup>
          <optgroup label="Despesas">
            {options.categories.filter((c) => c.kind === "EXPENSE").map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </optgroup>
        </Select>
        {options.contacts.length > 0 && (
          <Select className={select} value={filters.contato ?? ""} onChange={(e) => update({ contato: e.target.value || undefined })} aria-label="Contato">
            <option value="">Todos os contatos</option>
            {options.contacts.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
        )}
        {options.costCenters.length > 0 && (
          <Select className={select} value={filters.centro ?? ""} onChange={(e) => update({ centro: e.target.value || undefined })} aria-label="Centro de custo">
            <option value="">Todos os centros</option>
            {options.costCenters.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
        )}
        <Select className={select} value={filters.mes === "todos" ? "todos" : "mes"} onChange={(e) => update({ mes: e.target.value === "todos" ? "todos" : undefined })} aria-label="Período">
          <option value="mes">Por mês</option>
          <option value="todos">Todo o período</option>
        </Select>
        {hasFilters && (
          <button
            type="button"
            onClick={() => {
              setSearch("");
              update({ tipo: undefined, status: undefined, conta: undefined, categoria: undefined, contato: undefined, centro: undefined, busca: undefined });
            }}
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg px-3 text-xs font-medium text-muted hover:bg-surface-2 hover:text-fg"
          >
            <FunnelX className="size-4" /> Limpar
          </button>
        )}
      </div>
    </div>
  );
}
