import { describe, expect, it } from "vitest";
import { parseCsv, parseOfx } from "@/lib/statement-parser";

describe("parseCsv", () => {
  it("lê CSV com ponto e vírgula e cabeçalho em português", () => {
    const csv = "Data;Histórico;Valor\n13/11/2026;PIX RECEBIDO;1.280,00\n14/11/2026;TARIFA;-69,90";
    expect(parseCsv(csv)).toEqual([
      { date: "13/11/2026", description: "PIX RECEBIDO", amount: "1.280,00", category: undefined },
      { date: "14/11/2026", description: "TARIFA", amount: "-69,90", category: undefined },
    ]);
  });

  it("lê CSV com vírgula, aspas e BOM", () => {
    const csv = '﻿date,description,amount\n2026-11-13,"Loja, Centro",-10.50';
    expect(parseCsv(csv)).toEqual([{ date: "2026-11-13", description: "Loja, Centro", amount: "-10.50", category: undefined }]);
  });

  it("aceita aspas escapadas dentro do texto", () => {
    const csv = 'data;descricao;valor\n13/11/2026;"Bolo ""Especial""";50,00';
    expect(parseCsv(csv)[0].description).toBe('Bolo "Especial"');
  });

  it("transforma em negativo as despesas da planilha exportada pelo FinTrack", () => {
    const csv = "Data;Descrição;Tipo;Valor;Categoria\n13/11/2026;Aluguel;Despesa;3200,00;Moradia\n14/11/2026;Salário;Receita;6200,00;Salário";
    const rows = parseCsv(csv);
    expect(rows[0]).toMatchObject({ amount: "-3200,00", category: "Moradia" });
    expect(rows[1]).toMatchObject({ amount: "6200,00", category: "Salário" });
  });

  it("sem cabeçalho reconhecível, assume data;descrição;valor", () => {
    expect(parseCsv("13/11/2026;Venda;100,00")).toEqual([{ date: "13/11/2026", description: "Venda", amount: "100,00", category: undefined }]);
  });

  it("descarta linhas com data ou valor inválidos e linhas vazias", () => {
    const csv = "data;descricao;valor\n31/02/2026;Data impossível;10,00\n13/11/2026;Sem valor;abc\n\n13/11/2026;Ok;5,00\r\n";
    expect(parseCsv(csv).map((r) => r.description)).toEqual(["Ok"]);
  });

  it("arquivo vazio não quebra", () => {
    expect(parseCsv("")).toEqual([]);
  });
});

describe("parseOfx", () => {
  it("lê transações do padrão OFX dos bancos", () => {
    const ofx = `<OFX><BANKTRANLIST>
<STMTTRN><TRNTYPE>DEBIT<DTPOSTED>20261113120000[-3:BRT]<TRNAMT>-842.35<MEMO>COMPRA ATACADAO</STMTTRN>
<STMTTRN><TRNTYPE>CREDIT<DTPOSTED>20261114<TRNAMT>1280.00<NAME>PIX RECEBIDO</STMTTRN>
</BANKTRANLIST></OFX>`;
    expect(parseOfx(ofx)).toEqual([
      { date: "2026-11-13", description: "COMPRA ATACADAO", amount: "-842.35" },
      { date: "2026-11-14", description: "PIX RECEBIDO", amount: "1280.00" },
    ]);
  });

  it("ignora transações sem data ou valor", () => {
    expect(parseOfx("<OFX><STMTTRN><MEMO>x</STMTTRN></OFX>")).toEqual([]);
  });
});
