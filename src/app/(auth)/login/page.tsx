import type { Metadata } from "next";
import { LoginForm } from "../auth-forms";

export const metadata: Metadata = { title: "Entrar" };

export default function LoginPage() {
  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">Bem-vindo de volta</h1>
      <p className="mb-8 mt-1 text-sm text-muted">Entre para acompanhar suas finanças.</p>
      <LoginForm />
    </>
  );
}
