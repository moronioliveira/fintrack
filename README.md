# FinTrack

Gestão financeira em Next.js para **finanças pessoais e empresas**: contas e cartões, fluxo de caixa, contas a pagar e receber, recorrências, orçamentos, metas, clientes/fornecedores e relatórios, com vários espaços de trabalho e equipe com permissões.

## Funcionalidades

**Visão geral**
- Saldo em contas e **saldo previsto** até o fim do mês (considera pendentes).
- Receitas, despesas e resultado do mês com comparação ao mês anterior e taxa de economia.
- Gráfico de fluxo de caixa (6 meses), despesas por categoria, próximos vencimentos, orçamentos, contas e metas.
- Alerta de contas atrasadas e guia de primeiros passos.

**Lançamentos**
- Receitas, despesas e **transferências entre contas**.
- Situação pago/pendente (afeta ou não o saldo), **parcelamento** em até 24x, observações e centro de custo.
- Filtros por mês, tipo, situação (inclusive atrasados), conta, categoria, contato, centro de custo e busca.
- Seleção múltipla para marcar como pago ou excluir em lote; duplicar lançamento.
- **Importação de extrato OFX/CSV** com pré-visualização, **categorização automática pelo histórico** e descarte de linhas já lançadas; **exportação CSV** (compatível com Excel pt-BR).
- Alteração de categoria em lote e **recibo imprimível** com valor por extenso.
- **Busca global** (Ctrl+K) por páginas e lançamentos.

**Planejamento**
- **Contas a pagar e receber** agrupadas em atrasados, hoje, próximos 7 dias e mais adiante.
- **Recorrências** (semanal, mensal, anual): o app agenda os próximos vencimentos automaticamente.
- **Orçamentos** mensais por categoria com indicador de ritmo de gasto.
- **Metas** com aportes/resgates e quanto guardar por mês para chegar no prazo.
- **Projeção de caixa** de 30 a 180 dias, com alerta da data em que o saldo ficaria negativo.

**Empresas**
- Vários **espaços de trabalho** (pessoal e empresas) com troca rápida.
- **Membros com papéis**: proprietário, administrador, editor e leitor.
- **Clientes e fornecedores** com total recebido/pago, **centros de custo** e **relatórios** (demonstrativo mensal, resultado acumulado, ranking de clientes/fornecedores, resultado por centro de custo e tabela categoria x mês exportável), com impressão/PDF.

**Interface**
- Tema claro/escuro, layout responsivo (menu lateral no desktop e gaveta no celular), estados vazios, de carregamento e de erro.

## Stack

- Next.js 16 (App Router, Server Components e Server Actions) · React 19 · TypeScript
- Prisma 7 + PostgreSQL · Tailwind CSS 4 · Lucide React
- Sessão em cookie httpOnly assinado (JWT/jose) e senhas com bcrypt

## Arquitetura

```text
prisma/
├── schema.prisma     # Modelo relacional (Workspace, Membership, Account, Transaction...)
├── migrations/       # Migrações SQL
└── seed.mjs          # Dados de demonstração (somente banco local)
src/
├── actions/          # Server Actions (mutações), todas com checagem de papel e espaço
├── app/
│   ├── (auth)/       # Login e cadastro
│   ├── (app)/        # Páginas autenticadas (visão geral, lançamentos, relatórios...)
│   └── api/exportar/ # Exportação CSV
├── components/       # UI, gráficos, shell e componentes de lançamentos
├── lib/              # Auth/DAL, consultas financeiras, datas, formatação, recorrências
└── proxy.ts          # Verificação otimista de sessão
```

Toda leitura e escrita passa por `getContext()` / `requireRole()` em `src/lib/auth.ts`, que valida a sessão, a participação do usuário no espaço ativo e o papel mínimo exigido.

### Migração da versão anterior

A primeira versão salvava tudo em um JSON por usuário (`UserData`). A migração `20261111120000_relational_workspaces` **apenas adiciona** tabelas. No primeiro acesso de cada usuário, os dados antigos (transações, categorias, contas recorrentes, metas e orçamentos) são importados automaticamente para um espaço pessoal (`src/lib/legacy-import.ts`).

## Executando localmente

```bash
npm install
cp .env.example .env   # informe DATABASE_URL e SESSION_SECRET
npm run db:deploy      # aplica as migrações
npm run dev
```

Sem Postgres instalado, use o servidor local do Prisma:

```bash
npx prisma dev -n fintrack-local --detach
```

Para popular um banco **local** com dados de demonstração (o script recusa URLs de bancos remotos):

```bash
npm run db:seed
```

## Deploy

1. Configure `DATABASE_URL` e `SESSION_SECRET` como variáveis protegidas no provedor (ex.: Vercel).
2. Aplique as migrações a partir de um ambiente confiável: `npm run db:deploy`. O build não executa migrações.
3. O workflow do GitHub valida lint e build a cada push/PR em `developer` e `main`.

## Validação

```bash
npm run lint
npm run build
```
