"use client";

import { FormEvent, useEffect, useState } from "react";

type User = { name: string; email: string; currency: string; theme: string };

export default function Configuracoes() {
  const [user, setUser] = useState<User | null>(null);
  const [name, setName] = useState("");
  const [currency, setCurrency] = useState("BRL");
  const [theme, setTheme] = useState("dark");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/auth/me").then((response) => response.json()).then((result) => {
      if (result.user) {
        setUser(result.user);
        setName(result.user.name);
        setCurrency(result.user.currency);
        setTheme(result.user.theme);
      }
    });
  }, []);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");
    const response = await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, currency, theme, newPassword }),
    });
    const result = await response.json();
    if (!response.ok) {
      setError(result.error ?? "Não foi possível salvar as configurações.");
      return;
    }
    setUser(result.user);
    setNewPassword("");
    setMessage("Configurações salvas com sucesso.");
  }

  return (
    <div className="space-y-7">
      <div><p className="mb-2 text-sm font-medium text-blue-400">Preferências</p><h1 className="text-3xl font-bold tracking-tight">Configurações</h1><p className="mt-2 text-sm text-slate-500">Gerencie seu perfil, moeda e segurança.</p></div>
      <form onSubmit={save} className="max-w-2xl space-y-5">
        <section className="rounded-2xl border border-white/[0.07] bg-white/[0.035] p-5 sm:p-6">
          <h2 className="font-semibold text-white">Perfil</h2>
          <p className="mt-1 text-sm text-slate-500">{user?.email ?? "Carregando..."}</p>
          <label className="mt-5 block text-sm text-slate-300">Nome<input required minLength={2} value={name} onChange={(event) => setName(event.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-[#0b111d] px-3.5 py-3 text-white outline-none focus:border-blue-500" /></label>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="text-sm text-slate-300">Moeda<select value={currency} onChange={(event) => setCurrency(event.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-[#0b111d] px-3.5 py-3 text-white outline-none focus:border-blue-500"><option value="BRL">Real brasileiro (BRL)</option><option value="USD">Dólar (USD)</option><option value="EUR">Euro (EUR)</option></select></label>
            <label className="text-sm text-slate-300">Aparência<select value={theme} onChange={(event) => setTheme(event.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-[#0b111d] px-3.5 py-3 text-white outline-none focus:border-blue-500"><option value="dark">Escuro</option><option value="light">Claro</option></select></label>
          </div>
        </section>
        <section className="rounded-2xl border border-white/[0.07] bg-white/[0.035] p-5 sm:p-6">
          <h2 className="font-semibold text-white">Segurança</h2>
          <label className="mt-5 block text-sm text-slate-300">Nova senha<input minLength={8} type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} placeholder="Deixe em branco para manter a atual" className="mt-2 w-full rounded-xl border border-white/10 bg-[#0b111d] px-3.5 py-3 text-white outline-none focus:border-blue-500" /></label>
        </section>
        {error && <p role="alert" className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">{error}</p>}
        {message && <p role="status" className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">{message}</p>}
        <button className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-500">Salvar configurações</button>
      </form>
    </div>
  );
}
