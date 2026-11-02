"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { Wallet } from "lucide-react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [modoCadastro, setModoCadastro] = useState(false);
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setEnviando(true);
    setErro("");
    try {
      const response = await fetch(modoCadastro ? "/api/auth/register" : "/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: nome, email, password: senha }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) {
        setErro(result?.error ?? "Não foi possível concluir o acesso.");
        return;
      }
      router.replace("/");
      router.refresh();
    } catch {
      setErro("Não foi possível conectar ao servidor. Tente novamente.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <main className="flex min-h-[70vh] items-center justify-center">
      <div className="w-full max-w-md rounded-2xl border border-white/[0.08] bg-white/[0.035] p-6 shadow-2xl shadow-black/20 sm:p-8">
        <div className="mb-7 flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/15 text-blue-400"><Wallet size={22} /></span>
          <div><p className="text-lg font-bold text-white">FinTrack</p><p className="text-xs text-slate-500">Seu dinheiro, no controle</p></div>
        </div>
        <h1 className="text-2xl font-bold text-white">{modoCadastro ? "Crie sua conta" : "Bem-vindo de volta"}</h1>
        <p className="mt-2 text-sm text-slate-500">{modoCadastro ? "Seus dados ficam isolados e protegidos." : "Acesse seus dados financeiros com segurança."}</p>
        <form onSubmit={submit} className="mt-6 space-y-4">
          {modoCadastro && <label className="block text-sm text-slate-300">Nome<input required value={nome} onChange={(event) => setNome(event.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-[#0b111d] px-3.5 py-3 text-white outline-none focus:border-blue-500" /></label>}
          <label className="block text-sm text-slate-300">E-mail<input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-[#0b111d] px-3.5 py-3 text-white outline-none focus:border-blue-500" /></label>
          <label className="block text-sm text-slate-300">Senha<input required minLength={8} type="password" value={senha} onChange={(event) => setSenha(event.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-[#0b111d] px-3.5 py-3 text-white outline-none focus:border-blue-500" /></label>
          {erro && <p role="alert" className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">{erro}</p>}
          <button disabled={enviando} className="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-60">{enviando ? "Aguarde..." : modoCadastro ? "Criar conta" : "Entrar"}</button>
        </form>
        <button type="button" onClick={() => { setModoCadastro(!modoCadastro); setErro(""); }} className="mt-5 w-full text-center text-sm text-blue-400 hover:text-blue-300">{modoCadastro ? "Já tenho uma conta" : "Ainda não tenho uma conta"}</button>
        <Link href="/" className="mt-4 block text-center text-xs text-slate-600 hover:text-slate-400">Voltar</Link>
      </div>
    </main>
  );
}
