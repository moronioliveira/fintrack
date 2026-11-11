import type { Metadata } from "next";
import Link from "next/link";
import type { CategoryKind } from "@prisma/client";
import { getContext, hasRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { num } from "@/lib/finance";
import { currentMonth, monthRange } from "@/lib/dates";
import { formatMoney } from "@/lib/format";
import { deleteCategory } from "@/actions/categories";
import { CategoryDialog } from "./category-dialog";
import { Card, PageHeader } from "@/components/ui/primitives";
import { IconBadge } from "@/components/ui/icon";
import { DeleteButton } from "@/components/ui/delete-button";

export const metadata: Metadata = { title: "Categorias" };

export default async function CategoriesPage() {
  const { workspace, role } = await getContext();
  const month = currentMonth();
  const [categories, usage, monthly] = await Promise.all([
    prisma.category.findMany({ where: { workspaceId: workspace.id }, orderBy: { name: "asc" } }),
    prisma.transaction.groupBy({ by: ["categoryId"], where: { workspaceId: workspace.id }, _count: true }),
    prisma.transaction.groupBy({ by: ["categoryId"], where: { workspaceId: workspace.id, date: monthRange(month) }, _sum: { amount: true } }),
  ]);
  const canEdit = hasRole(role, "MEMBER");

  const section = (kind: CategoryKind, title: string) => {
    const list = categories.filter((c) => c.kind === kind);
    return (
      <Card>
        <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
          <h2 className="text-sm font-semibold">{title} <span className="font-normal text-muted">({list.length})</span></h2>
          {canEdit && (
            <CategoryDialog kind={kind} />
          )}
        </div>
        <ul>
          {list.map((c) => {
            const count = usage.find((u) => u.categoryId === c.id)?._count ?? 0;
            const total = num(monthly.find((m) => m.categoryId === c.id)?._sum.amount);
            return (
              <li key={c.id} className="flex items-center gap-3 border-b border-border px-4 py-2.5 last:border-0">
                <IconBadge name={c.icon} color={c.color} />
                <Link href={`/lancamentos?categoria=${c.id}&mes=todos`} className="min-w-0 flex-1 hover:underline">
                  <p className="truncate text-sm font-medium">{c.name}</p>
                  <p className="text-xs text-muted">{count} lançamento(s){total ? ` · ${formatMoney(total, workspace.currency)} neste mês` : ""}</p>
                </Link>
                {canEdit && (
                  <div className="flex">
                    <CategoryDialog category={{ id: c.id, name: c.name, kind: c.kind, color: c.color, icon: c.icon }} />
                    <DeleteButton action={deleteCategory} id={c.id} confirm={count ? `“${c.name}” tem ${count} lançamento(s), que ficarão sem categoria. Excluir mesmo assim?` : `Excluir “${c.name}”?`} />
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </Card>
    );
  };

  return (
    <div>
      <PageHeader title="Categorias" description="Organize receitas e despesas. Use cores e ícones para identificar rapidamente." />
      <div className="grid gap-4 lg:grid-cols-2">
        {section("EXPENSE", "Despesas")}
        {section("INCOME", "Receitas")}
      </div>
    </div>
  );
}
