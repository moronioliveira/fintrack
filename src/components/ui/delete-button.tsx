"use client";

import { Trash } from "lucide-react";
import { ActionButton, type ServerAction } from "./action-form";

export function DeleteButton({ action, id, confirm, label = "Excluir" }: { action: ServerAction; id: string; confirm: string; label?: string }) {
  return (
    <ActionButton
      action={action}
      fields={{ id }}
      confirm={confirm}
      title={label}
      className="flex size-8 items-center justify-center rounded-lg text-muted hover:bg-danger-soft hover:text-danger"
    >
      <Trash className="size-4" />
    </ActionButton>
  );
}
