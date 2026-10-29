import { Plus } from "lucide-react";

type TransacoesHeaderProps = {
  onNewTransaction: () => void;
};

export function TransacoesHeader({
  onNewTransaction,
}: TransacoesHeaderProps) {
  return (
    <header className="flex w-full flex-col gap-5 md:flex-row md:items-end md:justify-between">
      <div className="max-w-2xl">
        <p className="mb-2 text-sm font-medium text-blue-400">Movimentações</p>
        <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
          Transações
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Gerencie suas receitas e despesas, acompanhe seus gastos e mantenha
          seu controle financeiro em dia
        </p>
      </div>

      <button
        type="button"
        onClick={onNewTransaction}
        className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-950/25 transition-colors hover:bg-blue-500"
      >
        <Plus size={18} />
        Nova transação
      </button>
    </header>
  );
}