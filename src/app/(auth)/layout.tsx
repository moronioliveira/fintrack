import { LogoMark } from "@/components/brand/logo";

// Amostra estática de extrato: mostra o produto em vez de ilustrações genéricas.
const SAMPLE = [
  { date: "05/11", description: "Folha de pagamento", category: "Pessoal", value: -9800, status: "Pago" },
  { date: "10/11", description: "Mercado Bom Preço", category: "Vendas", value: 4850.4, status: "Recebido" },
  { date: "12/11", description: "Laticínios Serra", category: "Fornecedores", value: -1214.41, status: "Pago" },
  { date: "20/11", description: "DAS Simples Nacional", category: "Impostos", value: -1808.02, status: "Vence em 9 dias" },
  { date: "25/11", description: "Aluguel do ponto", category: "Aluguel", value: -4500, status: "Agendado" },
];

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1.1fr_1fr]">
      <div className="hidden flex-col justify-between border-r border-white/10 bg-[#0e1320] p-12 text-slate-100 lg:flex">
        <div className="flex items-center gap-2" style={{ ["--logo-accent" as string]: "#2dd4bf" }}>
          <LogoMark className="size-7 text-indigo-300" />
          <span className="text-lg tracking-tight"><span className="font-semibold">fin</span><span className="text-slate-400">track</span></span>
        </div>

        <div className="max-w-lg">
          <h2 className="text-3xl font-semibold leading-tight tracking-tight">O caixa da sua casa ou da sua empresa, em um só lugar.</h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-400">
            Lançamentos, contas a pagar e receber, recorrências, orçamentos e relatórios. Convide sócios ou o contador com permissões separadas.
          </p>

          <div className="mt-10 overflow-hidden rounded-xl border border-white/10 bg-white/[0.03] text-sm">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-2.5 text-xs text-slate-400">
              <span>Lançamentos · Novembro</span>
              <span className="tabular">Saldo previsto {brl.format(18427.97)}</span>
            </div>
            <table className="w-full">
              <tbody>
                {SAMPLE.map((row) => (
                  <tr key={row.description} className="border-b border-white/5 last:border-0">
                    <td className="tabular py-2.5 pl-4 text-xs text-slate-500">{row.date}</td>
                    <td className="px-3 py-2.5">
                      <p className="text-slate-200">{row.description}</p>
                      <p className="text-xs text-slate-500">{row.category} · {row.status}</p>
                    </td>
                    <td className={`tabular py-2.5 pr-4 text-right font-medium ${row.value > 0 ? "text-teal-300" : "text-slate-300"}`}>
                      {row.value > 0 ? "+" : "−"} {brl.format(Math.abs(row.value))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <p className="text-xs text-slate-500">Dados de exemplo.</p>
      </div>

      <div className="flex items-center justify-center px-4 py-12 sm:px-8">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-2 lg:hidden">
            <LogoMark className="size-7 text-primary" />
            <span className="text-lg tracking-tight"><span className="font-semibold">fin</span><span className="text-muted">track</span></span>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
