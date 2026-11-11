"use client";

import { useActionState, useEffect, useRef, type ReactNode } from "react";
import { LoaderCircle } from "lucide-react";
import { initialActionState, type ActionState } from "@/lib/action-state";
import { Button } from "./button";
import { toast } from "./toaster";

export type ServerAction = (state: ActionState, form: FormData) => Promise<ActionState>;

/** Mostra toast ao concluir a ação e dispara `onSuccess`. */
export function useActionFeedback(state: ActionState, onSuccess?: () => void, silentError = false) {
  const handled = useRef<number | undefined>(undefined);
  const callback = useRef(onSuccess);
  useEffect(() => {
    callback.current = onSuccess;
  });
  useEffect(() => {
    if (!state.at || handled.current === state.at) return;
    handled.current = state.at;
    if (state.ok) {
      if (state.message) toast(state.message);
      callback.current?.();
    } else if (state.error && !silentError) {
      toast(state.error, "error");
    }
  }, [state, silentError]);
}

type FormProps = {
  action: ServerAction;
  children: ReactNode;
  submitLabel?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
  className?: string;
  danger?: boolean;
};

/** Formulário padrão: envia para uma Server Action e exibe erros inline. */
export function ActionForm({ action, children, submitLabel = "Salvar", onSuccess, onCancel, className = "", danger }: FormProps) {
  const [state, formAction, pending] = useActionState(action, initialActionState);
  useActionFeedback(state, onSuccess, true);

  return (
    <form action={formAction} className={`flex flex-col gap-4 ${className}`}>
      {children}
      {state.error && !state.ok && (
        <p role="alert" className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">
          {state.error}
        </p>
      )}
      <div className="flex justify-end gap-2 pt-1">
        {onCancel && (
          <Button variant="ghost" onClick={onCancel} disabled={pending}>
            Cancelar
          </Button>
        )}
        <Button type="submit" variant={danger ? "danger" : "primary"} disabled={pending}>
          {pending && <LoaderCircle className="size-4 animate-spin" />}
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}

type ButtonProps = {
  action: ServerAction;
  fields: Record<string, string>;
  children: ReactNode;
  confirm?: string;
  className?: string;
  title?: string;
  disabled?: boolean;
};

/** Botão que dispara uma Server Action com campos ocultos (ex.: excluir, marcar pago). */
export function ActionButton({ action, fields, children, confirm, className = "", title, disabled }: ButtonProps) {
  const [state, formAction, pending] = useActionState(action, initialActionState);
  useActionFeedback(state);

  return (
    <form
      action={formAction}
      onSubmit={(event) => {
        if (confirm && !window.confirm(confirm)) event.preventDefault();
      }}
      className="contents"
    >
      {Object.entries(fields).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      <button type="submit" title={title} aria-label={title} disabled={pending || disabled} className={`disabled:opacity-50 ${className}`}>
        {pending ? <LoaderCircle className="size-4 animate-spin" /> : children}
      </button>
    </form>
  );
}
