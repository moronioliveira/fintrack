"use client";

import { TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AppError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
      <span className="flex size-12 items-center justify-center rounded-2xl bg-danger-soft text-danger">
        <TriangleAlert className="size-5" />
      </span>
      <div>
        <h1 className="text-lg font-semibold">Algo deu errado</h1>
        <p className="mt-1 text-sm text-muted">Não foi possível carregar esta página. Tente novamente em instantes.</p>
      </div>
      <Button onClick={reset}>Tentar novamente</Button>
    </div>
  );
}
