export type ActionState = {
  ok: boolean;
  error?: string;
  message?: string;
  /** Muda a cada execução para que o cliente reaja mesmo a mensagens repetidas. */
  at?: number;
};

export const initialActionState: ActionState = { ok: false };
