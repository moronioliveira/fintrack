import { Wallet } from "lucide-react";
import Link from "next/link";

export function Header(){
  return (
    <header className="border-b border-white/[0.06] bg-[#0d1320]/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1440px] items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/15 text-blue-400 ring-1 ring-blue-400/20">
            <Wallet size={21} />
          </span>
          <span>
            <strong className="block text-lg tracking-tight text-white">FinTrack</strong>
            <span className="hidden text-xs text-slate-500 sm:block">Seu dinheiro, no controle</span>
          </span>
        </Link>
        <div className="hidden items-center gap-3 sm:flex">
          <span className="rounded-lg border border-blue-400/15 bg-blue-400/10 px-3 py-1.5 text-xs font-medium text-blue-300">
            Sessão local
          </span>
          <div className="ml-3 flex h-9 w-9 items-center justify-center rounded-full bg-slate-800 text-sm font-bold text-slate-300 ring-1 ring-white/10">
            U
          </div>
        </div>
      </div>
    </header>
  );
}