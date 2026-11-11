"use client";

import { useActionState, useRef } from "react";
import { useActionFeedback, type ServerAction } from "@/components/ui/action-form";
import { initialActionState } from "@/lib/action-state";
import { ROLE_LABELS } from "@/lib/constants";

export function MemberRoleSelect({ action, id, role }: { action: ServerAction; id: string; role: string }) {
  const [state, formAction, pending] = useActionState(action, initialActionState);
  const formRef = useRef<HTMLFormElement>(null);
  useActionFeedback(state);
  return (
    <form ref={formRef} action={formAction}>
      <input type="hidden" name="id" value={id} />
      <select
        name="role"
        defaultValue={role}
        disabled={pending}
        onChange={() => formRef.current?.requestSubmit()}
        aria-label="Permissão"
        className="h-8 rounded-lg border border-border bg-surface px-2 text-xs"
      >
        <option value="ADMIN">{ROLE_LABELS.ADMIN}</option>
        <option value="MEMBER">{ROLE_LABELS.MEMBER}</option>
        <option value="VIEWER">{ROLE_LABELS.VIEWER}</option>
      </select>
    </form>
  );
}
