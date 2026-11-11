"use client";

import { Check, RotateCcw } from "lucide-react";
import { toggleTransactionStatus } from "@/actions/transactions";
import { ActionButton } from "@/components/ui/action-form";

export function PayButton({ id, status, type, compact }: { id: string; status: "PAID" | "PENDING"; type: string; compact?: boolean }) {
  const pending = status === "PENDING";
  const label = pending ? (type === "INCOME" ? "Receber" : "Pagar") : "Desfazer";
  return (
    <ActionButton
      action={toggleTransactionStatus}
      fields={{ id }}
      title={pending ? `Marcar como ${type === "INCOME" ? "recebido" : "pago"}` : "Voltar para pendente"}
      className={
        pending
          ? "inline-flex h-8 items-center gap-1.5 rounded-lg border border-border bg-surface px-2.5 text-xs font-medium hover:border-success hover:bg-success-soft hover:text-success"
          : "inline-flex size-8 items-center justify-center rounded-lg text-muted hover:bg-surface-2 hover:text-fg"
      }
    >
      {pending ? <><Check className="size-3.5" />{!compact && label}</> : <RotateCcw className="size-3.5" />}
    </ActionButton>
  );
}
