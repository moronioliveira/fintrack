import { parseFlexibleDate } from "./dates";
import { parseMoney } from "./format";

/** Leitura de extratos bancários (CSV e OFX) no navegador, antes de enviar ao servidor. */
export type StatementRow = { date: string; description: string; amount: string; category?: string };

function splitCsvLine(line: string, sep: string) {
  const out: string[] = [];
  let cur = "";
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (quoted && line[i + 1] === '"') { cur += '"'; i++; } else quoted = !quoted;
    } else if (ch === sep && !quoted) {
      out.push(cur.trim());
      cur = "";
    } else cur += ch;
  }
  out.push(cur.trim());
  return out;
}

function normalize(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

export function parseCsv(text: string): StatementRow[] {
  const lines = text.replace(/^﻿/, "").split(/\r?\n/).filter((l) => l.trim());
  if (!lines.length) return [];
  const sep = (lines[0].match(/;/g)?.length ?? 0) >= (lines[0].match(/,/g)?.length ?? 0) ? ";" : ",";
  const header = splitCsvLine(lines[0], sep).map(normalize);
  const find = (...keys: string[]) => header.findIndex((h) => keys.some((k) => h.includes(k)));
  let iDate = find("data", "date");
  let iDesc = find("descri", "historico", "memo", "lancamento", "description", "estabelecimento");
  let iAmount = find("valor", "amount", "quantia");
  const iCat = find("categoria", "category");
  const iType = find("tipo", "type");
  let body = lines.slice(1);
  if (iDate < 0 || iDesc < 0 || iAmount < 0) {
    // Sem cabeçalho reconhecível: assume data;descrição;valor
    [iDate, iDesc, iAmount] = [0, 1, 2];
    body = lines;
  }
  return body
    .map((line) => splitCsvLine(line, sep))
    .map((cols) => {
      let amount = cols[iAmount] ?? "";
      const type = iType >= 0 ? normalize(cols[iType] ?? "") : "";
      // Planilhas exportadas pelo FinTrack trazem o tipo em coluna própria.
      if (type.startsWith("despesa") && !amount.includes("-")) amount = `-${amount}`;
      return { date: cols[iDate] ?? "", description: cols[iDesc] ?? "", amount, category: iCat >= 0 ? cols[iCat] : undefined };
    })
    .filter((r) => parseFlexibleDate(r.date) && Number.isFinite(parseMoney(r.amount)));
}

export function parseOfx(text: string): StatementRow[] {
  const blocks = text.split(/<STMTTRN>/i).slice(1);
  const tag = (block: string, name: string) => block.match(new RegExp(`<${name}>([^<\\r\\n]*)`, "i"))?.[1]?.trim() ?? "";
  return blocks.map((block) => {
    const raw = tag(block, "DTPOSTED");
    const date = raw.length >= 8 ? `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}` : "";
    return { date, description: tag(block, "MEMO") || tag(block, "NAME") || "Lançamento importado", amount: tag(block, "TRNAMT") };
  }).filter((r) => r.date && r.amount);
}
