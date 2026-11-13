"use client";

// Guarda o evento "beforeinstallprompt" (Android/Chrome/Edge) assim que ele chega,
// mesmo antes do botão de instalar aparecer na tela.

export type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

let deferred: BeforeInstallPromptEvent | null = null;
let installed = false;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferred = event as BeforeInstallPromptEvent;
    emit();
  });
  window.addEventListener("appinstalled", () => {
    deferred = null;
    installed = true;
    emit();
  });
}

export function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export const getPrompt = () => deferred;
export const wasInstalled = () => installed;

export async function promptInstall() {
  const event = deferred;
  if (!event) return false;
  await event.prompt();
  const { outcome } = await event.userChoice;
  deferred = null;
  emit();
  return outcome === "accepted";
}
