import type { AccountType, CategoryKind, ContactType, Frequency, Role, WorkspaceType } from "@prisma/client";

export const CURRENCIES = [
  { value: "BRL", label: "Real (R$)" },
  { value: "USD", label: "Dólar (US$)" },
  { value: "EUR", label: "Euro (€)" },
] as const;

export const ACCOUNT_TYPES: Record<AccountType, string> = {
  CHECKING: "Conta corrente",
  SAVINGS: "Poupança",
  CASH: "Dinheiro",
  CREDIT_CARD: "Cartão de crédito",
  INVESTMENT: "Investimento",
  OTHER: "Outra",
};

export const ROLE_LABELS: Record<Role, string> = {
  OWNER: "Proprietário",
  ADMIN: "Administrador",
  MEMBER: "Editor",
  VIEWER: "Leitor",
};

export const WORKSPACE_TYPES: Record<WorkspaceType, string> = {
  PERSONAL: "Pessoal",
  BUSINESS: "Empresa",
};

export const CONTACT_TYPES: Record<ContactType, string> = {
  CUSTOMER: "Cliente",
  SUPPLIER: "Fornecedor",
  BOTH: "Cliente e fornecedor",
};

export const FREQUENCIES: Record<Frequency, string> = {
  WEEKLY: "Semanal",
  MONTHLY: "Mensal",
  YEARLY: "Anual",
};

export const PALETTE = [
  "#6366f1", "#8b5cf6", "#ec4899", "#f43f5e", "#f97316", "#f59e0b",
  "#eab308", "#84cc16", "#10b981", "#14b8a6", "#06b6d4", "#0ea5e9",
  "#3b82f6", "#64748b",
];

export const CATEGORY_ICONS = [
  "Tag", "Utensils", "House", "Car", "Fuel", "HeartPulse", "GraduationCap", "Gamepad2",
  "ShoppingBag", "Shirt", "Plane", "Gift", "Dog", "Baby", "Zap", "Wifi", "Phone",
  "Receipt", "BriefcaseBusiness", "Coins", "HandCoins", "Banknote", "Store", "Truck",
  "Package", "Megaphone", "Wrench", "Laptop", "Scale", "Percent", "Landmark", "Users",
] as const;

type DefaultCategory = { name: string; kind: CategoryKind; icon: string; color: string };

export const PERSONAL_CATEGORIES: DefaultCategory[] = [
  { name: "Salário", kind: "INCOME", icon: "BriefcaseBusiness", color: "#10b981" },
  { name: "Freelance", kind: "INCOME", icon: "Laptop", color: "#14b8a6" },
  { name: "Rendimentos", kind: "INCOME", icon: "Coins", color: "#06b6d4" },
  { name: "Outras receitas", kind: "INCOME", icon: "HandCoins", color: "#84cc16" },
  { name: "Moradia", kind: "EXPENSE", icon: "House", color: "#6366f1" },
  { name: "Alimentação", kind: "EXPENSE", icon: "Utensils", color: "#f97316" },
  { name: "Transporte", kind: "EXPENSE", icon: "Car", color: "#0ea5e9" },
  { name: "Saúde", kind: "EXPENSE", icon: "HeartPulse", color: "#f43f5e" },
  { name: "Educação", kind: "EXPENSE", icon: "GraduationCap", color: "#8b5cf6" },
  { name: "Lazer", kind: "EXPENSE", icon: "Gamepad2", color: "#ec4899" },
  { name: "Compras", kind: "EXPENSE", icon: "ShoppingBag", color: "#f59e0b" },
  { name: "Contas e serviços", kind: "EXPENSE", icon: "Zap", color: "#eab308" },
  { name: "Assinaturas", kind: "EXPENSE", icon: "Wifi", color: "#3b82f6" },
  { name: "Outras despesas", kind: "EXPENSE", icon: "Tag", color: "#64748b" },
];

export const BUSINESS_CATEGORIES: DefaultCategory[] = [
  { name: "Venda de produtos", kind: "INCOME", icon: "Store", color: "#10b981" },
  { name: "Prestação de serviços", kind: "INCOME", icon: "BriefcaseBusiness", color: "#14b8a6" },
  { name: "Receitas financeiras", kind: "INCOME", icon: "Coins", color: "#06b6d4" },
  { name: "Outras receitas", kind: "INCOME", icon: "HandCoins", color: "#84cc16" },
  { name: "Fornecedores", kind: "EXPENSE", icon: "Package", color: "#f97316" },
  { name: "Folha de pagamento", kind: "EXPENSE", icon: "Users", color: "#6366f1" },
  { name: "Impostos e taxas", kind: "EXPENSE", icon: "Landmark", color: "#f43f5e" },
  { name: "Aluguel e condomínio", kind: "EXPENSE", icon: "House", color: "#8b5cf6" },
  { name: "Marketing", kind: "EXPENSE", icon: "Megaphone", color: "#ec4899" },
  { name: "Software e tecnologia", kind: "EXPENSE", icon: "Laptop", color: "#3b82f6" },
  { name: "Logística", kind: "EXPENSE", icon: "Truck", color: "#0ea5e9" },
  { name: "Manutenção", kind: "EXPENSE", icon: "Wrench", color: "#f59e0b" },
  { name: "Tarifas bancárias", kind: "EXPENSE", icon: "Percent", color: "#eab308" },
  { name: "Contabilidade e jurídico", kind: "EXPENSE", icon: "Scale", color: "#64748b" },
];
