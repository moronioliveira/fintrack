"use client";

import { useState, type ReactNode } from "react";
import { Pencil, Plus } from "lucide-react";
import { ActionForm, type ServerAction } from "./action-form";
import { Button } from "./button";
import { Dialog } from "./dialog";

type Props = {
  action: ServerAction;
  title: string;
  description?: string;
  /** Texto do botão de criação. Se omitido, mostra um botão de ícone (editar). */
  triggerLabel?: string;
  triggerVariant?: "primary" | "outline" | "ghost";
  submitLabel?: string;
  size?: "sm" | "md" | "lg";
  children: ReactNode;
};

/** Botão + modal com formulário ligado a uma Server Action (criar/editar cadastros). */
export function EntityDialog({ action, title, description, triggerLabel, triggerVariant = "primary", submitLabel, size, children }: Props) {
  const [open, setOpen] = useState(false);
  return (
    <>
      {triggerLabel ? (
        <Button variant={triggerVariant} onClick={() => setOpen(true)}>
          <Plus className="size-4" /> {triggerLabel}
        </Button>
      ) : (
        <button type="button" onClick={() => setOpen(true)} aria-label={title} title={title} className="flex size-8 items-center justify-center rounded-lg text-muted hover:bg-surface-2 hover:text-fg">
          <Pencil className="size-4" />
        </button>
      )}
      <Dialog open={open} onClose={() => setOpen(false)} title={title} description={description} size={size}>
        <ActionForm action={action} onSuccess={() => setOpen(false)} onCancel={() => setOpen(false)} submitLabel={submitLabel}>
          {children}
        </ActionForm>
      </Dialog>
    </>
  );
}
