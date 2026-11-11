"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, CornerDownLeft, LoaderCircle, Plus, Search } from "lucide-react";
import { searchTransactions, type SearchResult } from "@/actions/search";
import { formatDate } from "@/lib/dates";
import { formatMoney } from "@/lib/format";
import { getNavGroups } from "./nav";

type Entry =
  | { kind: "page"; label: string; href: string }
  | { kind: "action"; label: string; run: () => void }
  | { kind: "tx"; item: SearchResult };

type Props = { isBusiness: boolean; currency: string; canEdit: boolean; onNewTransaction: () => void };

function normalize(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

export function CommandPalette({ isBusiness, currency, canEdit, onNewTransaction }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [index, setIndex] = useState(0);
  const [pending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((v) => !v);
      }
    }
    function onOpen() {
      setOpen(true);
    }
    window.addEventListener("keydown", onKey);
    window.addEventListener("fintrack:search", onOpen);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("fintrack:search", onOpen);
    };
  }, []);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      inputRef.current?.focus();
    }
    if (!open && dialog.open) dialog.close();
  }, [open]);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) return;
    const timeout = window.setTimeout(() => {
      startTransition(async () => setResults(await searchTransactions(q)));
    }, 200);
    return () => window.clearTimeout(timeout);
  }, [query]);

  const entries = useMemo<Entry[]>(() => {
    const q = normalize(query.trim());
    const pages: Entry[] = getNavGroups(isBusiness)
      .flatMap((g) => g.items)
      .filter((item) => !q || normalize(item.label).includes(q))
      .map((item) => ({ kind: "page", label: item.label, href: item.href }));
    const actions: Entry[] = canEdit && (!q || "novo lancamento receita despesa transferencia".includes(q))
      ? [{ kind: "action", label: "Novo lançamento", run: onNewTransaction }]
      : [];
    const txs: Entry[] = query.trim().length >= 2 ? results.map((item) => ({ kind: "tx", item })) : [];
    return [...actions, ...pages, ...txs];
  }, [query, results, isBusiness, canEdit, onNewTransaction]);

  function close() {
    setOpen(false);
    setQuery("");
    setResults([]);
    setIndex(0);
  }

  function select(entry: Entry | undefined) {
    if (!entry) return;
    close();
    if (entry.kind === "page") router.push(entry.href);
    else if (entry.kind === "action") entry.run();
    else router.push(`/lancamentos?mes=${entry.item.date.slice(0, 7)}&busca=${encodeURIComponent(entry.item.description)}`);
  }

  const safeIndex = Math.min(index, Math.max(0, entries.length - 1));

  return (
    <dialog
      ref={dialogRef}
      onClose={close}
      onClick={(e) => { if (e.target === dialogRef.current) close(); }}
      className="mx-auto mt-[12vh] w-[calc(100%-2rem)] max-w-xl overflow-hidden rounded-2xl border border-border bg-surface p-0 text-fg shadow-2xl"
    >
      {open && (
        <div>
          <div className="flex items-center gap-3 border-b border-border px-4">
            {pending ? <LoaderCircle className="size-4 animate-spin text-muted" /> : <Search className="size-4 text-muted" />}
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => { setQuery(e.target.value); setIndex(0); }}
              onKeyDown={(e) => {
                if (e.key === "ArrowDown") { e.preventDefault(); setIndex((i) => Math.min(i + 1, entries.length - 1)); }
                if (e.key === "ArrowUp") { e.preventDefault(); setIndex((i) => Math.max(i - 1, 0)); }
                if (e.key === "Enter") { e.preventDefault(); select(entries[safeIndex]); }
              }}
              placeholder="Buscar páginas ou lançamentos..."
              className="h-12 flex-1 bg-transparent text-sm outline-none placeholder:text-muted focus-visible:outline-none"
              aria-label="Buscar"
            />
            <kbd className="rounded border border-border px-1.5 py-0.5 text-[10px] text-muted">Esc</kbd>
          </div>
          <ul className="max-h-[50vh] overflow-y-auto p-2" role="listbox">
            {entries.length === 0 && <li className="px-3 py-8 text-center text-sm text-muted">Nada encontrado para “{query}”.</li>}
            {entries.map((entry, i) => {
              const activeClass = i === safeIndex ? "bg-surface-2" : "";
              const showHeader = i === 0 || entries[i - 1].kind !== entry.kind;
              const header = entry.kind === "tx" ? "Lançamentos" : entry.kind === "page" ? "Páginas" : "Ações";
              return (
                <li key={entry.kind === "tx" ? entry.item.id : entry.label} role="option" aria-selected={i === safeIndex}>
                  {showHeader && <p className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wider text-muted">{header}</p>}
                  <button
                    type="button"
                    onMouseEnter={() => setIndex(i)}
                    onClick={() => select(entry)}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm ${activeClass}`}
                  >
                    {entry.kind === "tx" ? (
                      <>
                        <span className="tabular w-11 shrink-0 text-xs text-muted">{formatDate(entry.item.date).slice(0, 5)}</span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate">{entry.item.description}</span>
                          <span className="block truncate text-xs text-muted">{entry.item.category ?? "Sem categoria"}{entry.item.status === "PENDING" ? " · pendente" : ""}</span>
                        </span>
                        <span className={`tabular text-xs font-medium ${entry.item.type === "INCOME" ? "text-success" : ""}`}>
                          {entry.item.type === "INCOME" ? "+" : entry.item.type === "EXPENSE" ? "−" : ""} {formatMoney(entry.item.amount, currency)}
                        </span>
                      </>
                    ) : (
                      <>
                        {entry.kind === "action" ? <Plus className="size-4 text-primary" /> : <ArrowRight className="size-4 text-muted" />}
                        <span className="flex-1">{entry.label}</span>
                        {i === safeIndex && <CornerDownLeft className="size-3.5 text-muted" />}
                      </>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </dialog>
  );
}
