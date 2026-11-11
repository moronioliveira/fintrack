"use client";

import type { CategoryKind } from "@prisma/client";
import { saveCategory } from "@/actions/categories";
import { EntityDialog } from "@/components/ui/entity-dialog";
import { Field, Input, Select } from "@/components/ui/field";
import { ColorPicker, IconPicker } from "@/components/ui/pickers";

type Category = { id: string; name: string; kind: CategoryKind; color: string; icon: string };

/** Renderizado no cliente para não serializar o seletor de ícones em cada linha. */
export function CategoryDialog({ category, kind }: { category?: Category; kind?: CategoryKind }) {
  return (
    <EntityDialog
      action={saveCategory}
      title={category ? "Editar categoria" : "Nova categoria"}
      triggerLabel={category ? undefined : "Adicionar"}
      triggerVariant="ghost"
      submitLabel={category ? "Salvar" : "Criar"}
    >
      {category && <input type="hidden" name="id" value={category.id} />}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nome">
          <Input name="name" required maxLength={50} defaultValue={category?.name} placeholder="Ex.: Mercado" />
        </Field>
        <Field label="Tipo">
          <Select name="kind" defaultValue={category?.kind ?? kind ?? "EXPENSE"}>
            <option value="EXPENSE">Despesa</option>
            <option value="INCOME">Receita</option>
          </Select>
        </Field>
      </div>
      <ColorPicker defaultValue={category?.color ?? "#6366f1"} />
      <IconPicker defaultValue={category?.icon} />
    </EntityDialog>
  );
}
