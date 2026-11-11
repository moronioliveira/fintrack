import type { Metadata } from "next";
import { RegisterForm } from "../auth-forms";

export const metadata: Metadata = { title: "Criar conta" };

export default function RegisterPage() {
  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">Crie sua conta</h1>
      <p className="mb-8 mt-1 text-sm text-muted">Comece em menos de um minuto. Categorias e contas iniciais já vêm prontas.</p>
      <RegisterForm />
    </>
  );
}
