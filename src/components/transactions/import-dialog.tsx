"use client";

import { useState } from "react";
import { FileText, Upload } from "lucide-react";
import { importTransactions } from "@/actions/transactions";
import { ActionForm } from "@/components/ui/action-form";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field, Select } from "@/components/ui/field";
import { formatDate, parseFlexibleDate } from "@/lib/dates";
import { parseCsv, parseOfx, type StatementRow } from "@/lib/statement-parser";
import { formatMoney, parseMoney } from "@/lib/format";

type Row = StatementRow;

export function ImportDialogButton({ accounts }: { accounts: { id: string; name: string }[] }) {
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<Row[]>([]);
  const [fileName, setFileName] = useState("");

  async function onFile(file: File | undefined) {
    if (!file) return;
    setFileName(file.name);
    const buffer = await file.arrayBuffer();
    let text = new TextDecoder("utf-8").decode(buffer);
    // Muitos bancos exportam em Latin-1; se houver caracteres inválidos, tenta de novo.
    if (text.includes("�")) text = new TextDecoder("iso-8859-1").decode(buffer);
    setRows(/<OFX>/i.test(text) || /\.ofx$/i.test(file.name) ? parseOfx(text) : parseCsv(text));
  }

  function close() {
    setOpen(false);
    setRows([]);
    setFileName("");
  }

  const totalIn = rows.reduce((acc, r) => acc + Math.max(0, parseMoney(r.amount)), 0);
  const totalOut = rows.reduce((acc, r) => acc + Math.min(0, parseMoney(r.amount)), 0);

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <Upload className="size-4" /> Importar extrato
      </Button>
      <Dialog open={open} onClose={close} title="Importar extrato" description="Arquivos OFX (padrão dos bancos) ou CSV com colunas data, descrição e valor (negativo = despesa)." size="lg">
        <ActionForm action={importTransactions} onSuccess={close} onCancel={close} submitLabel={rows.length ? `Importar ${rows.length} lançamento(s)` : "Importar"}>
          <input type="hidden" name="rows" value={JSON.stringify(rows)} />
          <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border px-4 py-8 text-center transition hover:border-primary hover:bg-primary-soft/40">
            <FileText className="size-6 text-muted" />
            <span className="text-sm font-medium">{fileName || "Clique para escolher um arquivo .ofx ou .csv"}</span>
            <span className="text-xs text-muted">Datas em DD/MM/AAAA ou AAAA-MM-DD · Valores como 1.234,56 ou -89,90</span>
            <input type="file" accept=".csv,.ofx,.txt,text/csv" className="sr-only" onChange={(e) => onFile(e.target.files?.[0])} />
          </label>
          {fileName && !rows.length && <p className="text-sm text-danger">Não encontramos linhas válidas nesse arquivo.</p>}
          {rows.length > 0 && (
            <>
              <div className="flex flex-wrap gap-4 text-sm">
                <span><strong>{rows.length}</strong> linhas</span>
                <span className="text-success">Entradas {formatMoney(totalIn)}</span>
                <span className="text-danger">Saídas {formatMoney(totalOut)}</span>
              </div>
              <div className="max-h-56 overflow-auto rounded-xl border border-border">
                <table className="w-full text-xs">
                  <tbody>
                    {rows.slice(0, 50).map((r, i) => {
                      const iso = parseFlexibleDate(r.date);
                      const v = parseMoney(r.amount);
                      return (
                        <tr key={i} className="border-b border-border last:border-0">
                          <td className="tabular whitespace-nowrap px-3 py-2 text-muted">{iso ? formatDate(iso) : r.date}</td>
                          <td className="px-3 py-2">{r.description}</td>
                          <td className={`tabular whitespace-nowrap px-3 py-2 text-right font-medium ${v < 0 ? "" : "text-success"}`}>{formatMoney(v)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {rows.length > 50 && <p className="text-xs text-muted">Pré-visualizando 50 de {rows.length} linhas.</p>}
            </>
          )}
          <Field label="Importar para a conta">
            <Select name="accountId" defaultValue={accounts[0]?.id}>
              {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </Select>
          </Field>
        </ActionForm>
      </Dialog>
    </>
  );
}
