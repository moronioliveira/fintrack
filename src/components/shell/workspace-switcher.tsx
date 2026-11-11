"use client";

import { useEffect, useRef, useState } from "react";
import { Building, Check, ChevronsUpDown, Plus, User } from "lucide-react";
import { createWorkspaceAction, switchWorkspace } from "@/actions/workspace";
import { ActionForm } from "@/components/ui/action-form";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input, Select } from "@/components/ui/field";
import { CURRENCIES } from "@/lib/constants";

type Workspace = { id: string; name: string; type: "PERSONAL" | "BUSINESS"; role: string };

export function useClickOutside<T extends HTMLElement>(open: boolean, close: () => void) {
  const ref = useRef<T>(null);
  useEffect(() => {
    if (!open) return;
    function handle(event: MouseEvent | KeyboardEvent) {
      if (event instanceof KeyboardEvent ? event.key === "Escape" : !ref.current?.contains(event.target as Node)) close();
    }
    document.addEventListener("mousedown", handle);
    document.addEventListener("keydown", handle);
    return () => {
      document.removeEventListener("mousedown", handle);
      document.removeEventListener("keydown", handle);
    };
  }, [open, close]);
  return ref;
}

function WorkspaceIcon({ type }: { type: Workspace["type"] }) {
  const Icon = type === "BUSINESS" ? Building : User;
  return (
    <span className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${type === "BUSINESS" ? "bg-warning-soft text-warning" : "bg-primary-soft text-primary"}`}>
      <Icon className="size-4" />
    </span>
  );
}

export function WorkspaceSwitcher({ current, workspaces }: { current: Workspace; workspaces: Workspace[] }) {
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [type, setType] = useState<"PERSONAL" | "BUSINESS">("BUSINESS");
  const ref = useClickOutside<HTMLDivElement>(open, () => setOpen(false));

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 rounded-xl border border-border bg-surface p-2 text-left transition hover:bg-surface-2"
      >
        <WorkspaceIcon type={current.type} />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium">{current.name}</span>
          <span className="block text-xs text-muted">{current.type === "BUSINESS" ? "Empresa" : "Pessoal"}</span>
        </span>
        <ChevronsUpDown className="size-4 text-muted" />
      </button>

      {open && (
        <div className="absolute inset-x-0 top-full z-50 mt-2 rounded-xl border border-border bg-surface p-1.5 shadow-xl">
          <p className="px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted">Seus espaços</p>
          {workspaces.map((w) => (
            <form key={w.id} action={switchWorkspace.bind(null, w.id)}>
              <button type="submit" className="flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left text-sm hover:bg-surface-2">
                <WorkspaceIcon type={w.type} />
                <span className="min-w-0 flex-1 truncate">{w.name}</span>
                {w.id === current.id && <Check className="size-4 text-primary" />}
              </button>
            </form>
          ))}
          <div className="my-1 border-t border-border" />
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              setCreating(true);
            }}
            className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-sm text-primary hover:bg-surface-2"
          >
            <Plus className="size-4" /> Novo espaço (pessoal ou empresa)
          </button>
        </div>
      )}

      <Dialog open={creating} onClose={() => setCreating(false)} title="Novo espaço" description="Separe finanças pessoais e de cada empresa. Você pode convidar outras pessoas depois.">
        <ActionForm action={createWorkspaceAction} submitLabel="Criar espaço" onCancel={() => setCreating(false)}>
          <div className="grid grid-cols-2 gap-2">
            {(["BUSINESS", "PERSONAL"] as const).map((t) => (
              <label key={t} className={`flex cursor-pointer items-center gap-2 rounded-xl border p-3 text-sm ${type === t ? "border-primary bg-primary-soft" : "border-border"}`}>
                <input type="radio" name="type" value={t} checked={type === t} onChange={() => setType(t)} className="sr-only" />
                <WorkspaceIcon type={t} />
                {t === "BUSINESS" ? "Empresa" : "Pessoal"}
              </label>
            ))}
          </div>
          <Field label={type === "BUSINESS" ? "Nome da empresa" : "Nome do espaço"}>
            <Input name="name" required placeholder={type === "BUSINESS" ? "Ex.: Padaria Pão Quente LTDA" : "Ex.: Família"} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            {type === "BUSINESS" && (
              <Field label="CNPJ (opcional)">
                <Input name="document" placeholder="00.000.000/0000-00" />
              </Field>
            )}
            <Field label="Moeda">
              <Select name="currency" defaultValue="BRL">
                {CURRENCIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </Select>
            </Field>
          </div>
        </ActionForm>
      </Dialog>
    </div>
  );
}
