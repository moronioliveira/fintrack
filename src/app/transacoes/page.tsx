"use client";

import { useState } from "react";
import type { Transaction } from "@/types/transaction";
import { CardsResumo } from "@/components/cards/cardResumo";
import { Form } from "@/components/form";
import { TransacoesHeader } from "@/components/header/transacoesHeader";
import { ListaTransacoes } from "@/components/listaTransacoes";
import { useTransactions } from "@/contexts/transactions-context";

export default function Transacoes() {
  const [formAberto, setFormAberto] = useState(false);
  const [transacaoEmEdicao, setTransacaoEmEdicao] = useState<Transaction | null>(null);
  const [mensagem, setMensagem] = useState("");
  const { transacoes, categorias, adicionarTransacao, atualizarTransacao, removerTransacao } = useTransactions();

  return (
    <div className="flex flex-col gap-8">
      {mensagem && (
        <p role="status" aria-live="polite" className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300 shadow-lg shadow-emerald-950/10">
          {mensagem}
        </p>
      )}
      <TransacoesHeader onNewTransaction={() => setFormAberto(true)} />

      <CardsResumo transacoes={transacoes} categorias={categorias} />

      <div className="flex flex-col items-start gap-6 xl:flex-row">
        <section className={formAberto ? "w-full xl:flex-1" : "w-full"}>
          <ListaTransacoes
            transacoes={transacoes}
            onDelete={removerTransacao}
            categories={categorias}
            onAdd={() => {
              setTransacaoEmEdicao(null);
              setFormAberto(true);
            }}
            onEdit={(transacao) => {
              setTransacaoEmEdicao(transacao);
              setFormAberto(true);
            }}
          />
        </section>

        {formAberto && (
          <aside className="w-full xl:sticky xl:top-6 xl:w-[380px]">
            <Form
              key={transacaoEmEdicao?.id ?? "nova-transacao"}
              initialTransaction={transacaoEmEdicao}
              onSave={(transacao) => {
                if (transacaoEmEdicao) {
                  atualizarTransacao(transacaoEmEdicao.id, transacao);
                } else {
                  adicionarTransacao(transacao);
                }
                setMensagem(transacaoEmEdicao ? "Transação atualizada com sucesso." : "Transação adicionada com sucesso.");
                window.setTimeout(() => setMensagem(""), 3000);
                setTransacaoEmEdicao(null);
                setFormAberto(false);
              }}
              onClose={() => {
                setTransacaoEmEdicao(null);
                setFormAberto(false);
              }}
            />
          </aside>
        )}
      </div>
    </div>
  );
}