"use client";

import { useCallback, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, Menu, Plus, Search, Settings, X } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { logoutAction } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { TransactionDialog } from "@/components/transactions/transaction-form";
import { initials } from "@/lib/format";
import type { FormOptions } from "@/lib/options";
import { ROLE_LABELS } from "@/lib/constants";
import { Nav } from "./nav";
import { ThemeToggle } from "./theme-toggle";
import { CommandPalette } from "./command-palette";
import { useClickOutside, WorkspaceSwitcher } from "./workspace-switcher";

type Workspace = { id: string; name: string; type: "PERSONAL" | "BUSINESS"; role: "OWNER" | "ADMIN" | "MEMBER" | "VIEWER"; currency: string };

type Props = {
  children: ReactNode;
  user: { name: string; email: string };
  workspace: Workspace;
  workspaces: Workspace[];
  options: FormOptions;
};

function Brand() {
  return <Logo className="px-1" />;
}

function UserMenu({ user, role }: { user: Props["user"]; role: Workspace["role"] }) {
  const [open, setOpen] = useState(false);
  const ref = useClickOutside<HTMLDivElement>(open, () => setOpen(false));
  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen((v) => !v)} aria-label="Menu do usuário" aria-expanded={open} className="flex size-9 items-center justify-center rounded-full bg-primary-soft text-xs font-semibold text-primary">
        {initials(user.name)}
      </button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-60 rounded-xl border border-border bg-surface p-1.5 shadow-xl">
          <div className="px-2.5 py-2">
            <p className="truncate text-sm font-medium">{user.name}</p>
            <p className="truncate text-xs text-muted">{user.email}</p>
            <p className="mt-1 text-[11px] text-muted">Papel neste espaço: {ROLE_LABELS[role]}</p>
          </div>
          <div className="my-1 border-t border-border" />
          <Link href="/configuracoes" onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm hover:bg-surface-2">
            <Settings className="size-4 text-muted" /> Configurações
          </Link>
          <form action={logoutAction}>
            <button type="submit" className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-danger hover:bg-danger-soft">
              <LogOut className="size-4" /> Sair
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

export function AppShell({ children, user, workspace, workspaces, options }: Props) {
  const [drawer, setDrawer] = useState(false);
  const [quickAdd, setQuickAdd] = useState(false);
  const pathname = usePathname();
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setDrawer(false);
  }
  const isBusiness = workspace.type === "BUSINESS";
  const canEdit = workspace.role !== "VIEWER";
  const openQuickAdd = useCallback(() => setQuickAdd(true), []);
  const openSearch = () => window.dispatchEvent(new Event("fintrack:search"));

  const sidebar = (
    <div className="flex h-full flex-col gap-5 p-4">
      <div className="flex items-center justify-between">
        <Brand />
        <button type="button" onClick={() => setDrawer(false)} className="rounded-md p-1 text-muted lg:hidden" aria-label="Fechar menu">
          <X className="size-5" />
        </button>
      </div>
      <WorkspaceSwitcher current={workspace} workspaces={workspaces} />
      <div className="-mx-1 flex-1 overflow-y-auto px-1">
        <Nav isBusiness={isBusiness} onNavigate={() => setDrawer(false)} />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen lg:pl-64">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-border bg-surface lg:block">{sidebar}</aside>

      {drawer && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setDrawer(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 max-w-[85vw] border-r border-border bg-surface shadow-2xl">{sidebar}</aside>
        </div>
      )}

      <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border bg-bg/80 px-4 backdrop-blur sm:px-6">
        <button type="button" onClick={() => setDrawer(true)} className="rounded-lg p-2 text-muted hover:bg-surface-2 lg:hidden" aria-label="Abrir menu">
          <Menu className="size-5" />
        </button>
        <div className="lg:hidden"><Brand /></div>
        <button type="button" onClick={openSearch} className="hidden h-9 w-64 items-center gap-2 rounded-lg border border-border bg-surface px-3 text-sm text-muted transition hover:border-primary/40 md:flex">
          <Search className="size-4" />
          <span className="flex-1 truncate whitespace-nowrap text-left">Buscar...</span>
          <kbd className="rounded border border-border px-1.5 text-[10px]">Ctrl K</kbd>
        </button>
        <div className="ml-auto flex items-center gap-1.5">
          <button type="button" onClick={openSearch} aria-label="Buscar" className="flex size-9 items-center justify-center rounded-lg text-muted hover:bg-surface-2 hover:text-fg md:hidden">
            <Search className="size-4" />
          </button>
          {canEdit && (
            <Button onClick={() => setQuickAdd(true)} className="mr-1">
              <Plus className="size-4" />
              <span className="hidden sm:inline">Novo lançamento</span>
            </Button>
          )}
          <ThemeToggle />
          <UserMenu user={user} role={workspace.role} />
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:py-8">{children}</main>

      <CommandPalette isBusiness={isBusiness} currency={workspace.currency} canEdit={canEdit} onNewTransaction={openQuickAdd} />

      {canEdit && (
        <TransactionDialog open={quickAdd} onClose={() => setQuickAdd(false)} options={options} currency={workspace.currency} />
      )}
    </div>
  );
}
