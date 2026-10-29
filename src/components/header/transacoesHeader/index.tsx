import { Plus } from "lucide-react";

type TransacoesHeaderProps = {
  onNewTransaction: () => void;
};

export function TransacoesHeader({
  onNewTransaction,
}: TransacoesHeaderProps) {
  return (
    <header className="flex w-full flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div className="max-w-xl">
        <h1 className="my-2 text-2xl font-bold">Transações</h1>
        <p className="text-zinc-400">
          Gerencie suas receitas e despesas, acompanhe seus gastos e mantenha
          seu controle financeiro em dia
        </p>
      </div>

      <button
        type="button"
        onClick={onNewTransaction}
        className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 font-semibold text-white transition-colors hover:bg-blue-500"
      >
        <Plus size={18} />
        Nova transação
      </button>
    </header>
  );
}