// Popula um banco de DESENVOLVIMENTO com dados de demonstração.
// Uso: DATABASE_URL=postgres://... npm run db:seed
// Login criado: demo@fintrack.test / demo12345 (somente para ambiente local).
import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("Defina DATABASE_URL.");
if (process.env.NODE_ENV === "production" || /neon\.tech|vercel|supabase|rds\.amazonaws/.test(url)) {
  throw new Error("Seed bloqueado: DATABASE_URL parece ser um banco remoto/produção. Use um banco local.");
}

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });
const EMAIL = "demo@fintrack.test";

const iso = (d) => d.toISOString().slice(0, 10);
const day = (s) => new Date(`${s}T00:00:00.000Z`);
const today = iso(new Date());
const monthStr = (offset) => {
  const d = new Date();
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() + offset);
  return iso(d).slice(0, 7);
};
const rand = (min, max) => Math.round((min + Math.random() * (max - min)) * 100) / 100;

const CATEGORIES = [
  ["Venda de produtos", "INCOME", "Store", "#10b981"],
  ["Prestação de serviços", "INCOME", "BriefcaseBusiness", "#14b8a6"],
  ["Fornecedores", "EXPENSE", "Package", "#f97316"],
  ["Folha de pagamento", "EXPENSE", "Users", "#6366f1"],
  ["Impostos e taxas", "EXPENSE", "Landmark", "#f43f5e"],
  ["Aluguel e condomínio", "EXPENSE", "House", "#8b5cf6"],
  ["Marketing", "EXPENSE", "Megaphone", "#ec4899"],
  ["Software e tecnologia", "EXPENSE", "Laptop", "#3b82f6"],
  ["Manutenção", "EXPENSE", "Wrench", "#f59e0b"],
  ["Tarifas bancárias", "EXPENSE", "Percent", "#eab308"],
];

async function main() {
  let user = await prisma.user.findUnique({ where: { email: EMAIL } });
  if (!user) {
    user = await prisma.user.create({ data: { email: EMAIL, name: "Ana Demo", passwordHash: await bcrypt.hash("demo12345", 12) } });
  }
  let membership = await prisma.membership.findFirst({ where: { userId: user.id }, include: { workspace: true } });
  if (!membership) {
    const ws = await prisma.workspace.create({
      data: { name: "Padaria Demo LTDA", type: "BUSINESS", memberships: { create: { userId: user.id, role: "OWNER" } } },
    });
    membership = await prisma.membership.findFirst({ where: { userId: user.id }, include: { workspace: true } });
    void ws;
  }
  const workspaceId = membership.workspaceId;

  // Recomeça os dados do espaço de demonstração.
  await prisma.transaction.deleteMany({ where: { workspaceId } });
  await prisma.recurringRule.deleteMany({ where: { workspaceId } });
  await prisma.budget.deleteMany({ where: { workspaceId } });
  await prisma.goal.deleteMany({ where: { workspaceId } });
  await prisma.contact.deleteMany({ where: { workspaceId } });

  for (const [name, kind, icon, color] of CATEGORIES) {
    await prisma.category.upsert({
      where: { workspaceId_kind_name: { workspaceId, kind, name } },
      create: { workspaceId, name, kind, icon, color },
      update: {},
    });
  }
  const cats = Object.fromEntries((await prisma.category.findMany({ where: { workspaceId } })).map((c) => [c.name, c.id]));

  let accounts = await prisma.account.findMany({ where: { workspaceId }, orderBy: { createdAt: "asc" } });
  if (accounts.length < 3) {
    await prisma.account.createMany({
      data: [
        { workspaceId, name: "Banco PJ", type: "CHECKING", color: "#6366f1", initialBalance: 18000 },
        { workspaceId, name: "Caixa da loja", type: "CASH", color: "#10b981", initialBalance: 1500 },
        { workspaceId, name: "Cartão corporativo", type: "CREDIT_CARD", color: "#f43f5e", creditLimit: 15000 },
      ],
    });
    accounts = await prisma.account.findMany({ where: { workspaceId }, orderBy: { createdAt: "asc" } });
  }
  const bank = accounts.find((a) => a.name === "Banco PJ") ?? accounts.find((a) => a.type === "CHECKING") ?? accounts[0];
  const cash = accounts.find((a) => a.type === "CASH") ?? accounts[0];
  const card = accounts.find((a) => a.type === "CREDIT_CARD") ?? accounts[0];

  const contacts = {};
  for (const [name, type] of [["Mercado Bom Preço", "CUSTOMER"], ["Café Central", "CUSTOMER"], ["Moinho Trigo Forte", "SUPPLIER"], ["Laticínios Serra", "SUPPLIER"], ["Imobiliária Lar", "SUPPLIER"]]) {
    contacts[name] = (await prisma.contact.create({ data: { workspaceId, name, type } })).id;
  }
  const centers = await prisma.costCenter.findMany({ where: { workspaceId } });

  const tx = [];
  const add = (t) => tx.push({ workspaceId, createdById: user.id, status: "PAID", ...t, paidAt: t.status === "PENDING" ? null : day(t.date), date: day(t.date) });

  for (let m = -5; m <= 0; m++) {
    const ym = monthStr(m);
    const lastDay = m === 0 ? Number(today.slice(8, 10)) : 28;
    for (let d = 2; d <= lastDay; d += 3) {
      add({ type: "INCOME", description: "Vendas no balcão", amount: rand(2000, 3400), date: `${ym}-${String(d).padStart(2, "0")}`, accountId: cash.id, categoryId: cats["Venda de produtos"], costCenterId: centers[1]?.id });
    }
    add({ type: "INCOME", description: "Fornecimento semanal", amount: rand(3500, 5200), date: `${ym}-10`, accountId: bank.id, categoryId: cats["Venda de produtos"], contactId: contacts["Mercado Bom Preço"], status: m === 0 && today < `${ym}-10` ? "PENDING" : "PAID" });
    add({ type: "INCOME", description: "Encomendas de eventos", amount: rand(1200, 3000), date: `${ym}-18`, accountId: bank.id, categoryId: cats["Prestação de serviços"], contactId: contacts["Café Central"], status: m === 0 ? "PENDING" : "PAID" });
    add({ type: "EXPENSE", description: "Farinha e insumos", amount: rand(2800, 4200), date: `${ym}-05`, accountId: bank.id, categoryId: cats["Fornecedores"], contactId: contacts["Moinho Trigo Forte"], costCenterId: centers[2]?.id });
    add({ type: "EXPENSE", description: "Laticínios", amount: rand(1200, 1900), date: `${ym}-12`, accountId: bank.id, categoryId: cats["Fornecedores"], contactId: contacts["Laticínios Serra"], costCenterId: centers[2]?.id, status: m === 0 && today < `${ym}-12` ? "PENDING" : "PAID" });
    add({ type: "EXPENSE", description: "DAS Simples Nacional", amount: rand(1500, 2100), date: `${ym}-20`, accountId: bank.id, categoryId: cats["Impostos e taxas"], costCenterId: centers[0]?.id, status: m === 0 ? "PENDING" : "PAID" });
    add({ type: "EXPENSE", description: "Anúncios redes sociais", amount: rand(300, 700), date: `${ym}-08`, accountId: card.id, categoryId: cats["Marketing"], costCenterId: centers[1]?.id });
    add({ type: "EXPENSE", description: "Sistema de PDV", amount: 189.9, date: `${ym}-03`, accountId: card.id, categoryId: cats["Software e tecnologia"] });
    add({ type: "EXPENSE", description: "Tarifa do pacote PJ", amount: 59.9, date: `${ym}-01`, accountId: bank.id, categoryId: cats["Tarifas bancárias"] });
  }
  // Conta atrasada para demonstrar alertas.
  add({ type: "EXPENSE", description: "Manutenção do forno", amount: 850, date: iso(new Date(Date.now() - 4 * 86400000)), accountId: bank.id, categoryId: cats["Manutenção"], status: "PENDING" });
  await prisma.transaction.createMany({ data: tx });

  const firstOf = (offset, d) => `${monthStr(offset)}-${d}`;
  await prisma.recurringRule.createMany({
    data: [
      { workspaceId, type: "EXPENSE", description: "Aluguel do ponto", amount: 4500, frequency: "MONTHLY", startDate: day(firstOf(-5, "10")), accountId: bank.id, categoryId: cats["Aluguel e condomínio"], contactId: contacts["Imobiliária Lar"] },
      { workspaceId, type: "EXPENSE", description: "Folha de pagamento", amount: 9800, frequency: "MONTHLY", startDate: day(firstOf(-5, "05")), accountId: bank.id, categoryId: cats["Folha de pagamento"] },
    ],
  });
  // Marca como pagas as ocorrências passadas que o app vai gerar.
  const rules = await prisma.recurringRule.findMany({ where: { workspaceId } });
  for (const rule of rules) {
    const start = iso(rule.startDate);
    const d = start.slice(8, 10);
    const dates = [];
    for (let m = -5; m <= 0; m++) { const s = `${monthStr(m)}-${d}`; if (s < today) dates.push(s); }
    await prisma.transaction.createMany({
      data: dates.map((s) => ({ workspaceId, recurringRuleId: rule.id, type: rule.type, status: "PAID", description: rule.description, amount: rule.amount, date: day(s), paidAt: day(s), accountId: rule.accountId, categoryId: rule.categoryId, contactId: rule.contactId })),
      skipDuplicates: true,
    });
  }

  await prisma.budget.createMany({
    data: [
      { workspaceId, categoryId: cats["Fornecedores"], amount: 6000 },
      { workspaceId, categoryId: cats["Marketing"], amount: 500 },
      { workspaceId, categoryId: cats["Software e tecnologia"], amount: 300 },
    ],
  });
  await prisma.goal.createMany({
    data: [
      { workspaceId, name: "Capital de giro (3 meses)", targetAmount: 60000, currentAmount: 22500, deadline: day(`${monthStr(10)}-01`), color: "#10b981" },
      { workspaceId, name: "Forno novo", targetAmount: 18000, currentAmount: 6200, deadline: day(`${monthStr(6)}-15`), color: "#f59e0b" },
    ],
  });

  console.log(`Seed concluído: ${tx.length} lançamentos para ${EMAIL} (senha: demo12345).`);
}

main().finally(() => prisma.$disconnect());
