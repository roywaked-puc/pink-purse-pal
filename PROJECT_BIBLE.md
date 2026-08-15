# Pink Purse Pal — Bíblia do Projeto

> Documento de referência de produto, domínio e arquitetura. Complementa o `CLAUDE.md`
> (que foca em como trabalhar no código). Mantenha este documento atualizado conforme o
> produto evolui — ele é o "porquê" por trás das decisões técnicas.

---

## 1. Visão geral do produto

Sistema de gestão para um profissional autônomo (provavelmente do setor de estética/beleza,
a julgar pelo domínio: anamnese, fotos de antes/depois, fichas de cliente) que precisa
administrar, em um único lugar:

- **Agenda** de atendimentos
- **Financeiro**, separando o que é da empresa e o que é pessoal
- **Relacionamento com clientes** (CRM): retenção, recorrência, indicadores
- **Prontuário do cliente**: histórico de atendimentos, fotos, ficha de anamnese
- **Relatórios** para entender saúde financeira e operacional do negócio

O app é **mobile-first** (há `BottomNav`, `use-mobile.tsx`), pensado para ser usado no
celular durante o dia a dia do atendimento.

Origem: criado com **Lovable** (ferramenta de geração de app via IA/prompt) e agora mantido
também via código diretamente, com sincronização bidirecional Lovable ↔ GitHub. O backend
(banco, autenticação, storage, edge functions) roda no **Lovable Cloud**, gerenciado direto
pelo painel do Lovable — não é um projeto Supabase avulso administrado à parte.

## 2. Público-alvo / usuário

Usuário único por conta (autenticado via Supabase Auth) — não há indícios de multi-usuário
por "empresa" ou papéis/permissões (admin, funcionário etc.). Cada `user_id` é dono dos seus
próprios dados (clients, appointments, transactions...), isolados via RLS.

## 3. Módulos do produto

### 3.1 Autenticação (`Auth.tsx`, `RecuperarSenha.tsx`, `AuthContext`)
Login/cadastro e recuperação de senha via Supabase Auth. Toda a aplicação, exceto essas duas
rotas, é protegida (`ProtectedRoute` em `App.tsx`).

### 3.2 Dashboard (`Index.tsx`)
Visão inicial: saldo (`BalanceCard`), próximos atendimentos (`AppointmentPreview`), e
retornos a confirmar (`ReturnsToConfirmCard`).

### 3.3 Agendamentos (`Agendamentos.tsx`)
- Calendário semanal e mensal (`WeeklyCalendar`, `MonthlyCalendar`)
- Formulário de agendamento (`AppointmentForm`) com autocomplete de cliente e serviço
- Status de confirmação: `pendente | confirmado | atendido | cancelado | retorno_previsto`
- Status de pagamento: `pago | nao_pago | sinal`
- Suporte a **permuta** (troca de serviço sem dinheiro — campo `isPermuta`)
- Agendamentos podem ter um "agendamento pai" (`parentAppointmentId`) — usado para
  retornos/recorrências
- Integração opcional com **Google Calendar** (Edge Function `google-calendar`,
  configurável em `Configuracoes` → `GoogleCalendarSettings`)

### 3.4 Financeiro (`Movimentacoes.tsx`)
- Lançamentos de entrada/saída (`Transaction`)
- Cada transação tem **escopo**: `empresa` ou `pessoal` — os saldos nunca se misturam
- Vinculação opcional a um agendamento (pagamento de um atendimento gera transação)
- Categorias (`Category`) e contas (`Account`: dinheiro, banco, maquininha — com
  `feePercentage` para taxas de maquininha)

### 3.5 CRM (`CRM.tsx`, `useCrm.ts`, `components/crm/`)
Regras de negócio para reter e reativar clientes, configuráveis em
`Configuracoes` → `CrmSettings`:
- Clientes inativos (`crm_inactive_days`)
- Clientes a confirmar (`crm_confirm_days`)
- Clientes VIP (`crm_vip_count`)
- Meta mensal (`crm_monthly_goal`)
- Ação rápida de contato via **WhatsApp** (`WhatsAppButton`, `lib/whatsapp.ts`)

### 3.6 Ficha do Cliente (`ClienteFicha.tsx`)
Página consolidada por cliente, com abas para:
- Histórico de atendimentos e saldo em aberto
- Fotos (`ClientPhotosTab`, comparador de fotos antes/depois — `PhotoCompareDialog`,
  slideshow, lightbox)
- Anamnese (`ClienteAnamneseTab`)
- Aba de CRM específica do cliente (`ClienteCrmTab`)

### 3.7 Anamnese (`components/anamnese/`, `useAnamnese.ts`)
Sistema de formulários de anamnese com **templates versionados**
(`anamnese_templates` → `anamnese_template_versions` → `anamnese_questions`) e
respostas por cliente (`anamnese_responses` → `anamnese_answers`), incluindo assinatura
digital (`SignaturePad`). Isso indica necessidade de manter histórico legal/clínico —
**não é ideal apagar/sobrescrever versões antigas de template**, apenas versionar.

### 3.8 Relatórios (`Relatorios.tsx` e páginas `Relatorio*.tsx`)
- Financeiro (`RelatorioFinanceiro`)
- Movimentações (`RelatorioMovimentacoes`)
- Agendamentos (`RelatorioAgendamentos`)
- Indicadores (`RelatorioIndicadores`)
- Exportação em PDF (jsPDF)

### 3.9 Configurações (`Configuracoes.tsx`)
Cadastro de contas, categorias, clientes, serviços, templates de anamnese, regras de CRM,
regras de retenção, integração Google Calendar, troca de senha, exportação de dados
(`ExportData`).

## 4. Modelo de dados (resumo)

| Tabela | Papel |
|---|---|
| `clients` | Clientes cadastrados |
| `services` | Catálogo de serviços oferecidos (valor, duração) |
| `categories` | Categorias de transações (por tipo entrada/saída e escopo empresa/pessoal) |
| `accounts` | Contas/formas de recebimento (dinheiro, banco, maquininha) |
| `appointments` | Agendamentos/atendimentos |
| `transactions` | Lançamentos financeiros (podem estar ligados a um agendamento) |
| `user_settings` | Configurações do usuário (Google Calendar, CRM, retenção) |
| `client_photos` | Fotos de clientes (antes/depois), ligadas opcionalmente a um agendamento |
| `anamnese_templates` / `anamnese_template_versions` / `anamnese_questions` | Templates de formulário de anamnese, versionados |
| `anamnese_responses` / `anamnese_answers` | Respostas de anamnese por cliente |

Todas as tabelas usam Row Level Security (RLS) no banco do Lovable Cloud, isolando dados por
`user_id` (via `auth.uid()`). O histórico completo e a definição exata de colunas/constraints
está em `supabase/migrations/`, em ordem cronológica — é a fonte da verdade do schema, mais
confiável que qualquer resumo aqui. Essas migrações podem ser aplicadas/visualizadas tanto
pelo painel do Lovable Cloud (Database → SQL editor) quanto por código.

## 5. Decisões e convenções de negócio importantes

- **Separação empresa/pessoal é uma regra dura**: saldos, relatórios e indicadores nunca
  devem somar os dois escopos sem que isso seja pedido explicitamente.
- **Permuta**: um agendamento pode ser "permuta" (troca de serviço por outro serviço/produto,
  sem dinheiro envolvido) — não deve gerar cobrança nem inflar métricas financeiras.
- **Sinal vs. pagamento**: pagamentos parciais (`sinal`) e pagamentos completos são
  tratados como estados distintos, não apenas um percentual.
- **Domínio em português**: nomes de rotas, tipos e status refletem a língua do usuário final
  (não é código legado — é intencional).

## 6. Integrações externas

- **Lovable Cloud**: banco (Postgres), autenticação, storage (fotos de clientes, bucket
  `client-photos`) e Edge Functions — tudo gerenciado no painel do Lovable (aba "Cloud"),
  com API compatível com Supabase.
- **Google Calendar**: sincronização de agendamentos via OAuth (client id/secret armazenados
  por usuário em `user_settings`), implementada na Edge Function `google-calendar`.
- **WhatsApp**: não é uma API oficial integrada — é geração de link `wa.me` a partir do
  telefone do cliente (`lib/whatsapp.ts`), para contato manual rápido.

## 7. Uso real (referência, ago/2026)

Projeto já está em uso ativo, não é apenas protótipo. Ordem de grandeza dos dados no banco
(Lovable Cloud → Database), útil como referência para decisões de performance/paginação:

- `transactions`: ~694 registros
- `appointments`: ~322 registros
- `services`: ~104 registros
- `clients`: ~71+ registros
- Usuários autenticados: 2

Atualize esses números periodicamente aqui (ou remova esta seção se ficar desatualizada
demais) — o objetivo é dar noção de escala, não ser um contador preciso.

## 8. O que este documento NÃO cobre (e vale mapear com o time/usuário)

Ao evoluir o produto com o Claude, vale preencher/atualizar estas lacunas quando surgirem:

- [ ] Existe algum plano de monetização / é uso pessoal do dono do negócio?
- [ ] Há intenção futura de suportar múltiplos usuários por conta (equipe/funcionários)? —
      hoje há 2 usuários cadastrados; vale confirmar se são 2 contas independentes ou uso
      compartilhado de alguma forma.
- [ ] Existe processo de backup/retenção de dados além do `ExportData`?
- [ ] Há requisitos de LGPD/proteção de dados formalizados (dado que há fotos e fichas
      de anamnese — dados sensíveis)?

---

## Como manter este documento

Sempre que uma decisão de produto ou regra de negócio importante for tomada em conversa
com o Claude, atualize a seção relevante aqui (não só o código) — é isso que faz este
documento continuar valendo a pena para orientar decisões futuras.
