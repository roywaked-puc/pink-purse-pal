# BÍBLIA.md — Pink Purse Pal (App Marcinha Cílios)

> Documento **de produto e domínio**: o "o quê" e o "porquê".
> Para regras de execução/código do agente, veja `CLAUDE.md`.
> Última revisão: agosto/2026.

---

## 1. Identidade do produto

**Pink Purse Pal** é um ERP + Agenda + CRM para **profissionais autônomas da beleza**
(lash designer, sobrancelhas, nail designer, esteticista, cabeleireira, maquiadora).
Cobre o ciclo completo da cliente: cadastro → anamnese → fotos → agendamento →
atendimento → pagamento → financeiro → retorno/CRM → relatórios.

- **Não é "só uma agenda".** Toda decisão de produto deve preservar a visão de sistema completo.
- **Mobile-first.** Desktop é consequência, não prioridade (largura máxima 1152px).
- **Uso real, não protótipo.** Já roda em produção com dados reais.
- **Idioma do domínio: português.** Rotas, tipos, enums e status em pt-BR — decisão consciente.

**URLs**
- Produção (domínio próprio): https://app.marcinhacilios.com.br
- Publicado (Lovable): https://pink-purse-pal.lovable.app

## 2. Usuário e prioridades de UX

Usuário único por conta (autenticado). Não há papéis/permissões nem multiusuário por empresa.
Cada `user_id` é dono dos seus dados, isolados via RLS.

Ordem de prioridade em qualquer decisão de UX:
**rapidez de operação > poucos cliques > fluxo contínuo > mobile-first > dados confiáveis.**

- Preferir Drawer / Bottom Sheet / Modal a páginas inteiras.
- Exceção: **agendamento e reagendamento sempre usam o formulário completo de agenda**,
  nunca um popup simplificado — a usuária precisa ver calendário, horários e serviços juntos.
- Sempre confirmar antes de excluir.
- Linguagem simples e ações claras (Adicionar, Editar, Excluir).

## 3. Identidade visual

- Paleta rosa/branco, limpa e minimalista; tokens semânticos no `src/index.css` + Tailwind.
- Nunca hardcodar cores (`bg-white`, `text-black`, `bg-[#...]`) em componentes.
- Cores de serviço: as **11 cores oficiais do Google Calendar**, renderizadas a 20% de opacidade
  com borda esquerda sólida de 4px nos cards.
- Cores da timeline da ficha da cliente:
  azul claro = agendamento futuro · azul escuro = atendimento realizado · verde = pagamento.

## 4. Módulos

### 4.1 Autenticação
E-mail/senha via Lovable Cloud Auth (`/auth`, `/recuperar-senha`). Todo o resto é protegido por
`ProtectedRoute`. Sem cadastro anônimo. Validação de senha com indicador de força em tempo real.

### 4.2 Dashboard (`/`)
Saldo (com **ícone de olho** para ocultar valores, preferência salva em localStorage),
próximos atendimentos e retornos a confirmar. Cards de agendamento mostram
**dia da semana abreviado + data + horário** (ex: `seg, 17/08 · 14:00`).

### 4.3 Agenda (`/agendamentos`)
- Visões: Mês, Semana e Lista.
- Status de confirmação: `pendente | confirmado | atendido | cancelado | retorno_previsto`.
- Status de pagamento: `pago | nao_pago | sinal`.
- Validação de conflito de horário (início + duração).
- `parentAppointmentId` liga retornos ao atendimento de origem.
- **Permuta** (`isPermuta`): troca de serviço sem dinheiro — não gera cobrança nem entra em
  métricas financeiras/metas.
- **Trava de submit**: botão desabilita e mostra "Salvando..." para evitar agendas duplicadas.
- **Fluxo pós-atendimento**: ao marcar "Atendido" → abre o prompt de **fotos** → fim.
  A antiga etapa 2 ("Próxima manutenção" / `ScheduleReturnDialog`) foi **removida
  deliberadamente — não reintroduzir**.

### 4.4 Financeiro (`/movimentacoes`)
- Transação = `type` (entrada/saída) + `scope` (empresa/pessoal) + categoria + conta + valor.
- Origem: **agenda** (pagamento de atendimento, vinculado por `appointment_id`) ou **manual**.
- Um atendimento pode ter **vários pagamentos**, cada um em conta diferente (parte Pix, parte
  crédito); cada pagamento é uma movimentação própria ligada ao mesmo agendamento.
- Transações vinculadas a agendamento **não podem ser editadas** — só excluídas.
- Contas: dinheiro, banco, maquininha. Maquininha suporta **múltiplos tipos de cobrança**
  (`account_fee_types`: débito, crédito à vista, parcelado…), cada um com sua taxa;
  o formulário recalcula bruto → líquido conforme o tipo escolhido.
- Conta e valor > 0 são obrigatórios.

**Separação de caixa (empresa/pessoal) por atendimento** — decidido em ago/2026, ainda não
implementado. Cada atendimento pago (não permuta) vai reservar automaticamente um valor fixo
configurável para o caixa empresa (ex: R$ 40, pensado pra pagar contas), e o restante vai para
o caixa pessoal (livre pra saque). A divisão reaproveita o campo `scope` já existente em
`transactions` — não é um conceito novo, é uma automação sobre o campo que já existia. Regras:

- Se o valor recebido for menor que a reserva configurada, 100% vai para o caixa empresa até a
  reserva ser completada.
- A regra soma por **agendamento**, não por movimentação isolada: se houver sinal + pagamento
  final, o valor acumulado do agendamento é que decide a divisão.
- Mudança futura no valor de reserva só afeta agendamentos que ainda não tiveram nenhum pagamento;
  agendamentos já em andamento mantêm o valor de reserva vigente no primeiro pagamento deles.
- Cancelamento/estorno de pagamento reverte a divisão.
- A categoria da movimentação **não muda** com a divisão — mantém a categoria original escolhida
  no recebimento (ex: "Serviços") em ambas as partes. Quem representa a divisão é o `scope`,
  não a categoria.
- A feature terá toggle liga/desliga em Configurações, desligada por padrão.
- Implementação: divide o próprio lançamento manual que a usuária já cria (não gera lançamento
  novo a partir de `paid_amount`), pra não contar o mesmo dinheiro duas vezes nos relatórios.

### 4.5 Clientes e Ficha (`/cliente/:id`)
Dados cadastrais (telefone **único** — validação por dígitos), aniversário, recorrência,
histórico financeiro, histórico de atendimentos, fotos, anamnese e aba CRM.

- **Linha do tempo** unificada: atendimentos (pela data do agendamento) + pagamentos
  (pelo `created_at` real), com **agrupamento de pagamentos numa janela de ±2 minutos**.
- Histórico mostra o **intervalo em dias desde o atendimento concluído anterior**;
  o mais recente compara com hoje (ex: "Hoje · 5 dias desde o anterior").
- Cards da aba CRM: Total gasto · Total pago · **Saldo pendente** (soma dos `atendido` − pago,
  piso 0) · **Saldo de agendas abertas** (`pendente + confirmado + retorno_previsto`).

### 4.6 CRM (`/crm`)
Cards acionáveis (todo card e métrica abrem lista filtrada em `CrmListSheet`):
a confirmar, retornos previstos, inativas, VIPs, aniversariantes e **Produção do Mês**
(realizado, previsto, projeção, meta com barra colorida; permuta contabilizada à parte).
Configurável em Configurações → CRM: `crm_inactive_days`, `crm_confirm_days`,
`crm_vip_count`, `crm_monthly_goal`. Contato rápido via link `wa.me`.

### 4.7 Anamnese digital
Templates **versionados** (`anamnese_templates` → `anamnese_template_versions` →
`anamnese_questions`) com 8 tipos de pergunta, respostas por cliente
(`anamnese_responses` → `anamnese_answers`), assinatura em canvas e impressão/PDF.
**Ficha assinada nunca é editada** — mudança gera nova versão do template.

### 4.8 Relatórios (`/relatorios`)
Financeiro (inclui **BI de Gastos** por escopo, com seletor de mês e barras horizontais),
Movimentações (10 colunas, com Saldo Anterior), Agendamentos e Indicadores.
Exportação CSV e PDF (jsPDF; extrato financeiro em paisagem).
**Todo dado novo deve nascer pensando em alimentar um relatório.**

### 4.9 Configurações
Contas (+ tipos de cobrança), categorias, clientes, serviços, templates de anamnese,
regras de CRM, regras de retenção, Google Calendar, troca de senha e exportação de dados.

## 5. Guardrails de negócio (nunca violar)

1. **Nunca somar `empresa` e `pessoal`** no mesmo saldo/relatório sem pedido explícito.
2. **Nunca apagar histórico**: movimentações, pagamentos, fotos e anamneses não são excluídos
   silenciosamente; usar status quando aplicável. Confirmar sempre antes de excluir.
3. **Anamnese assinada é imutável** — versionar.
4. **Permuta não entra em receita nem em meta.**
5. **Sinal ≠ pagamento** — são estados distintos, não percentual.
6. Não excluir agendamento que já possui pagamentos vinculados.
7. **CRM e Financeiro são módulos conceitualmente separados** — não misturar regras.
8. Toda tabela nova precisa de RLS por `auth.uid()` **e** GRANTs antes de ir a produção.
9. **Caixa empresa/pessoal** (a partir de ago/2026): `scope` não representa mais só
   "de quem é esse dinheiro" de forma manual — passa também a ser alimentado por uma automação
   de divisão de recebimentos de atendimento. Ver detalhe em 4.4.

## 6. Modelo de dados

| Tabela | Papel |
|---|---|
| `clients` | Clientes (telefone único, aniversário, recorrência, observações privadas) |
| `services` | Catálogo (valor, duração padrão 60min, cor) |
| `categories` | Categorias por `type` + `scope` |
| `accounts` | Contas/formas de recebimento |
| `account_fee_types` | Tipos de cobrança por conta, com taxa própria |
| `appointments` | Agendamentos (status, permuta, `parent_appointment_id`, `google_event_id`) |
| `transactions` | Movimentações (`appointment_id`, `account_fee_type_id`, `payment_type`) |
| `user_settings` | Google Calendar, retenção, CRM, meta mensal |
| `client_photos` | Fotos antes/depois (bucket `client-photos`) |
| `anamnese_*` | Templates versionados, perguntas, respostas e answers |

Fonte da verdade do schema: `supabase/migrations/` (cronológico, ~24 migrações).
`src/integrations/supabase/types.ts` é **gerado** — nunca editar à mão.

## 7. Integrações

- **Lovable Cloud** (Postgres + Auth + Storage + Edge Functions, API compatível com Supabase).
  Não existe projeto Supabase avulso administrado à parte.
- **Google Calendar**: sync **unidirecional** (app → Google) via Edge Function `google-calendar`,
  com idempotência por `google_event_id`. Client id/secret por usuário em `user_settings`;
  **o secret nunca é lido no cliente** (apenas um booleano "configurado").
- **WhatsApp**: link `wa.me` gerado em `src/lib/whatsapp.ts` — não é API oficial.

## 8. Escala atual (ago/2026, referência)

`transactions` ~700 · `appointments` ~330 · `services` ~104 · `clients` ~71 · 2 usuários.
Volume ainda não exige paginação agressiva, mas evite carregar tudo sem filtro de data.

## 9. Roadmap — **não implementar sem pedido explícito**

- Módulo dedicado de "Gestão Financeira" (fluxo de caixa, projeções, lucro).
- Serviço-pai com variações (hoje cada variação é um serviço independente).
- Multiusuário / equipe e expansão para outros segmentos.
- Sync bidirecional com Google Calendar.

## 10. Lacunas a decidir

- [ ] Monetização (SaaS multi-tenant) vs uso próprio.
- [ ] Backup/retenção além do `ExportData`.
- [ ] LGPD formal (há fotos e anamneses = dados sensíveis).

---

**Manutenção deste documento:** toda decisão de produto ou regra de negócio nova tomada em
conversa deve ser refletida aqui, na seção correspondente — não apenas no código.
