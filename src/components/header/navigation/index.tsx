"use client"

import { ArrowLeftRight, Bolt, LayoutDashboard, Tags } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function Navigation(){
    const pathname = usePathname();

    // Estrutura de dados para os links da navegação
    const navLinks = [
        { name: "Dashboard", href: "/", icon: LayoutDashboard },
        { name: "Transações", href: "/transacoes", icon: ArrowLeftRight },
        { name: "Categorias", href: "/categorias", icon: Tags },
        { name: "Configurações", href: "/configuracoes", icon: Bolt },
    ];

    return (
        <nav className="lg:sticky lg:top-6">
            <p className="mb-3 hidden px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-600 lg:block">Menu principal</p>
            <ul className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible">
                {navLinks.map((link) => {
                    const Icon = link.icon;
                    // Verifica se o link é a página atual
                    const isActive = pathname === link.href;

                    return (
                        <li key={link.href}>
                            <Link 
                                href={link.href}
                                className={`flex min-w-max items-center gap-3 rounded-xl px-3.5 py-3 text-sm transition-all duration-200 ${
                                    isActive 
                                        ? "bg-blue-500/15 font-semibold text-blue-300 ring-1 ring-blue-400/15"
                                        : "text-slate-500 hover:bg-white/[0.04] hover:text-slate-200"
                                }`}
                            >
                                <Icon size={18} /> 
                                <span>{link.name}</span>
                            </Link>
                        </li>
                    );
                })}
            </ul>
        </nav>
    );
}
