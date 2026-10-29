"use client";

import { X } from "lucide-react";
import { FormEvent, useState } from "react";
import type { NewTransaction, TipoTransacao } from "@/types/transaction";
import type { Transaction } from "@/types/transaction";
import { useTransactions } from "@/contexts/transactions-context";
import Link from "next/link";

type FormProps = {
  onSave?: (transaction: NewTransaction) => void;
  onClose?: () => void;
  initialTransaction?: Transaction | null;
};

export function Form({ onSave, onClose, initialTransaction }: FormProps) {
  const [descricao, setDescricao] = useState(initialTransaction?.description ?? "");
  const [valor, setValor] = useState(initialTransaction ? Math.abs(initialTransaction.value).toString().replace(".", ",") : "");
  const [tipo, setTipo] = useState<TipoTransacao>(initialTransaction?.type ?? "Despesa");
  const [categoria, setCategoria] = useState(initialTransaction?.category ?? "");
  const [data, setData] = useState(initialTransaction?.date ?? "");
  const [erro, setErro] = useState("");
  const { categorias } = useTransactions();

  function handleValorChange(value: string) {
    const somenteNumerosEVirgula = value.replace(/[^\d,]/g, "");
    const [parteInteira, parteDecimal] = somenteNumerosEVirgula.split(",");
    const valorFormatado = somenteNumerosEVirgula.includes(",")
      ? `${parteInteira},${parteDecimal.slice(0, 2)}`
      : parteInteira;

    setValor(valorFormatado);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const valorComoNumero = Number(valor.replace(",", "."));

    if (!descricao || !valor || !categoria || !data) {
      setErro("Preencha todos os campos para continuar.");
      return;
    }

    if (!/^\d+(,\d{1,2})?$/.test(valor) || Number.isNaN(valorComoNumero) || valorComoNumero <= 0) {
      setErro("Digite um valor maior que zero usando a vírgula para os centavos. Ex.: 150,50.");
      return;
    }

    setErro("");
    const novaTransacao: NewTransaction = {
      description: descricao,
      value: tipo === "Despesa" ? -Math.abs(valorComoNumero) : Math.abs(valorComoNumero),
      type: tipo,
      category: categoria,
      date: data,
    };

    onSave?.(novaTransacao);
    setDescricao("");
    setValor("");
    setTipo("Despesa");
    setCategoria("");
    setData("");
  }

  return (
    <div
      role="dialog"
      aria-labelledby="nova-transacao-title"
      className="w-full rounded-2xl border border-white/[0.07] bg-white/[0.035] p-5 shadow-2xl shadow-black/10 sm:p-6"
    >
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 id="nova-transacao-title" className="text-lg font-bold text-white">
          {initialTransaction ? "Editar transação" : "Nova transação"}
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            {initialTransaction ? "Atualize os dados da movimentação" : "Registre uma nova movimentação"}
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar formulário"
          className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-white/[0.06] hover:text-white"
        >
          <X size={20} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        {erro && (
          <p role="alert" className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
            {erro}
          </p>
        )}
        <label htmlFor="descricao" className="text-sm font-medium text-slate-300">
          Descrição
        </label>
        <input
          id="descricao"
          type="text"
          value={descricao}
          onChange={(event) => setDescricao(event.target.value)}
          aria-invalid={Boolean(erro && !descricao)}
          className="rounded-xl border border-white/[0.1] bg-[#0b111d] px-3.5 py-2.5 text-sm text-white outline-none transition-colors placeholder:text-slate-600 focus:border-blue-500"
        />

        <label htmlFor="valor" className="text-sm font-medium text-slate-300">
          Valor
        </label>
        <input
          id="valor"
          type="text"
          inputMode="decimal"
          value={valor}
          onChange={(event) => handleValorChange(event.target.value)}
          placeholder="Ex.: 150,00"
          aria-describedby="valor-ajuda"
          className="rounded-xl border border-white/[0.1] bg-[#0b111d] px-3.5 py-2.5 text-sm text-white outline-none transition-colors placeholder:text-slate-600 focus:border-blue-500"
        />
        <p id="valor-ajuda" className="-mt-1 text-xs text-slate-600">
          Digite somente números. Use a vírgula para os centavos.
        </p>

        <fieldset className="flex flex-col gap-2">
          <legend className="text-sm font-medium text-slate-300">Tipo</legend>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setTipo("Receita")}
              className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                tipo === "Receita"
                  ? "border-emerald-500 bg-emerald-500/10 text-emerald-400"
                  : "border-white/[0.1] text-slate-500 hover:border-white/20 hover:text-white"
              }`}
            >
              Receita
            </button>
            <button
              type="button"
              onClick={() => setTipo("Despesa")}
              className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                tipo === "Despesa"
                  ? "border-rose-500 bg-rose-500/10 text-rose-400"
                  : "border-white/[0.1] text-slate-500 hover:border-white/20 hover:text-white"
              }`}
            >
              Despesa
            </button>
          </div>
        </fieldset>

        <label htmlFor="categoria" className="text-sm font-medium text-slate-300">
          Categoria
        </label>
        <select
          id="categoria"
          value={categoria}
          onChange={(event) => setCategoria(event.target.value)}
          className="rounded-xl border border-white/[0.1] bg-[#0b111d] px-3.5 py-2.5 text-sm text-white outline-none transition-colors focus:border-blue-500"
        >
          <option value="">Selecione uma categoria</option>
          {categorias.map((categoriaDaLista) => (
            <option key={categoriaDaLista.id} value={categoriaDaLista.name}>
              {categoriaDaLista.name}
            </option>
          ))}
        </select>
        {categorias.length === 0 && (
          <Link href="/categorias" className="text-xs text-blue-400 hover:text-blue-300">
            Cadastre uma categoria antes de criar a transação
          </Link>
        )}

        <label htmlFor="data" className="text-sm font-medium text-slate-300">
          Data
        </label>
        <input
          id="data"
          type="date"
          value={data}
          onChange={(event) => setData(event.target.value)}
          className="rounded-xl border border-white/[0.1] bg-[#0b111d] px-3.5 py-2.5 text-sm text-white outline-none transition-colors focus:border-blue-500"
        />

        <button
          type="submit"
          className="mt-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-900/20 transition-colors hover:bg-blue-500"
        >
          {initialTransaction ? "Salvar alterações" : "Salvar transação"}
        </button>
      </form>
    </div>
  );
}