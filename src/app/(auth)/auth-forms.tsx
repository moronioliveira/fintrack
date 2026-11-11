"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Building, LoaderCircle, User } from "lucide-react";
import { loginAction, registerAction } from "@/actions/auth";
import { initialActionState } from "@/lib/action-state";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";

function ErrorBox({ error }: { error?: string }) {
  if (!error) return null;
  return <p role="alert" className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">{error}</p>;
}

export function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, initialActionState);
  return (
    <form action={action} className="flex flex-col gap-4">
      <Field label="E-mail">
        <Input type="email" name="email" autoComplete="email" required placeholder="voce@exemplo.com" />
      </Field>
      <Field label="Senha">
        <Input type="password" name="password" autoComplete="current-password" required placeholder="••••••••" />
      </Field>
      <ErrorBox error={state.error} />
      <Button type="submit" disabled={pending} className="mt-1 w-full">
        {pending && <LoaderCircle className="size-4 animate-spin" />} Entrar
      </Button>
      <p className="text-center text-sm text-muted">
        Ainda não tem conta? <Link href="/cadastro" className="font-medium text-primary hover:underline">Criar conta grátis</Link>
      </p>
    </form>
  );
}

export function RegisterForm() {
  const [state, action, pending] = useActionState(registerAction, initialActionState);
  const [usage, setUsage] = useState<"PERSONAL" | "BUSINESS">("PERSONAL");
  return (
    <form action={action} className="flex flex-col gap-4">
      <div>
        <span className="text-xs font-medium text-muted">Como você vai usar?</span>
        <div className="mt-1.5 grid grid-cols-2 gap-2">
          {([
            { value: "PERSONAL", label: "Pessoal", hint: "Minhas finanças", icon: User },
            { value: "BUSINESS", label: "Empresa", hint: "Meu negócio", icon: Building },
          ] as const).map((o) => {
            const Icon = o.icon;
            return (
              <label key={o.value} className={`flex cursor-pointer items-center gap-2.5 rounded-xl border p-3 transition ${usage === o.value ? "border-primary bg-primary-soft" : "border-border hover:bg-surface-2"}`}>
                <input type="radio" name="usage" value={o.value} checked={usage === o.value} onChange={() => setUsage(o.value)} className="sr-only" />
                <Icon className={`size-5 ${usage === o.value ? "text-primary" : "text-muted"}`} />
                <span>
                  <span className="block text-sm font-medium">{o.label}</span>
                  <span className="block text-xs text-muted">{o.hint}</span>
                </span>
              </label>
            );
          })}
        </div>
      </div>
      <Field label="Seu nome">
        <Input name="name" autoComplete="name" required minLength={2} placeholder="Maria Silva" />
      </Field>
      {usage === "BUSINESS" && (
        <Field label="Nome da empresa">
          <Input name="company" autoComplete="organization" required minLength={2} placeholder="Minha Empresa LTDA" />
        </Field>
      )}
      <Field label="E-mail">
        <Input type="email" name="email" autoComplete="email" required placeholder="voce@exemplo.com" />
      </Field>
      <Field label="Senha" hint="Mínimo de 8 caracteres.">
        <Input type="password" name="password" autoComplete="new-password" required minLength={8} placeholder="••••••••" />
      </Field>
      <ErrorBox error={state.error} />
      <Button type="submit" disabled={pending} className="mt-1 w-full">
        {pending && <LoaderCircle className="size-4 animate-spin" />} Criar conta
      </Button>
      <p className="text-center text-sm text-muted">
        Já tem conta? <Link href="/login" className="font-medium text-primary hover:underline">Entrar</Link>
      </p>
    </form>
  );
}
