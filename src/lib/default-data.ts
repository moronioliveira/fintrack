import type { Category } from "@/types/category";
import type { FinancialGoal, RecurringBill, Budget } from "@/types/financial-planning";
import type { Transaction } from "@/types/transaction";

export type PersistedData = {
  transacoes: Transaction[];
  categorias: Category[];
  contasRecorrentes: RecurringBill[];
  metasFinanceiras: FinancialGoal[];
  orcamentos: Budget[];
};

export const defaultData: PersistedData = {
  transacoes: [],
  categorias: [
    { id: "alimentacao", name: "Alimentação", icon: "Utensils" },
    { id: "moradia", name: "Moradia", icon: "House" },
    { id: "transporte", name: "Transporte", icon: "Car" },
    { id: "saude", name: "Saúde", icon: "HeartPulse" },
    { id: "educacao", name: "Educação", icon: "GraduationCap" },
    { id: "lazer", name: "Lazer", icon: "Gamepad2" },
    { id: "compras", name: "Compras", icon: "ShoppingBag" },
    { id: "salario", name: "Salário", icon: "BriefcaseBusiness" },
  ],
  contasRecorrentes: [],
  metasFinanceiras: [],
  orcamentos: [],
};
