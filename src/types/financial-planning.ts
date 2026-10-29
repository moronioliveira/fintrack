export type RecurringBill = {
  id: string;
  name: string;
  category: string;
  value: number;
  dueDay: number;
  status: "Pendente" | "Pago";
};

export type NewRecurringBill = Omit<RecurringBill, "id">;

export type FinancialGoal = {
  id: string;
  name: string;
  targetValue: number;
  currentValue: number;
  deadline: string;
};

export type NewFinancialGoal = Omit<FinancialGoal, "id">;

export type Budget = {
  id: string;
  category: string;
  limit: number;
};

export type NewBudget = Omit<Budget, "id">;
