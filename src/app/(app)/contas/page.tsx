import type { Metadata } from "next";
import Link from "next/link";
import { Archive, CreditCard, Landmark, TrendingUp, Wallet } from "lucide-react";
import type { AccountType } from "@prisma/client";
import { getContext, hasRole } from "@/lib/auth";
import { getAccountsWithBalance, type AccountWithBalance } from "@/lib/finance";
import { formatMoney } from "@/lib/format";
import { ACCOUNT_TYPES } from "@/lib/constants";
import { deleteAccount, saveAccount } from "@/actions/accounts";
import { Badge, Card, PageHeader, Progress, StatCard } from "@/components/ui/primitives";
import { EntityDialog } from "@/components/ui/entity-dialog";
import { DeleteButton } from "@/components/ui/delete-button";
import { Field, Input, MoneyInput, Select } from "@/components/ui/field";
import { ColorPicker } from "@/components/ui/pickers";

export const metadata: Metadata = { title: "Contas e cartões" };

function AccountFields({ account, currency }: { account?: AccountWithBalance; currency: string }) {
  const money = (v: number | null | undefined) => (v === null || v === undefined ? "" : v.toFixed(2).replace(".", ","));
  return (
    <>
      {account && <input type="hidden" name="id" value={account.id} />}
      <Field label="Nome">
        <Input name="name" required maxLength={60} defaultValue={account?.name} placeholder="Ex.: Nubank, Itaú PJ, Caixa da loja" />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Tipo">
          <Select name="type" defaultValue={account?.type ?? "CHECKING"}>
            {(Object.keys(ACCOUNT_TYPES) as AccountType[]).map((t) => <option key={t} value={t}>{ACCOUNT_TYPES[t]}</option>)}
          </Select>
        </Field>
        <Field label="Saldo inicial" hint="Saldo da conta antes do primeiro lançamento.">
          <MoneyInput name="initialBalance" currency={currency} defaultValue={money(account?.initialBalance ?? 0)} />
        </Field>
      </div>
      <Field label="Limite do cartão (opcional)" hint="Usado apenas para contas do tipo cartão de crédito.">
        <MoneyInput name="creditLimit" currency={currency} defaultValue={money(account?.creditLimit)} />
      </Field>
      <ColorPicker defaultValue={account?.color} />
      {account && (
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="archived" defaultChecked={account.archived} className="size-4 accent-[var(--primary)]" />
          Arquivar conta (oculta dos formulários, mantém o histórico)
        </label>
      )}
    </>
  );
}

function iconFor(type: AccountType) {
  return type === "CREDIT_CARD" ? CreditCard : type === "INVESTMENT" ? TrendingUp : type === "CASH" ? Wallet : Landmark;
}

export default async function AccountsPage() {
  const { workspace, role } = await getContext();
  const accounts = await getAccountsWithBalance(workspace.id, { includeArchived: true });
  const currency = workspace.currency;
  const active = accounts.filter((a) => !a.archived);
  const canManage = hasRole(role, "ADMIN");
  const assets = active.filter((a) => a.balance > 0).reduce((s, a) => s + a.balance, 0);
  const liabilities = active.filter((a) => a.balance < 0).reduce((s, a) => s + a.balance, 0);

  return (
    <div>
      <PageHeader
        title="Contas e cartões"
        description="Saldos de contas bancárias, caixa, investimentos e cartões."
        actions={canManage && (
          <EntityDialog action={saveAccount} title="Nova conta" triggerLabel="Nova conta" submitLabel="Criar conta">
            <AccountFields currency={currency} />
          </EntityDialog>
        )}
      />

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <StatCard label="Patrimônio líquido" value={formatMoney(assets + liabilities, currency)} icon={Landmark} tone="primary" />
        <StatCard label="Em contas (positivo)" value={formatMoney(assets, currency)} icon={Wallet} tone="success" />
        <StatCard label="Dívidas / faturas" value={formatMoney(liabilities, currency)} icon={CreditCard} tone="danger" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {accounts.map((a) => {
          const Icon = iconFor(a.type);
          const used = a.type === "CREDIT_CARD" && a.creditLimit ? Math.max(0, -a.balance) : 0;
          return (
            <Card key={a.id} className={`p-5 ${a.archived ? "opacity-60" : ""}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="flex size-10 items-center justify-center rounded-xl" style={{ backgroundColor: `${a.color}1f`, color: a.color }}>
                    <Icon className="size-5" />
                  </span>
                  <div>
                    <p className="font-medium">{a.name}</p>
                    <p className="text-xs text-muted">{ACCOUNT_TYPES[a.type]}</p>
                  </div>
                </div>
                <div className="flex items-center">
                  {a.archived && <Badge><Archive className="size-3" /> Arquivada</Badge>}
                  {canManage && (
                    <>
                      <EntityDialog action={saveAccount} title="Editar conta" submitLabel="Salvar">
                        <AccountFields account={a} currency={currency} />
                      </EntityDialog>
                      <DeleteButton action={deleteAccount} id={a.id} confirm={`Excluir a conta “${a.name}”? Só é possível se não houver lançamentos.`} />
                    </>
                  )}
                </div>
              </div>
              <p className="mt-5 text-xs text-muted">{a.type === "CREDIT_CARD" ? "Fatura / saldo atual" : "Saldo atual"}</p>
              <p className={`tabular text-2xl font-semibold tracking-tight ${a.balance < 0 ? "text-danger" : ""}`}>{formatMoney(a.balance, currency)}</p>
              {Math.abs(a.projected - a.balance) > 0.004 && (
                <p className="tabular mt-1 text-xs text-muted">Previsto com pendentes: {formatMoney(a.projected, currency)}</p>
              )}
              {a.type === "CREDIT_CARD" && a.creditLimit ? (
                <div className="mt-4">
                  <div className="mb-1 flex justify-between text-xs text-muted">
                    <span>Limite usado</span>
                    <span className="tabular">{formatMoney(used, currency)} de {formatMoney(a.creditLimit, currency)}</span>
                  </div>
                  <Progress value={(used / a.creditLimit) * 100} tone={used / a.creditLimit > 0.8 ? "danger" : "primary"} />
                </div>
              ) : null}
              <Link href={`/lancamentos?conta=${a.id}&mes=todos`} className="mt-4 inline-block text-xs font-medium text-primary hover:underline">
                Ver extrato →
              </Link>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
