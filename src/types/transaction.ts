export type TipoTransacao = "Receita" | "Despesa";

export type Transaction = {
  id: string;
  date: string;
  description: string;
  category: string;
  type: TipoTransacao;
  value: number;
};

export type NewTransaction = Omit<Transaction, "id">;
