import { Filter, RotateCcw, Search } from "lucide-react";
import type { Category } from "@/types/category";
import type { TipoTransacao } from "@/types/transaction";

export type TransactionFiltersState = {
  search: string;
  type: TipoTransacao | "Todos";
  category: string;
  startDate: string;
  endDate: string;
};

type Props = {
  filters: TransactionFiltersState;
  categories: Category[];
  onChange: (filters: TransactionFiltersState) => void;
};

const initialFilters: TransactionFiltersState = {
  search: "",
  type: "Todos",
  category: "Todas",
  startDate: "",
  endDate: "",
};

export function TransactionFilters({ filters, categories, onChange }: Props) {
  const hasActiveFilters = JSON.stringify(filters) !== JSON.stringify(initialFilters);

  return (
    <div className="mb-5 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
      <div className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-300">
        <Filter size={16} className="text-blue-400" />
        Filtrar transações
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <label className="relative sm:col-span-2 lg:col-span-1">
          <span className="sr-only">Buscar por descrição</span>
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="search"
            value={filters.search}
            onChange={(event) => onChange({ ...filters, search: event.target.value })}
            placeholder="Buscar descrição"
            className="w-full rounded-xl border border-white/[0.1] bg-[#0b111d] py-2.5 pl-9 pr-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-blue-500"
          />
        </label>
        <label>
          <span className="sr-only">Filtrar por tipo</span>
          <select
            value={filters.type}
            onChange={(event) => onChange({ ...filters, type: event.target.value as TipoTransacao | "Todos" })}
            className="w-full rounded-xl border border-white/[0.1] bg-[#0b111d] px-3 py-2.5 text-sm text-white outline-none focus:border-blue-500"
          >
            <option value="Todos">Todos os tipos</option>
            <option value="Receita">Receitas</option>
            <option value="Despesa">Despesas</option>
          </select>
        </label>
        <label>
          <span className="sr-only">Filtrar por categoria</span>
          <select
            value={filters.category}
            onChange={(event) => onChange({ ...filters, category: event.target.value })}
            className="w-full rounded-xl border border-white/[0.1] bg-[#0b111d] px-3 py-2.5 text-sm text-white outline-none focus:border-blue-500"
          >
            <option value="Todas">Todas as categorias</option>
            {categories.map((category) => (
              <option key={category.id} value={category.name}>{category.name}</option>
            ))}
          </select>
        </label>
        <label>
          <span className="mb-1.5 block text-xs text-slate-500">A partir de</span>
          <input
            type="date"
            value={filters.startDate}
            onChange={(event) => onChange({ ...filters, startDate: event.target.value })}
            className="w-full rounded-xl border border-white/[0.1] bg-[#0b111d] px-3 py-2.5 text-sm text-white outline-none focus:border-blue-500"
          />
        </label>
        <label>
          <span className="mb-1.5 block text-xs text-slate-500">Até</span>
          <input
            type="date"
            value={filters.endDate}
            onChange={(event) => onChange({ ...filters, endDate: event.target.value })}
            className="w-full rounded-xl border border-white/[0.1] bg-[#0b111d] px-3 py-2.5 text-sm text-white outline-none focus:border-blue-500"
          />
        </label>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={() => onChange(initialFilters)}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/[0.1] px-3 py-2.5 text-sm text-slate-400 transition-colors hover:border-white/20 hover:text-white"
          >
            <RotateCcw size={15} />
            Limpar filtros
          </button>
        )}
      </div>
    </div>
  );
}
