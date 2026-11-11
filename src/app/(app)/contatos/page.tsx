import type { Metadata } from "next";
import Link from "next/link";
import { Mail, Phone, Users } from "lucide-react";
import type { Contact, ContactType } from "@prisma/client";
import { getContext, hasRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { num } from "@/lib/finance";
import { formatMoney, initials } from "@/lib/format";
import { CONTACT_TYPES } from "@/lib/constants";
import { deleteContact, deleteCostCenter, saveContact, saveCostCenter } from "@/actions/contacts";
import { Badge, Card, EmptyState, PageHeader } from "@/components/ui/primitives";
import { EntityDialog } from "@/components/ui/entity-dialog";
import { DeleteButton } from "@/components/ui/delete-button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";

export const metadata: Metadata = { title: "Contatos" };

function ContactFields({ contact, isBusiness }: { contact?: Contact; isBusiness: boolean }) {
  return (
    <>
      {contact && <input type="hidden" name="id" value={contact.id} />}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nome / razão social">
          <Input name="name" required maxLength={120} defaultValue={contact?.name} />
        </Field>
        <Field label="Tipo">
          <Select name="type" defaultValue={contact?.type ?? "BOTH"}>
            {(Object.keys(CONTACT_TYPES) as ContactType[]).map((t) => <option key={t} value={t}>{CONTACT_TYPES[t]}</option>)}
          </Select>
        </Field>
        <Field label={isBusiness ? "CPF / CNPJ" : "Documento (opcional)"}>
          <Input name="document" defaultValue={contact?.document ?? ""} />
        </Field>
        <Field label="Telefone">
          <Input name="phone" type="tel" defaultValue={contact?.phone ?? ""} />
        </Field>
      </div>
      <Field label="E-mail">
        <Input name="email" type="email" defaultValue={contact?.email ?? ""} />
      </Field>
      <Field label="Observações">
        <Textarea name="notes" defaultValue={contact?.notes ?? ""} />
      </Field>
    </>
  );
}

export default async function ContactsPage() {
  const { workspace, role } = await getContext();
  const isBusiness = workspace.type === "BUSINESS";
  const [contacts, totals, costCenters] = await Promise.all([
    prisma.contact.findMany({ where: { workspaceId: workspace.id }, orderBy: { name: "asc" } }),
    prisma.transaction.groupBy({ by: ["contactId", "type"], where: { workspaceId: workspace.id, contactId: { not: null } }, _sum: { amount: true } }),
    prisma.costCenter.findMany({ where: { workspaceId: workspace.id }, orderBy: { name: "asc" } }),
  ]);
  const canEdit = hasRole(role, "MEMBER");
  const canManage = hasRole(role, "ADMIN");
  const sum = (id: string, type: "INCOME" | "EXPENSE") => num(totals.find((t) => t.contactId === id && t.type === type)?._sum.amount);

  return (
    <div>
      <PageHeader
        title={isBusiness ? "Clientes e fornecedores" : "Contatos"}
        description={isBusiness ? "Quem paga e quem recebe da empresa, com o histórico financeiro de cada um." : "Pessoas e empresas com quem você movimenta dinheiro."}
        actions={canEdit && (
          <EntityDialog action={saveContact} title="Novo contato" triggerLabel="Novo contato" submitLabel="Criar">
            <ContactFields isBusiness={isBusiness} />
          </EntityDialog>
        )}
      />

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          {contacts.length ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {contacts.map((c) => {
                const received = sum(c.id, "INCOME");
                const paid = sum(c.id, "EXPENSE");
                return (
                  <Card key={c.id} className="p-4">
                    <div className="flex items-start gap-3">
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary-soft text-sm font-semibold text-primary">{initials(c.name)}</span>
                      <div className="min-w-0 flex-1">
                        <Link href={`/lancamentos?contato=${c.id}&mes=todos`} className="block truncate font-medium hover:underline">{c.name}</Link>
                        <div className="mt-1 flex flex-wrap items-center gap-1.5">
                          <Badge tone={c.type === "CUSTOMER" ? "success" : c.type === "SUPPLIER" ? "warning" : "neutral"}>{CONTACT_TYPES[c.type]}</Badge>
                          {c.document && <span className="text-xs text-muted">{c.document}</span>}
                        </div>
                      </div>
                      {canEdit && (
                        <div className="flex">
                          <EntityDialog action={saveContact} title="Editar contato" submitLabel="Salvar">
                            <ContactFields contact={c} isBusiness={isBusiness} />
                          </EntityDialog>
                          <DeleteButton action={deleteContact} id={c.id} confirm={`Excluir “${c.name}”? Os lançamentos serão mantidos sem contato.`} />
                        </div>
                      )}
                    </div>
                    {(c.email || c.phone) && (
                      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
                        {c.email && <a href={`mailto:${c.email}`} className="flex items-center gap-1 hover:text-fg"><Mail className="size-3" />{c.email}</a>}
                        {c.phone && <a href={`tel:${c.phone}`} className="flex items-center gap-1 hover:text-fg"><Phone className="size-3" />{c.phone}</a>}
                      </div>
                    )}
                    <div className="mt-3 grid grid-cols-2 gap-2 border-t border-border pt-3 text-xs">
                      <div><p className="text-muted">Recebido de</p><p className="tabular font-medium text-success">{formatMoney(received, workspace.currency)}</p></div>
                      <div><p className="text-muted">Pago para</p><p className="tabular font-medium">{formatMoney(paid, workspace.currency)}</p></div>
                    </div>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card>
              <EmptyState icon={Users} title="Nenhum contato" description="Cadastre clientes e fornecedores para saber quanto entra e sai de cada um." />
            </Card>
          )}
        </div>

        <Card className="h-fit">
          <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
            <div>
              <h2 className="text-sm font-semibold">Centros de custo</h2>
              <p className="text-xs text-muted">Separe resultados por área, projeto ou filial.</p>
            </div>
            {canManage && (
              <EntityDialog action={saveCostCenter} title="Novo centro de custo" triggerLabel="Adicionar" triggerVariant="ghost" submitLabel="Criar">
                <Field label="Nome"><Input name="name" required maxLength={60} placeholder="Ex.: Filial Centro, Projeto X" /></Field>
              </EntityDialog>
            )}
          </div>
          {costCenters.length ? (
            <ul>
              {costCenters.map((cc) => (
                <li key={cc.id} className="flex items-center gap-2 border-b border-border px-5 py-2.5 text-sm last:border-0">
                  <Link href={`/lancamentos?centro=${cc.id}&mes=todos`} className="flex-1 truncate hover:underline">{cc.name}</Link>
                  {canManage && (
                    <>
                      <EntityDialog action={saveCostCenter} title="Renomear centro de custo" submitLabel="Salvar">
                        <input type="hidden" name="id" value={cc.id} />
                        <Field label="Nome"><Input name="name" required maxLength={60} defaultValue={cc.name} /></Field>
                      </EntityDialog>
                      <DeleteButton action={deleteCostCenter} id={cc.id} confirm={`Excluir “${cc.name}”?`} />
                    </>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-5 py-6 text-center text-sm text-muted">Nenhum centro de custo. Opcional para uso pessoal.</p>
          )}
        </Card>
      </div>
    </div>
  );
}
