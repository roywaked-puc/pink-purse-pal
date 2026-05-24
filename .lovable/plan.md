# Roadmap Estratégico — Pink Purse Pal

Audit em 2026-05. Aplicativo tratado como SaaS para designers de cílios / MEIs.
Princípio: **agenda + recebimento são o CORE**. Tudo o mais é suporte.

---

## Sprint 1 — Base UX (rápido, alto impacto)

- [ ] Reorganizar Home como "Meu Dia": agenda de hoje no topo, saldos abaixo
- [ ] Reordenar BottomNav: Agenda como item central de destaque
- [ ] Criar componentes de DS reutilizáveis: `StatusBadge`, `EmptyState`
- [ ] Padronizar uso desses componentes nas telas existentes

## Sprint 2 — Velocidade nas ações CORE

- [ ] "Concluir" em 1 toque direto no card do agendamento (sem abrir form)
- [ ] "Receber" em 1 toque com transação pré-preenchida (valor, cliente, conta padrão)
- [ ] Swipe actions no card (concluir / receber / editar)
- [ ] Conta padrão configurável em Configurações

## Sprint 3 — Cliente como ativo

- [ ] Ficha do cliente: timeline de atendimentos + total gasto + frequência média
- [ ] Recorrência sugerida (ex.: manutenção a cada 21 dias) com botão "Reagendar"
- [ ] Lembrete WhatsApp 1-clique (link `wa.me` com mensagem pré-pronta)
- [ ] Campo "última visita" e "próxima sugerida" no card do cliente

## Sprint 4 — Consolidação técnica

- [ ] Unificar as 3 telas de Relatórios em uma com abas
- [ ] Migrar `transactions.account` e `transactions.category` para FK
- [ ] Converter `confirmation_status` e `payment_status` em enums
- [ ] Quebrar `AppContext` (god context) em contexts menores por domínio
- [ ] Quebrar `TransactionForm` e `AppointmentForm` (>470 linhas cada)
- [ ] Tabela `appointment_payments` para pagamento parcial limpo

## Sprint 5 — Design System maduro

- [ ] Pasta `src/components/ds/` com `FormSheet`, `MoneyDisplay`, `StatusBadge`, `EmptyState`, `SectionHeader`
- [ ] Loader/skeleton unificado por contexto (lista, card, form)
- [ ] Tokens de espaçamento e tipografia revisados no `index.css`

## Sprint 6 — Crescimento

- [ ] Onboarding em 3 passos (conta padrão, primeiro serviço, primeiro cliente)
- [ ] Programa de fidelidade simples (selo a cada X atendimentos)
- [ ] Exportação PDF de relatórios
- [ ] Backup/restauração de dados do usuário

---

## MVP v1.0 (corte mínimo para "produto vendável")

Home "Meu Dia" · Ficha de cliente · Recorrência · Lembrete WhatsApp ·
Pagamento parcial · Relatórios unificados · Onboarding · Fidelidade simples.

---

## Histórico

- v0: Dashboard de Indicadores entregue (`/relatorio-indicadores`)
- v0: Autenticação com mostrar senha + recuperação de senha
