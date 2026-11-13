"use client";

import { useEffect } from "react";
import "./install-store";

// Registra o service worker (só em produção, para não atrapalhar o "next dev").
export function PwaRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" }).catch(() => {
      // sem service worker o app continua funcionando normalmente no navegador
    });
  }, []);
  return null;
}
