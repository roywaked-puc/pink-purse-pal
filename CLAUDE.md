# CLAUDE.md — guia de trabalho no repositório

Este arquivo orienta o Claude (Claude Code ou outra interface) ao trabalhar neste repositório.
Ele é o **"como trabalhar"**. O **"o quê e porquê"** (produto, domínio, regras de negócio)
está em `BIBLIA.md` — **leia `BIBLIA.md` antes de qualquer alteração funcional.**

---

## 0. Regras de ouro (leia sempre)

1. **Leia `BIBLIA.md` primeiro.** Os guardrails da seção 5 de lá são inegociáveis.
2. **Nunca reescreva arquivos inteiros sem necessidade.** O repositório é sincronizado
   bidirecionalmente com o **Lovable** via GitHub; alterações grandes geram conflito.
   Prefira diffs pequenos e cirúrgicos.
3. **Implemente apenas o que foi pedido.** Pode *sugerir* melhorias reais (não cosméticas),
   mas não as implemente sem combinar.
4. **Antes de alterar, avalie o impacto no sistema todo.** Nunca quebrar o que já funciona.
5. **Domínio em português.** Não traduzir rotas, tipos, enums ou status para inglês.
6. **Não editar arquivos gerados**: `src/integrations/supabase/types.ts`,
   `src/integrations/supabase/client.ts`, `supabase/config.toml`, `.env`.
7. **Nunca editar migração já aplicada** — sempre criar uma nova.
8. **Nunca commitar segredos.** Chaves sensíveis ficam em Lovable Cloud → Secrets.

## 1. Stack

| Camada | Tecnologia |
|---|---|
| Build/dev | Vite 5 |
| Linguagem | TypeScript 5 |
| UI | React 18 + shadcn/ui (Radix) + Tailwind CSS 3 |
| Rotas | React Router v6 |
| Estado servidor | TanStack Query v5 |
| Backend | Lovable Cloud (Postgres + Auth + Storage + Edge Functions, API compatível com Supabase) |
| Formulários | React Hook Form + Zod |
| Gráficos | Recharts |
| PDF | jsPDF + jspdf-autotable |
| Datas | date-fns v3 (locale pt-BR) |

## 2. Comandos

```bash
npm i              # instalar dependências
npm run dev        # dev server (Vite, porta 8080)
npm run build      # build de produção
npm run build:dev  # build em modo development
npm run lint       # ESLint
npm run preview    # servir o build
```

Não há suíte de testes automatizados. Validação = `npm run lint` + `npm run build` + teste manual.

> ⚠️ Existem `bun.lock` **e** `package-lock.json`. **Use npm** por padrão e confirme com o
> usuário antes de instalar pacotes, para não gerar lockfiles conflitantes.

## 3. Estrutura

```
src/
  pages/          # 1 arquivo por rota (Index, Agendamentos, Movimentacoes, CRM,
                  #  ClienteFicha, Relatorio*, Configuracoes, Auth, RecuperarSenha)
  components/
    ui/           # shadcn puro — não editar à mão; regenerar via shadcn
    ds/           # design system interno: EmptyState, MoneyDisplay, StatusBadge,
                  #  SectionHeader, FormSheet
    appointments/ clients/ crm/ dashboard/ anamnese/ settings/ transactions/
    relatorios/ layout/ shared/
  contexts/       # AuthContext (sessão) e AppContext (domínio, agrega os hooks)
  hooks/          # 1 hook por entidade (useClients, useAppointments, useTransactions,
                  #  useAccounts, useAccountFeeTypes, useCategories, useServices,
                  #  useCrm, useAnamnese, useClientPhotos, useGoogleCalendar, useUserSettings)
  integrations/supabase/  # client.ts + types.ts (GERADOS — não editar)
  types/index.ts  # tipos de domínio
  lib/            # whatsapp, passwordValidation, sanitizeError, maintenance, anamneseSeeds, utils
supabase/
  migrations/     # SQL cronológico — fonte da verdade do schema
  functions/google-calendar/
```

## 4. Padrões obrigatórios

### 4.1 Acesso a dados
Cada entidade segue: `useX` (query) + `useAddX` / `useUpdateX` / `useDeleteX` (mutations)
em `src/hooks/`, consumidos via `AppContext`.
**Nunca chamar `supabase` diretamente dentro de um componente de página.**

- Erros de banco passam por `sanitizeDbError` (`src/lib/sanitizeError.ts`) e são
  traduzidos para mensagens amigáveis em pt-BR.
- Queries com filtro de data **devem incluir as datas na `queryKey`** (bug já ocorrido no
  BI de Gastos: cache não invalidava ao trocar o mês).
- Ao criar registros dependentes, **aguarde o UUID real com `mutateAsync`** antes de salvar
  o dependente (ex: cliente criado durante o fluxo de agendamento).
- Invalide as queries certas em `onSuccess`.

### 4.2 Tipos
Tipos de domínio em `src/types/index.ts`. Ao alterar uma tabela, atualize o tipo aqui também
(o `types.ts` do Supabase é regenerado, não editado).

### 4.3 UI
Antes de estilizar do zero, procure em `components/ds/` e `components/ui/`.
Cores só via tokens semânticos — nunca `text-white`, `bg-black` ou `bg-[#hex]`.
Formulários: React Hook Form + Zod. Feedback: `toast` (`use-toast` / sonner).

### 4.4 Banco de dados
Toda migração que cria tabela no schema `public` deve seguir esta ordem, sem exceção:

```sql
CREATE TABLE public.<nome> (...);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.<nome> TO authenticated;
GRANT ALL ON public.<nome> TO service_role;
ALTER TABLE public.<nome> ENABLE ROW LEVEL SECURITY;
CREATE POLICY "..." ON public.<nome> FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
```

Nome do arquivo: `YYYYMMDDHHMMSS_<uuid>.sql`. Nunca alterar migrações antigas.
Não mexer nos schemas `auth`, `storage`, `realtime`, `supabase_functions`, `vault`.

### 4.5 Edge Functions
Dependências pesadas com prefixo `npm:`. **Nunca retornar erro cru** ao cliente — sanitizar
antes de responder (findings de segurança já corrigidos nesse sentido).

## 5. Armadilhas já enfrentadas (não repetir)

- **Modais em cascata**: ao marcar "Atendido" pelo formulário, o card pai desmontava e matava
  o modal seguinte. Solução: estado dos diálogos **elevado ao nível da página**
  (`Index.tsx` / `Agendamentos.tsx`) + `mutateAsync` antes de abrir o próximo passo.
- **Duplo clique gerando agenda duplicada**: manter a trava `isSubmitting` no `AppointmentForm`.
- **Update parcial de cliente apagava campos** (`recurrence_days`, `birth_date`): sempre
  enviar o objeto completo no update.
- **Telefone duplicado**: validação normalizando para dígitos, em add **e** update.
- **Etapa "Próxima manutenção" pós-atendimento foi removida a pedido — não reintroduzir.**
- **`google_client_secret` nunca vai ao cliente** — expor apenas
  `google_client_secret_configured: boolean`.

## 6. Checklist antes de entregar uma alteração

- [ ] Li `BIBLIA.md` e nenhum guardrail foi violado (escopo empresa/pessoal, permuta, histórico).
- [ ] Reutilizei hooks/componentes existentes em vez de criar paralelos.
- [ ] Tipos atualizados em `src/types/index.ts`, se necessário.
- [ ] Nova tabela → RLS + GRANTs na mesma migração.
- [ ] Textos de UI em português, tom simples e direto.
- [ ] Testado no viewport mobile.
- [ ] `npm run lint` e `npm run build` passam.
- [ ] Diff pequeno e localizado (sincronização com o Lovable).
- [ ] `BIBLIA.md` atualizado se a mudança criou/alterou regra de negócio.

## 7. Fluxo Lovable ↔ GitHub

O projeto é editado nos dois lados. Antes de começar, **puxe as alterações** (o Lovable pode
ter commitado). Depois de terminar, faça commit/push — o Lovable reflete automaticamente.
Backend (tabelas, RLS, secrets, deploy de functions) é gerenciado pelo painel do Lovable
(aba Cloud); via código, entregue a migração SQL em `supabase/migrations/`.
