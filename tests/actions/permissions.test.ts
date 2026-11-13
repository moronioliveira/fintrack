import { beforeEach, describe, expect, it, vi } from "vitest";

// Banco "espião": qualquer método de qualquer modelo vira um mock registrado.
const m = vi.hoisted(() => {
  class PermissionError extends Error {}
  const calls: string[] = [];
  const models = new Map<string, Record<string, unknown>>();
  const prisma = new Proxy({}, {
    get: (_t, model: string) => {
      if (!models.has(model)) {
        models.set(model, new Proxy({}, {
          get: (_m, method: string) => (...args: unknown[]) => { calls.push(`${model}.${method}`); void args; return Promise.resolve(null); },
        }));
      }
      return models.get(model);
    },
  });
  return { PermissionError, prisma, calls, requireRole: vi.fn(), getContext: vi.fn(), getCurrentUser: vi.fn() };
});

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({ unstable_rethrow: vi.fn(), redirect: vi.fn() }));
vi.mock("@prisma/client", () => ({ Prisma: { PrismaClientKnownRequestError: class extends Error {} } }));
vi.mock("@/lib/prisma", () => ({ prisma: m.prisma }));
vi.mock("@/lib/session", () => ({ setActiveWorkspaceCookie: vi.fn() }));
vi.mock("@/lib/workspace", () => ({ createWorkspace: vi.fn() }));
vi.mock("bcryptjs", () => ({ default: { compare: vi.fn(), hash: vi.fn() } }));
vi.mock("@/lib/auth", () => ({
  requireRole: m.requireRole,
  getContext: m.getContext,
  getCurrentUser: m.getCurrentUser,
  PermissionError: m.PermissionError,
}));

import * as transactions from "@/actions/transactions";
import * as planning from "@/actions/planning";
import * as accounts from "@/actions/accounts";
import * as categories from "@/actions/categories";
import * as contacts from "@/actions/contacts";
import * as workspace from "@/actions/workspace";

type Action = (state: never, form: FormData) => Promise<{ ok: boolean; error?: string }>;

// [ação, papel mínimo exigido]
const MATRIX: [string, Action, string][] = [
  ["saveTransaction", transactions.saveTransaction, "MEMBER"],
  ["toggleTransactionStatus", transactions.toggleTransactionStatus, "MEMBER"],
  ["deleteTransaction", transactions.deleteTransaction, "MEMBER"],
  ["duplicateTransaction", transactions.duplicateTransaction, "MEMBER"],
  ["bulkTransactions", transactions.bulkTransactions, "MEMBER"],
  ["importTransactions", transactions.importTransactions, "MEMBER"],
  ["saveBudget", planning.saveBudget, "MEMBER"],
  ["deleteBudget", planning.deleteBudget, "MEMBER"],
  ["saveGoal", planning.saveGoal, "MEMBER"],
  ["contributeGoal", planning.contributeGoal, "MEMBER"],
  ["deleteGoal", planning.deleteGoal, "MEMBER"],
  ["saveRecurring", planning.saveRecurring, "MEMBER"],
  ["toggleRecurring", planning.toggleRecurring, "MEMBER"],
  ["deleteRecurring", planning.deleteRecurring, "MEMBER"],
  ["saveCategory", categories.saveCategory, "MEMBER"],
  ["deleteCategory", categories.deleteCategory, "MEMBER"],
  ["saveContact", contacts.saveContact, "MEMBER"],
  ["deleteContact", contacts.deleteContact, "MEMBER"],
  ["saveAccount", accounts.saveAccount, "ADMIN"],
  ["deleteAccount", accounts.deleteAccount, "ADMIN"],
  ["saveCostCenter", contacts.saveCostCenter, "ADMIN"],
  ["deleteCostCenter", contacts.deleteCostCenter, "ADMIN"],
  ["updateWorkspace", workspace.updateWorkspace, "ADMIN"],
  ["addMember", workspace.addMember, "ADMIN"],
  ["updateMemberRole", workspace.updateMemberRole, "ADMIN"],
  ["removeMember", workspace.removeMember, "ADMIN"],
  ["deleteWorkspace", workspace.deleteWorkspace, "OWNER"],
];

beforeEach(() => {
  vi.clearAllMocks();
  m.calls.length = 0;
  m.getContext.mockResolvedValue({ workspace: { id: "ws_1", name: "Meu espaço" }, workspaces: [{ id: "ws_1" }, { id: "ws_2" }], role: "VIEWER", user: { id: "u1" } });
  m.requireRole.mockImplementation(async () => {
    throw new m.PermissionError("Você não tem permissão para esta ação neste espaço.");
  });
});

describe("sem o papel necessário, nenhuma ação toca no banco", () => {
  it.each(MATRIX)("%s exige %s", async (_name, action, role) => {
    const form = new FormData();
    for (const k of ["id", "name", "amount", "accountId", "type", "kind", "op", "ids", "email", "role", "confirm", "rows", "description", "date", "startDate", "frequency", "targetAmount", "categoryId"]) {
      form.set(k, k === "rows" ? "[]" : "x");
    }
    const res = await action(undefined as never, form);
    expect(m.requireRole).toHaveBeenCalledWith(role);
    expect(res).toMatchObject({ ok: false, error: "Você não tem permissão para esta ação neste espaço." });
    expect(m.calls).toEqual([]);
  });
});
