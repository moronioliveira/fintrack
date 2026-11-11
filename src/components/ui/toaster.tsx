"use client";

import { useEffect, useState } from "react";
import { CircleAlert, CircleCheck, X } from "lucide-react";

type Toast = { id: number; message: string; tone: "success" | "error" };

const EVENT = "fintrack:toast";

export function toast(message: string, tone: Toast["tone"] = "success") {
  window.dispatchEvent(new CustomEvent(EVENT, { detail: { message, tone } }));
}

export function Toaster() {
  const [items, setItems] = useState<Toast[]>([]);

  useEffect(() => {
    function onToast(event: Event) {
      const { message, tone } = (event as CustomEvent<Omit<Toast, "id">>).detail;
      const id = Date.now() + Math.random();
      setItems((current) => [...current.slice(-3), { id, message, tone }]);
      window.setTimeout(() => setItems((current) => current.filter((t) => t.id !== id)), 4000);
    }
    window.addEventListener(EVENT, onToast);
    return () => window.removeEventListener(EVENT, onToast);
  }, []);

  return (
    <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-4 z-[100] flex flex-col items-center gap-2 px-4 sm:items-end sm:pr-6">
      {items.map((t) => (
        <div
          key={t.id}
          role="status"
          className="animate-toast pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border border-border bg-surface px-4 py-3 text-sm shadow-lg"
        >
          {t.tone === "success" ? (
            <CircleCheck className="mt-0.5 size-4 shrink-0 text-success" />
          ) : (
            <CircleAlert className="mt-0.5 size-4 shrink-0 text-danger" />
          )}
          <p className="flex-1">{t.message}</p>
          <button
            type="button"
            aria-label="Fechar"
            onClick={() => setItems((current) => current.filter((x) => x.id !== t.id))}
            className="text-muted hover:text-fg"
          >
            <X className="size-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
