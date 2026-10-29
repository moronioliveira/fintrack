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
import type {
  FinancialGoal,
  NewFinancialGoal,
  NewRecurringBill,
  RecurringBill,
  Budget,
  NewBudget,
} from "@/types/financial-planning";

type TransactionsContextValue = {
  transacoes: Transaction[];
  adicionarTransacao: (transacao: NewTransaction) => void;
  atualizarTransacao: (id: string, transacao: NewTransaction) => void;
  removerTransacao: (id: string) => void;
  categorias: Category[];
  adicionarCategoria: (name: string, icon: string) => void;
  editarCategoria: (id: string, name: string, icon: string) => void;
  removerCategoria: (id: string) => boolean;
  contasRecorrentes: RecurringBill[];
  adicionarContaRecorrente: (conta: NewRecurringBill) => void;
  atualizarContaRecorrente: (id: string, conta: NewRecurringBill) => void;
  removerContaRecorrente: (id: string) => void;
  alternarStatusConta: (id: string) => void;
  metasFinanceiras: FinancialGoal[];
  adicionarMetaFinanceira: (meta: NewFinancialGoal) => void;
  atualizarMetaFinanceira: (id: string, meta: NewFinancialGoal) => void;
  removerMetaFinanceira: (id: string) => void;
  orcamentos: Budget[];
  adicionarOrcamento: (orcamento: NewBudget) => void;
  atualizarOrcamento: (id: string, orcamento: NewBudget) => void;
  removerOrcamento: (id: string) => void;
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
  const [contasRecorrentes, setContasRecorrentes] = useState<RecurringBill[]>([]);
  const [metasFinanceiras, setMetasFinanceiras] = useState<FinancialGoal[]>([]);
  const [orcamentos, setOrcamentos] = useState<Budget[]>([]);

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

  const adicionarContaRecorrente = useCallback((conta: NewRecurringBill) => {
    setContasRecorrentes((atuais) => [{ ...conta, id: crypto.randomUUID() }, ...atuais]);
  }, []);

  const atualizarContaRecorrente = useCallback((id: string, conta: NewRecurringBill) => {
    setContasRecorrentes((atuais) => atuais.map((atual) => atual.id === id ? { ...conta, id } : atual));
  }, []);

  const removerContaRecorrente = useCallback((id: string) => {
    setContasRecorrentes((atuais) => atuais.filter((conta) => conta.id !== id));
  }, []);

  const alternarStatusConta = useCallback((id: string) => {
    setContasRecorrentes((atuais) => atuais.map((conta) => conta.id === id
      ? { ...conta, status: conta.status === "Pago" ? "Pendente" : "Pago" }
      : conta));
  }, []);

  const adicionarMetaFinanceira = useCallback((meta: NewFinancialGoal) => {
    setMetasFinanceiras((atuais) => [{ ...meta, id: crypto.randomUUID() }, ...atuais]);
  }, []);

  const atualizarMetaFinanceira = useCallback((id: string, meta: NewFinancialGoal) => {
    setMetasFinanceiras((atuais) => atuais.map((atual) => atual.id === id ? { ...meta, id } : atual));
  }, []);

  const removerMetaFinanceira = useCallback((id: string) => {
    setMetasFinanceiras((atuais) => atuais.filter((meta) => meta.id !== id));
  }, []);

  const adicionarOrcamento = useCallback((orcamento: NewBudget) => {
    setOrcamentos((atuais) => {
      const existente = atuais.find((item) => item.category === orcamento.category);
      if (existente) {
        return atuais.map((item) => item.id === existente.id ? { ...orcamento, id: item.id } : item);
      }
      return [...atuais, { ...orcamento, id: crypto.randomUUID() }];
    });
  }, []);

  const atualizarOrcamento = useCallback((id: string, orcamento: NewBudget) => {
    setOrcamentos((atuais) => atuais.map((item) => item.id === id ? { ...orcamento, id } : item));
  }, []);

  const removerOrcamento = useCallback((id: string) => {
    setOrcamentos((atuais) => atuais.filter((item) => item.id !== id));
  }, []);

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
      contasRecorrentes,
      adicionarContaRecorrente,
      atualizarContaRecorrente,
      removerContaRecorrente,
      alternarStatusConta,
      metasFinanceiras,
      adicionarMetaFinanceira,
      atualizarMetaFinanceira,
      removerMetaFinanceira,
      orcamentos,
      adicionarOrcamento,
      atualizarOrcamento,
      removerOrcamento,
    }),
    [transacoes, adicionarTransacao, atualizarTransacao, removerTransacao, categorias, adicionarCategoria, editarCategoria, removerCategoria, contasRecorrentes, adicionarContaRecorrente, atualizarContaRecorrente, removerContaRecorrente, alternarStatusConta, metasFinanceiras, adicionarMetaFinanceira, atualizarMetaFinanceira, removerMetaFinanceira, orcamentos, adicionarOrcamento, atualizarOrcamento, removerOrcamento],
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
