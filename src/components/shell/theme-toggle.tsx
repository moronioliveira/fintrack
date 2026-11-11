"use client";

import { Moon, Sun } from "lucide-react";

export function ThemeToggle() {
  function toggle() {
    const root = document.documentElement;
    const next = root.dataset.theme === "dark" ? "light" : "dark";
    root.dataset.theme = next;
    try {
      localStorage.setItem("fintrack-theme", next);
    } catch {
      // armazenamento indisponível: o tema vale só para esta visita
    }
  }

  return (
    <button type="button" onClick={toggle} aria-label="Alternar tema claro/escuro" title="Alternar tema" className="flex size-9 items-center justify-center rounded-lg text-muted hover:bg-surface-2 hover:text-fg">
      <Sun className="hidden size-4 dark:block" />
      <Moon className="size-4 dark:hidden" />
    </button>
  );
}
