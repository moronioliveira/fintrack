import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getContext } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { num } from "@/lib/finance";
import { toISO, todayISO } from "@/lib/dates";
import { formatMoney } from "@/lib/format";
import { moneyInWords } from "@/lib/extenso";
import { PrintButton } from "@/components/ui/print-button";
import { LogoMark } from "@/components/brand/logo";

export const metadata: Metadata = { title: "Recibo" };

const longDate = new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

export default async function ReceiptPage({ params }: PageProps<"/recibo/[id]">) {
  const { id } = await params;
  const { workspace } = await getContext();
  const t = await prisma.transaction.findFirst({
    where: { id, workspaceId: workspace.id, type: { not: "TRANSFER" } },
    include: { contact: true, category: true, account: true },
  });
  if (!t) notFound();

  const amount = num(t.amount);
  const isIncome = t.type === "INCOME";
  const when = toISO(t.paidAt ?? t.date);
  const number = `${when.slice(0, 4)}-${t.id.slice(-6).toUpperCase()}`;
  const issuer = { name: workspace.name, document: workspace.document };
  const other = t.contact ? { name: t.contact.name, document: t.contact.document } : null;
  // Receita: a empresa recebeu do contato. Despesa: o contato recebeu da empresa.
  const receiver = isIncome ? issuer : other;
  const payer = isIncome ? other : issuer;

  return (
    <div className="min-h-screen bg-bg px-4 py-8">
      <div className="no-print mx-auto mb-4 flex max-w-2xl items-center justify-between">
        <Link href="/lancamentos" className="flex items-center gap-1.5 text-sm text-muted hover:text-fg"><ArrowLeft className="size-4" /> Voltar</Link>
        <PrintButton />
      </div>

      <article className="mx-auto max-w-2xl rounded-2xl border border-border bg-surface p-8 text-fg shadow-card print:border-0 print:shadow-none sm:p-10">
        <header className="flex items-start justify-between gap-6 border-b border-border pb-6">
          <div className="flex items-center gap-3">
            <LogoMark className="size-8 text-primary" />
            <div>
              <p className="font-semibold">{workspace.name}</p>
              {workspace.document && <p className="text-xs text-muted">{workspace.type === "BUSINESS" ? "CNPJ" : "CPF"} {workspace.document}</p>}
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs uppercase tracking-wider text-muted">Recibo nº</p>
            <p className="tabular font-semibold">{number}</p>
          </div>
        </header>

        <div className="py-8">
          <div className="flex items-baseline justify-between gap-4">
            <h1 className="text-2xl font-semibold tracking-tight">Recibo</h1>
            <p className="tabular text-2xl font-semibold">{formatMoney(amount, workspace.currency)}</p>
          </div>

          <p className="mt-6 leading-relaxed">
            {receiver ? <strong>{receiver.name}</strong> : "______________________________"}
            {receiver?.document ? `, documento ${receiver.document},` : ""} declara que recebeu de{" "}
            {payer ? <strong>{payer.name}</strong> : "______________________________"}
            {payer?.document ? `, documento ${payer.document},` : ""} a importância de{" "}
            <strong>{formatMoney(amount, workspace.currency)}</strong> ({moneyInWords(amount, workspace.currency)}), referente a{" "}
            <strong>{t.description}</strong>.
          </p>

          <dl className="mt-8 grid gap-4 rounded-xl bg-surface-2 p-4 text-sm sm:grid-cols-3">
            <div><dt className="text-xs text-muted">Data do pagamento</dt><dd className="font-medium">{longDate.format(new Date(`${when}T00:00:00Z`))}</dd></div>
            <div><dt className="text-xs text-muted">Categoria</dt><dd className="font-medium">{t.category?.name ?? "Não informada"}</dd></div>
            <div><dt className="text-xs text-muted">Forma / conta</dt><dd className="font-medium">{t.account.name}</dd></div>
          </dl>
          {t.notes && <p className="mt-4 text-sm text-muted">Observações: {t.notes}</p>}
          {t.status === "PENDING" && (
            <p className="no-print mt-4 rounded-lg bg-warning-soft px-3 py-2 text-sm text-warning">Este lançamento ainda está pendente. Confirme o pagamento antes de entregar o recibo.</p>
          )}
        </div>

        <footer className="pt-10">
          <p className="text-sm text-muted">______________________, {longDate.format(new Date(`${todayISO()}T00:00:00Z`))}.</p>
          <div className="mx-auto mt-16 max-w-xs border-t border-fg/40 pt-2 text-center text-sm">
            {receiver?.name ?? "Assinatura do recebedor"}
          </div>
        </footer>
      </article>
    </div>
  );
}
