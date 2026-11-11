import type { Prisma, WorkspaceType } from "@prisma/client";
import { prisma } from "./prisma";
import { BUSINESS_CATEGORIES, PERSONAL_CATEGORIES } from "./constants";

type NewWorkspace = {
  name: string;
  type: WorkspaceType;
  currency?: string;
  document?: string | null;
};

export async function createWorkspace(
  userId: string,
  input: NewWorkspace,
  tx: Prisma.TransactionClient = prisma,
) {
  const categories = input.type === "BUSINESS" ? BUSINESS_CATEGORIES : PERSONAL_CATEGORIES;
  return tx.workspace.create({
    data: {
      name: input.name,
      type: input.type,
      currency: input.currency ?? "BRL",
      document: input.document || null,
      memberships: { create: { userId, role: "OWNER" } },
      categories: { create: categories },
      accounts: {
        create:
          input.type === "BUSINESS"
            ? [{ name: "Conta empresarial", type: "CHECKING", color: "#6366f1" }]
            : [
                { name: "Conta corrente", type: "CHECKING", color: "#6366f1" },
                { name: "Carteira", type: "CASH", color: "#10b981" },
              ],
      },
      costCenters:
        input.type === "BUSINESS"
          ? { create: [{ name: "Administrativo" }, { name: "Comercial" }, { name: "Operacional" }] }
          : undefined,
    },
  });
}
