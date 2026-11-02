# FinTrack

Aplicação de controle financeiro pessoal construída com Next.js e TypeScript. O projeto transforma lançamentos financeiros em uma visão prática de saldo, gastos, compromissos e objetivos.

## Destaques

- Dashboard com saldo, receitas, despesas e fluxo de caixa.
- Cadastro, edição, exclusão, busca e filtros de transações.
- Categorias personalizáveis com proteção contra exclusão indevida.
- Contas recorrentes com status de pagamento e alertas de vencimento.
- Metas financeiras com acompanhamento de progresso.
- Orçamentos mensais por categoria com indicadores de consumo.
- Interface responsiva, com tabela para desktop e cards para mobile.
- Componentização e tipagem compartilhada para manter a aplicação consistente.

## Stack

- Next.js 16 (App Router)
- React 19
- TypeScript
- Tailwind CSS 4
- Lucide React

## Competências demonstradas

- Modelagem de domínio com tipos `Transaction`, `Category`, `RecurringBill`, `FinancialGoal` e `Budget`.
- Gerenciamento de estado compartilhado com `TransactionsProvider` e Context API.
- Separação entre páginas, componentes de interface e regras de negócio.
- Validação de fluxos de CRUD, filtros, estados vazios e confirmações de exclusão.
- Design responsivo e acessível com feedback visual para diferentes estados financeiros.

## Arquitetura

```text
src/
├── app/          # Rotas e páginas da aplicação
├── components/   # Componentes reutilizáveis de UI e dashboard
├── contexts/     # Estado compartilhado da aplicação
└── types/        # Tipos do domínio financeiro
```

O `TransactionsProvider` funciona como fonte única de dados para transações, categorias, contas, metas e orçamentos. Os dados são persistidos por usuário em PostgreSQL via Prisma, e o acesso é protegido por sessão httpOnly assinada. Para produção, defina `DATABASE_URL` e `SESSION_SECRET` no ambiente de execução.

## Executando localmente

```bash
npm install
npm run db:migrate
npm run dev
```

Copie `.env.example` para `.env` e informe a URL do PostgreSQL antes de executar as migrações. Em produção, use `npm run db:deploy` em vez de `npm run db:migrate`.

### Deploy seguro

No provedor de hospedagem, configure `DATABASE_URL` e `SESSION_SECRET` como variáveis protegidas do ambiente de produção. Não envie `.env` para o Git. Antes do primeiro deploy, aplique as migrações a partir de um ambiente confiável com `npm run db:deploy`; o build da Vercel não executa migrações automaticamente. O workflow do GitHub valida lint e build em cada push e pull request para `developer` e `main`.

Acesse ([FinTrack](https://fintrack-three-lovat.vercel.app/)).

## Validação

```bash
npm run lint
npm run build
```
