# CLAUDE.md

Este arquivo orienta o Claude (via Claude Code ou outra interface) ao trabalhar neste repositório.

> 📖 Para contexto de produto/negócio mais profundo, veja também `PROJECT_BIBLE.md`.

## O que é este projeto

**Pink Purse Pal** é um sistema de gestão para profissionais autônomos de estética/beleza
(ou serviço similar por agendamento). É um app web (mobile-first) que centraliza:

- Agenda de atendimentos (agendamentos)
- Financeiro (entradas/saídas, separado em conta **empresa** e **pessoal**)
- CRM de clientes (retenção, indicadores, WhatsApp)
- Ficha do cliente (histórico, fotos de antes/depois, anamnese)
- Relatórios (financeiro, agendamentos, indicadores)
- Integração com Google Calendar

Foi criado originalmente no **Lovable** (gerador de apps via IA) e agora está sendo evoluído
diretamente por código, com o Claude como par de desenvolvimento.

## Stack técnica

| Camada | Tecnologia |
|---|---|
| Build/dev | Vite |
| Linguagem | TypeScript |
| UI | React 18 + shadcn/ui (Radix) + Tailwind CSS |
| Roteamento | React Router v6 |
| Estado servidor | TanStack Query (React Query) |
| Backend | Lovable Cloud (Postgres + Auth + Storage + Edge Functions, compatível com a API do Supabase) |
| Formulários | React Hook Form + Zod |
| Gráficos | Recharts |
| PDF | jsPDF + jspdf-autotable |
| Gerenciador de pacotes | npm (há também bun.lock — ver nota abaixo) |

⚠️ O repositório tem `bun.lock`/`bun.lockb` **e** `package-lock.json`. Confirme com o usuário
qual gerenciador está em uso antes de instalar pacotes, para não gerar lockfiles conflitantes.

## Comandos

```bash
npm i              # instalar dependências
npm run dev         # servidor de desenvolvimento (Vite)
npm run build        # build de produção
npm run build:dev      # build em modo development
npm run lint         # ESLint
npm run preview       # servir o build localmente
```

Não há suíte de testes automatizados configurada no projeto até o momento.

## Estrutura de pastas

```
src/
  pages/          # Uma página por rota (Index, Agendamentos, CRM, Movimentacoes, Relatorios*, Configuracoes, Auth...)
  components/
    ui/           # Componentes shadcn/ui "puros" (não editar estilo/API à mão — regenerar via shadcn quando possível)
    appointments/ # Formulário e calendários de agendamento
    clients/      # Fotos de clientes, comparador, upload
    crm/          # Cards de ação, aba CRM da ficha do cliente, WhatsApp
    dashboard/    # Cards da home (saldo, próximos atendimentos, retornos)
    anamnese/     # Fichas de anamnese (formulário, viewer, assinatura)
    settings/     # Telas de configuração (contas, categorias, clientes, serviços, CRM, Google Calendar)
    transactions/ # Formulário e itens de movimentação financeira
    layout/       # MainLayout, BottomNav, PageHeader
    ds/           # "Design system" interno: EmptyState, MoneyDisplay, StatusBadge, SectionHeader, FormSheet
  contexts/       # AuthContext (sessão Supabase) e AppContext (estado de domínio via hooks)
  hooks/          # Um hook por entidade (useClients, useAppointments, useTransactions, useCrm, useAnamnese, useGoogleCalendar...)
  integrations/supabase/  # client.ts e types.ts (tipos gerados do schema — não editar à mão)
  types/          # Tipos de domínio (Transaction, Appointment, Client, Service, Category, Account...)
  lib/            # Utilitários (whatsapp.ts, passwordValidation.ts, sanitizeError.ts, maintenance.ts)
supabase/
  migrations/     # Histórico de migrações SQL (fonte da verdade do schema)
  functions/      # Edge Functions (google-calendar)
  config.toml
```

## Convenções do projeto

- **Idioma**: nomes de rotas, páginas, tipos de domínio e textos de UI estão em **português**
  (`Agendamentos`, `Movimentacoes`, `ClienteFicha`, campos como `scope: 'empresa' | 'pessoal'`).
  Mantenha esse padrão ao criar novas features — não traduza para inglês no meio do código.
- **Padrão de dados**: cada entidade de domínio segue o padrão
  `useX` (query), `useAddX`, `useUpdateX`, `useDeleteX` (mutations) em `src/hooks/`,
  consumidos via `AppContext` (`src/contexts/AppContext.tsx`). Ao adicionar uma entidade nova,
  siga esse mesmo padrão em vez de acessar o Supabase direto dentro de componentes de página.
- **Tipos de domínio** ficam centralizados em `src/types/index.ts`. Ao alterar uma tabela no
  Supabase, atualize também o tipo correspondente aqui (os tipos gerados ficam em
  `src/integrations/supabase/types.ts`, que é auto-gerado — não editar manualmente).
- **UI compartilhada**: antes de estilizar algo do zero, veja se já existe em `components/ds/`
  (`MoneyDisplay` para valores monetários, `StatusBadge` para status, `EmptyState`, etc.) ou em
  `components/ui/` (shadcn).
- **Autenticação**: todo o app é protegido por `ProtectedRoute` em `App.tsx`, que depende de
  `AuthContext`. Rotas públicas: `/auth` e `/recuperar-senha`.
- **Financeiro**: toda transação tem `type` (`entrada` | `saida`) e `scope` (`empresa` | `pessoal`).
  Saldos são sempre calculados filtrando por `scope` — não misture os dois em somas.
- **Row Level Security (RLS)**: o banco (Lovable Cloud, Postgres) usa RLS — a maioria das
  tabelas já tem políticas. Qualquer tabela nova precisa de política de RLS coerente com
  `auth.uid()` antes de ir para produção — nunca deixe uma tabela sem RLS.

## Banco de dados (Lovable Cloud)

> ⚠️ O banco, auth, storage e edge functions são gerenciados pelo **Lovable Cloud**, direto
> pelo painel do Lovable (aba "Cloud" → Database/Storage/Users/Secrets/Edge functions) — não
> existe um projeto Supabase separado sendo administrado à parte. A biblioteca cliente usada
> no código (`@supabase/supabase-js`) e a pasta `src/integrations/supabase/` existem porque o
> Lovable Cloud expõe uma API compatível com Supabase, mas a gestão (secrets, tabelas, RLS,
> deploy de functions) acontece toda dentro do Lovable.


Tabelas principais (ver `supabase/migrations/` para o histórico completo e
`src/integrations/supabase/types.ts` para os tipos atuais):

`clients`, `services`, `categories`, `accounts`, `appointments`, `transactions`,
`user_settings`, `client_photos`, `anamnese_templates`, `anamnese_template_versions`,
`anamnese_questions`, `anamnese_responses`, `anamnese_answers`.

- Migrações são incrementais e cronológicas (`YYYYMMDDHHMMSS_uuid.sql`). **Nunca edite uma
  migração já aplicada** — crie uma nova migração para qualquer alteração de schema.
- A Edge Function `google-calendar` cuida da sincronização de agendamentos com o Google Calendar
  (tokens ficam em `user_settings`).

## O que evitar

- Não commitar chaves/segredos do Lovable Cloud ou do Google Calendar direto no código
  (`VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` vêm de variáveis de ambiente; secrets
  sensíveis ficam em Lovable Cloud → Secrets, não no repositório).
- Não editar `src/integrations/supabase/types.ts` manualmente — é gerado a partir do schema.
- Não misturar saldo `empresa` e `pessoal` em uma mesma soma/relatório sem intenção explícita.
- Não remover o padrão de idioma em português do domínio (nomes de rotas, tipos, enums) só
  porque "código costuma ser em inglês" — é uma decisão consciente do projeto.

## Fluxo de trabalho com o Claude

Este projeto é sincronizado bidirecionalmente com o **Lovable** via GitHub. Isso significa:

- Alterações feitas por mim aqui (via commit/push) refletem de volta no editor do Lovable.
- Alterações feitas no Lovable também aparecem aqui.
- Evite reescrever arquivos inteiros sem necessidade — como o Lovable também versiona esse
  código, mudanças menores e específicas reduzem o risco de conflito.
