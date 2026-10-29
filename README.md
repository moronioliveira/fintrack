# FinTrack

Eu criei o FinTrack para organizar finanças pessoais de uma forma clara, visual e prática. A ideia é que eu consiga registrar minhas movimentações, entender para onde o dinheiro está indo e tomar decisões melhores a partir dos meus próprios dados.

## Minha visão do produto

Eu não quero que o FinTrack seja apenas uma lista de receitas e despesas. Quero que ele evolua para uma ferramenta de acompanhamento e planejamento financeiro, em que eu consiga:

- registrar receitas e despesas;
- organizar lançamentos por categorias;
- analisar a distribuição dos meus gastos;
- comparar entradas e saídas;
- acompanhar meu saldo;
- planejar limites e metas;
- receber avisos antes de ultrapassar limites de gastos;
- identificar comportamentos que precisam de atenção.

Por isso, as funcionalidades atuais priorizam leitura rápida dos dados e uma base de arquitetura simples o bastante para continuar evoluindo.

## Tecnologias escolhidas

- Next.js com App Router;
- React;
- TypeScript;
- Tailwind CSS;
- Lucide React para ícones.

Eu escolhi Next.js porque quero manter a aplicação preparada para crescer com rotas, componentes server/client e uma futura camada de API. Uso TypeScript para reduzir erros entre o formulário, o contexto e os componentes que exibem os dados. Escolhi Tailwind CSS porque ele me permite manter o design consistente sem espalhar estilos soltos pela aplicação.

## Organização da aplicação

```text
src/
├── app/
│   ├── categorias/
│   ├── configuracoes/
│   ├── transacoes/
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── cards/
│   ├── dashboard/
│   ├── form/
│   ├── header/
│   └── listaTransacoes/
├── contexts/
│   └── transactions-context.tsx
└── types/
    ├── category.ts
    ├── financial-planning.ts
    └── transaction.ts
```

Eu separo as páginas dos componentes de interface para evitar que uma tela concentre toda a regra visual. A pasta `dashboard` reúne as visualizações financeiras, enquanto `listaTransacoes` concentra a tabela, os cards mobile, os filtros e os modais relacionados às transações.

## Decisões de arquitetura

### Contexto como fonte única de dados

Eu uso o `TransactionsProvider` como fonte única de verdade para transações e categorias. Dessa forma, o formulário, a lista, os cards de resumo, os gráficos e o dashboard sempre leem os mesmos dados.

Escolhi essa abordagem para evitar estados duplicados e inconsistências, como uma transação aparecer na lista mas não atualizar o saldo do dashboard. Quando a aplicação receber uma API, o contexto será o ponto natural para integrar carregamento, mutações e estados de erro.

### Tipos compartilhados

Eu mantenho os tipos `Transaction`, `NewTransaction` e `Category` em `src/types`. Isso evita que cada componente crie uma versão diferente dos mesmos dados e facilita a futura conversão para modelos de API e banco de dados.

### Dados inicialmente vazios

Eu decidi iniciar as transações vazias para que o usuário não confunda dados de demonstração com dados reais. As categorias padrão continuam disponíveis porque ajudam o usuário a começar a registrar movimentações sem precisar configurar toda a aplicação primeiro.

### Estado em memória nesta fase

Eu mantenho os dados apenas em memória durante a sessão. Fiz essa escolha para concentrar esta etapa na experiência, nos fluxos e na arquitetura de componentes sem criar uma persistência provisória que depois precisaria ser substituída.

Isso significa que atualizar a página ainda apaga as transações cadastradas. A persistência será implementada em uma etapa própria, com autenticação, banco de dados, migrações e tratamento de erros.

### Responsividade sem dependência externa

Eu uso tabela em telas maiores e cards em telas pequenas na lista de transações. Essa decisão melhora a leitura no celular sem forçar uma tabela horizontal para uma tarefa que precisa ser rápida.

Os gráficos atuais usam CSS e componentes próprios. Eu preferi não adicionar uma biblioteca de gráficos enquanto as necessidades visuais ainda são simples, reduzindo dependências e mantendo o controle sobre a identidade visual.

## Funcionalidades atuais

### Dashboard

Eu criei um dashboard com:

- saldo atual;
- total de receitas;
- total de despesas;
- quantidade de categorias;
- fluxo de caixa mensal;
- distribuição circular das despesas por categoria;
- acompanhamento de orçamentos por categoria;
- balanço entre receitas e despesas;
- insights rápidos;
- últimas transações.

O dashboard foi pensado para responder rapidamente três perguntas: quanto eu tenho, para onde meu dinheiro está indo e como minhas entradas estão se relacionando com minhas saídas.

### Transações

Eu posso:

- adicionar uma receita ou despesa;
- editar uma transação;
- visualizar seus detalhes;
- excluir com confirmação;
- usar vírgula para informar centavos;
- buscar pela descrição;
- filtrar por tipo;
- filtrar por categoria;
- filtrar por intervalo de datas;
- limpar os filtros sem perder os dados cadastrados.

Os filtros são aplicados localmente sobre os dados do contexto. Assim, a lista filtrada não altera os totais do dashboard, que continuam representando todas as transações da sessão.

### Categorias

Eu posso:

- usar categorias padrão;
- criar categorias;
- editar nomes;
- escolher ícones;
- excluir categorias que ainda não possuem transações.

Eu bloqueio a exclusão de categorias vinculadas a transações para evitar referências inválidas. Hoje as transações armazenam o nome da categoria; quando eu implementar persistência, pretendo migrar essa relação para um `categoryId`.

### Configurações

A página de configurações está explicitamente marcada como em desenvolvimento. Eu prefiro deixar essa limitação clara em vez de apresentar controles que ainda não possuem comportamento real.

### Contas recorrentes

Eu posso cadastrar compromissos mensais com nome, valor, dia de vencimento, categoria opcional e status de pagamento. Também posso editar, excluir e alternar uma conta entre pendente e paga.

Eu mantive as contas recorrentes separadas das transações porque elas representam compromissos previstos, e não necessariamente movimentações que já aconteceram. Essa separação evita que uma conta apenas cadastrada altere o saldo antes de ser lançada como transação.

No dashboard, eu também recebo um aviso quando uma conta pendente vence nos próximos sete dias. Contas cujo dia já passou no mês aparecem como vencidas, para que eu consiga priorizar a regularização.

### Metas financeiras

Eu posso criar metas com nome, valor-alvo, valor acumulado e prazo. Cada meta mostra seu percentual de conclusão e pode ser editada ou removida.

Eu escolhi um modelo simples nesta primeira versão para validar o fluxo de planejamento. O valor acumulado ainda é informado diretamente pelo usuário; futuramente posso relacioná-lo a aportes ou transações específicas.

### Orçamentos e limites

Eu posso definir um limite mensal para cada categoria de despesa. O dashboard compara o que foi gasto no mês atual com o limite definido e apresenta uma barra de consumo.

Eu escolhi três estados para tornar o aviso objetivo:

- verde quando o gasto está abaixo de 80% do limite;
- amarelo quando o gasto chega a 80% e indica que devo ter atenção;
- vermelho quando o limite é atingido ou ultrapassado.

Eu substituí o ranking de gastos por categoria por esse painel porque saber onde eu gasto é útil, mas saber quanto ainda posso gastar é mais acionável para o controle financeiro. O ranking continua representado pela distribuição circular, enquanto o orçamento transforma essa leitura em uma decisão prática.

Os limites são mensais e calculados apenas sobre despesas do mês atual. Por enquanto, eles ficam em memória junto com as demais informações da sessão.

## Identidade visual

Eu escolhi uma interface escura com superfícies translúcidas, azul para ações e navegação, verde para receitas e vermelho/rosa para despesas. Essas cores têm significado funcional, não apenas decorativo: elas ajudam a identificar rapidamente o tipo de movimentação.

Também removi o texto genérico “Tudo em ordem” do header. Como ainda não existe uma regra real de saúde financeira, eu uso “Sessão local”, que descreve corretamente o estado atual da aplicação.

## Próximas prioridades

Depois dos filtros, contas recorrentes, metas financeiras e orçamentos, eu pretendo evoluir o produto nesta ordem:

1. relacionar aportes às metas financeiras;
2. comparar períodos no dashboard;
3. implementar persistência com banco de dados e autenticação.

Eu mantenho essa ordem porque primeiro quero melhorar a capacidade de análise e planejamento usando o modelo atual. A persistência vem depois das regras de negócio principais estarem mais claras, para que eu não congele um modelo de dados incompleto.

## Como executar

```bash
npm install
npm run dev
```

Depois, eu acesso [http://localhost:3000](http://localhost:3000).

## Validação

Antes de considerar uma alteração concluída, eu executo:

```bash
npm run lint
npm run build
git diff --check
```

Eu uso o lint para verificar problemas de código, o build para confirmar a compilação e a geração das rotas, e o `git diff --check` para evitar problemas simples de formatação.
