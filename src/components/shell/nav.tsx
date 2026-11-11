"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowLeftRight, CalendarClock, ChartColumn, ChartLine, LayoutDashboard, PiggyBank, Repeat, Settings, Tags, Target, Users, Wallet,
  type LucideIcon,
} from "lucide-react";

type Item = { href: string; label: string; icon: LucideIcon };

export function getNavGroups(isBusiness: boolean): { title?: string; items: Item[] }[] {
  return [
    {
      items: [
        { href: "/", label: "Visão geral", icon: LayoutDashboard },
        { href: "/lancamentos", label: "Lançamentos", icon: ArrowLeftRight },
        { href: "/agenda", label: isBusiness ? "Contas a pagar/receber" : "A pagar e receber", icon: CalendarClock },
        { href: "/contas", label: "Contas e cartões", icon: Wallet },
      ],
    },
    {
      title: "Planejamento",
      items: [
        { href: "/orcamentos", label: "Orçamentos", icon: PiggyBank },
        { href: "/metas", label: "Metas", icon: Target },
        { href: "/recorrencias", label: "Recorrências", icon: Repeat },
      ],
    },
    {
      title: "Cadastros",
      items: [
        { href: "/categorias", label: "Categorias", icon: Tags },
        { href: "/contatos", label: isBusiness ? "Clientes e fornecedores" : "Contatos", icon: Users },
      ],
    },
    {
      title: "Análise",
      items: [
        { href: "/relatorios", label: "Relatórios", icon: ChartColumn },
        { href: "/projecao", label: "Projeção de caixa", icon: ChartLine },
      ],
    },
    {
      title: "Conta",
      items: [{ href: "/configuracoes", label: "Configurações", icon: Settings }],
    },
  ];
}

export function Nav({ isBusiness, onNavigate }: { isBusiness: boolean; onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-5">
      {getNavGroups(isBusiness).map((group, index) => (
        <div key={group.title ?? index} className="flex flex-col gap-0.5">
          {group.title && <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted/80">{group.title}</p>}
          {group.items.map((item) => {
            const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                aria-current={active ? "page" : undefined}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${
                  active ? "bg-primary-soft font-medium text-primary" : "text-muted hover:bg-surface-2 hover:text-fg"
                }`}
              >
                <Icon className="size-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}
