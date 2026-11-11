import { revalidatePath } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import { PermissionError } from "./auth";

import type { ActionState } from "./action-state";

export type { ActionState } from "./action-state";

export class ValidationError extends Error {}

/** Executa uma mutação, padroniza erros e revalida a aplicação. */
export async function runAction(fn: () => Promise<string | void>): Promise<ActionState> {
  try {
    const message = await fn();
    revalidatePath("/", "layout");
    return { ok: true, message: message ?? "Salvo com sucesso.", at: Date.now() };
  } catch (error) {
    unstable_rethrow(error);
    if (error instanceof ValidationError || error instanceof PermissionError) {
      return { ok: false, error: error.message, at: Date.now() };
    }
    console.error("Falha ao executar ação:", error);
    return { ok: false, error: "Não foi possível concluir a operação. Tente novamente.", at: Date.now() };
  }
}
