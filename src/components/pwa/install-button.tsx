"use client";

import { useState, useSyncExternalStore } from "react";
import { Download, PlusSquare, Share } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { getPrompt, promptInstall, subscribe, wasInstalled } from "./install-store";

const noop = () => () => {};

function isStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function isIos() {
  const ua = navigator.userAgent;
  return /iphone|ipad|ipod/i.test(ua) || (ua.includes("Macintosh") && navigator.maxTouchPoints > 1);
}

export function InstallButton() {
  const prompt = useSyncExternalStore(subscribe, getPrompt, () => null);
  const installed = useSyncExternalStore(subscribe, wasInstalled, () => false);
  const standalone = useSyncExternalStore(noop, isStandalone, () => true);
  const ios = useSyncExternalStore(noop, isIos, () => false);
  const [help, setHelp] = useState(false);

  if (standalone || installed) return null;
  if (!prompt && !ios) return null;

  function handleClick() {
    if (prompt) void promptInstall();
    else setHelp(true);
  }

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        aria-label="Instalar aplicativo"
        title="Instalar aplicativo"
        className="flex h-9 items-center justify-center gap-2 rounded-lg px-2.5 text-sm font-medium text-primary hover:bg-primary-soft"
      >
        <Download className="size-4" />
        <span className="hidden xl:inline">Instalar app</span>
      </button>

      <Dialog open={help} onClose={() => setHelp(false)} title="Instalar o FinTrack" description="Abra o FinTrack direto da tela inicial, em tela cheia." size="sm">
        <ol className="space-y-4 text-sm">
          <li className="flex items-start gap-3">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary-soft text-xs font-semibold text-primary">1</span>
            <span className="pt-1">
              No Safari, toque em <Share className="mx-0.5 inline size-4 align-text-bottom text-primary" /> <strong>Compartilhar</strong>, na barra de baixo (ou no topo, no iPad).
            </span>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary-soft text-xs font-semibold text-primary">2</span>
            <span className="pt-1">
              Role e escolha <PlusSquare className="mx-0.5 inline size-4 align-text-bottom text-primary" /> <strong>Adicionar à Tela de Início</strong>.
            </span>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary-soft text-xs font-semibold text-primary">3</span>
            <span className="pt-1">Toque em <strong>Adicionar</strong>. Pronto: o ícone do FinTrack aparece junto com seus apps.</span>
          </li>
        </ol>
        <p className="mt-4 text-xs text-muted">Se estiver usando outro navegador no iPhone, abra este endereço no Safari primeiro.</p>
      </Dialog>
    </>
  );
}
