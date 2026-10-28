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
        <div>
            <ul className="text-white flex flex-col gap-2">
                {navLinks.map((link) => {
                    const Icon = link.icon;
                    // Verifica se o link é a página atual
                    const isActive = pathname === link.href;

                    return (
                        <li key={link.href}>
                            <Link 
                                href={link.href}
                                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 ${
                                    isActive 
                                        ? "bg-sky-500/10 text-sky-400 font-semibold" // Ativo
                                        : "text-zinc-400 hover:text-white hover:bg-zinc-800/50" // Normal / Hover
                                }`}
                            >
                                <Icon size={18} /> 
                                <span>{link.name}</span>
                            </Link>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}
