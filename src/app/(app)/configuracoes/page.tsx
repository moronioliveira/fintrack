import type { Metadata } from "next";
import { getContext, hasRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CURRENCIES, ROLE_LABELS } from "@/lib/constants";
import { initials } from "@/lib/format";
import {
  addMember, changePassword, deleteWorkspace, leaveWorkspace, removeMember, updateMemberRole, updateProfile, updateWorkspace,
} from "@/actions/workspace";
import { ActionForm } from "@/components/ui/action-form";
import { Badge, Card, PageHeader } from "@/components/ui/primitives";
import { Field, Input, Select } from "@/components/ui/field";
import { DeleteButton } from "@/components/ui/delete-button";
import { MemberRoleSelect } from "./member-role-select";

export const metadata: Metadata = { title: "Configurações" };

function Section({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <Card className="grid gap-6 p-5 md:grid-cols-3 md:p-6">
      <div>
        <h2 className="text-sm font-semibold">{title}</h2>
        <p className="mt-1 text-sm text-muted">{description}</p>
      </div>
      <div className="md:col-span-2">{children}</div>
    </Card>
  );
}

export default async function SettingsPage() {
  const { user, workspace, role, workspaces } = await getContext();
  const members = await prisma.membership.findMany({
    where: { workspaceId: workspace.id },
    include: { user: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: "asc" },
  });
  const isAdmin = hasRole(role, "ADMIN");

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="Configurações" description="Seu perfil, o espaço atual e quem tem acesso a ele." />

      <Section title="Perfil" description="Como você aparece para os outros membros.">
        <ActionForm action={updateProfile} submitLabel="Salvar perfil">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nome"><Input name="name" required defaultValue={user.name} /></Field>
            <Field label="E-mail" hint="O e-mail é usado para entrar e não pode ser alterado."><Input value={user.email} disabled readOnly /></Field>
          </div>
        </ActionForm>
      </Section>

      <Section title="Senha" description="Use pelo menos 8 caracteres.">
        <ActionForm action={changePassword} submitLabel="Alterar senha">
          <Field label="Senha atual"><Input type="password" name="current" required autoComplete="current-password" /></Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nova senha"><Input type="password" name="next" required minLength={8} autoComplete="new-password" /></Field>
            <Field label="Confirmar nova senha"><Input type="password" name="confirm" required minLength={8} autoComplete="new-password" /></Field>
          </div>
        </ActionForm>
      </Section>

      <Section title="Espaço atual" description={isAdmin ? "Dados do espaço de trabalho selecionado." : "Somente administradores podem alterar estes dados."}>
        <ActionForm action={updateWorkspace} submitLabel="Salvar espaço">
          <fieldset disabled={!isAdmin} className="grid gap-4">
            <Field label="Nome"><Input name="name" required defaultValue={workspace.name} /></Field>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Tipo">
                <Select name="type" defaultValue={workspace.type}>
                  <option value="PERSONAL">Pessoal</option>
                  <option value="BUSINESS">Empresa</option>
                </Select>
              </Field>
              <Field label="Moeda">
                <Select name="currency" defaultValue={workspace.currency}>
                  {CURRENCIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                </Select>
              </Field>
              <Field label={workspace.type === "BUSINESS" ? "CNPJ" : "CPF (opcional)"}><Input name="document" defaultValue={workspace.document ?? ""} /></Field>
            </div>
          </fieldset>
        </ActionForm>
      </Section>

      <Section title="Membros" description="Convide sócios, contador ou família. Editores lançam; leitores só visualizam; administradores gerenciam contas e membros.">
        <ul className="mb-5 divide-y divide-border rounded-xl border border-border">
          {members.map((m) => (
            <li key={m.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
              <span className="flex size-9 items-center justify-center rounded-full bg-primary-soft text-xs font-semibold text-primary">{initials(m.user.name)}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{m.user.name} {m.userId === user.id && <span className="text-muted">(você)</span>}</p>
                <p className="truncate text-xs text-muted">{m.user.email}</p>
              </div>
              {isAdmin && m.role !== "OWNER" && m.userId !== user.id ? (
                <>
                  <MemberRoleSelect action={updateMemberRole} id={m.id} role={m.role} />
                  <DeleteButton action={removeMember} id={m.id} confirm={`Remover ${m.user.name} deste espaço?`} label="Remover membro" />
                </>
              ) : (
                <Badge tone={m.role === "OWNER" ? "primary" : "neutral"}>{ROLE_LABELS[m.role]}</Badge>
              )}
            </li>
          ))}
        </ul>
        {isAdmin && (
          <ActionForm action={addMember} submitLabel="Adicionar membro">
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="E-mail da pessoa" className="sm:col-span-2" hint="A pessoa precisa ter uma conta no FinTrack.">
                <Input type="email" name="email" required placeholder="socio@empresa.com" />
              </Field>
              <Field label="Permissão">
                <Select name="role" defaultValue="MEMBER">
                  <option value="ADMIN">{ROLE_LABELS.ADMIN}</option>
                  <option value="MEMBER">{ROLE_LABELS.MEMBER}</option>
                  <option value="VIEWER">{ROLE_LABELS.VIEWER}</option>
                </Select>
              </Field>
            </div>
          </ActionForm>
        )}
      </Section>

      <Section title="Zona de perigo" description="Ações permanentes. Não podem ser desfeitas.">
        {role === "OWNER" ? (
          <ActionForm action={deleteWorkspace} submitLabel="Excluir espaço permanentemente" danger>
            <p className="text-sm text-muted">
              Exclui <strong className="text-fg">{workspace.name}</strong> com todas as contas, lançamentos, metas e relatórios.
              {workspaces.length <= 1 && " Crie outro espaço antes, pois você precisa ter pelo menos um."}
            </p>
            <Field label={`Digite “${workspace.name}” para confirmar`}><Input name="confirm" required autoComplete="off" /></Field>
          </ActionForm>
        ) : (
          <ActionForm action={leaveWorkspace} submitLabel="Sair deste espaço" danger>
            <p className="text-sm text-muted">Você perderá o acesso a {workspace.name} até ser convidado novamente.</p>
          </ActionForm>
        )}
      </Section>
    </div>
  );
}
