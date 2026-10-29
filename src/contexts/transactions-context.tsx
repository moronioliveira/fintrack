"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { NewTransaction, Transaction } from "@/types/transaction";
import type { Category } from "@/types/category";

type TransactionsContextValue = {
  transacoes: Transaction[];
  adicionarTransacao: (transacao: NewTransaction) => void;
  atualizarTransacao: (id: string, transacao: NewTransaction) => void;
  removerTransacao: (id: string) => void;
  categorias: Category[];
  adicionarCategoria: (name: string, icon: string) => void;
  editarCategoria: (id: string, name: string, icon: string) => void;
  removerCategoria: (id: string) => boolean;
};

const TransactionsContext = createContext<TransactionsContextValue | null>(
  null,
);

export function TransactionsProvider({ children }: { children: ReactNode }) {
  const [transacoes, setTransacoes] = useState<Transaction[]>([]);
  const [categorias, setCategorias] = useState<Category[]>([
    { id: "alimentacao", name: "Alimentação", icon: "Utensils" },
    { id: "moradia", name: "Moradia", icon: "House" },
    { id: "transporte", name: "Transporte", icon: "Car" },
    { id: "saude", name: "Saúde", icon: "HeartPulse" },
    { id: "educacao", name: "Educação", icon: "GraduationCap" },
    { id: "lazer", name: "Lazer", icon: "Gamepad2" },
    { id: "compras", name: "Compras", icon: "ShoppingBag" },
    { id: "salario", name: "Salário", icon: "BriefcaseBusiness" },
  ]);

  const adicionarTransacao = useCallback((transacao: NewTransaction) => {
    setTransacoes((transacoesAtuais) => [
      { ...transacao, id: crypto.randomUUID() },
      ...transacoesAtuais,
    ]);
  }, []);

  const atualizarTransacao = useCallback((id: string, transacao: NewTransaction) => {
    setTransacoes((transacoesAtuais) =>
      transacoesAtuais.map((transacaoAtual) =>
        transacaoAtual.id === id ? { ...transacao, id } : transacaoAtual,
      ),
    );
  }, []);

  const removerTransacao = useCallback((id: string) => {
    setTransacoes((transacoesAtuais) =>
      transacoesAtuais.filter((transacao) => transacao.id !== id),
    );
  }, []);

  const adicionarCategoria = useCallback((name: string, icon: string) => {
    const nome = name.trim();
    if (!nome) return;
    setCategorias((categoriasAtuais) => {
      if (categoriasAtuais.some((categoria) => categoria.name.toLowerCase() === nome.toLowerCase())) {
        return categoriasAtuais;
      }
      return [...categoriasAtuais, { id: crypto.randomUUID(), name: nome, icon }];
    });
  }, []);

  const editarCategoria = useCallback((id: string, name: string, icon: string) => {
    const nome = name.trim();
    if (!nome) return;
    setCategorias((categoriasAtuais) =>
      categoriasAtuais.map((categoria) => categoria.id === id ? { ...categoria, name: nome, icon } : categoria),
    );
    setTransacoes((transacoesAtuais) =>
      transacoesAtuais.map((transacao) => {
        const categoria = categorias.find((item) => item.id === id);
        return categoria && transacao.category === categoria.name
          ? { ...transacao, category: nome }
          : transacao;
      }),
    );
  }, [categorias]);

  const removerCategoria = useCallback((id: string) => {
    const categoria = categorias.find((item) => item.id === id);
    if (!categoria || transacoes.some((transacao) => transacao.category === categoria.name)) {
      return false;
    }
    setCategorias((categoriasAtuais) => categoriasAtuais.filter((item) => item.id !== id));
    return true;
  }, [categorias, transacoes]);

  const value = useMemo(
    () => ({
      transacoes,
      adicionarTransacao,
      atualizarTransacao,
      removerTransacao,
      categorias,
      adicionarCategoria,
      editarCategoria,
      removerCategoria,
    }),
    [transacoes, adicionarTransacao, atualizarTransacao, removerTransacao, categorias, adicionarCategoria, editarCategoria, removerCategoria],
  );

  return (
    <TransactionsContext.Provider value={value}>
      {children}
    </TransactionsContext.Provider>
  );
}

export function useTransactions() {
  const context = useContext(TransactionsContext);

  if (!context) {
    throw new Error(
      "useTransactions deve ser usado dentro de TransactionsProvider.",
    );
  }

  return context;
}
