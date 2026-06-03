# Módulo CRM Operacional

CRM de retenção e relacionamento (não comercial). Camada de inteligência sobre os dados que já existem (clientes, agenda, pagamentos, fotos, serviços). Foco mobile, ações rápidas, simplicidade.

## 1. Navegação

- Adicionar item **CRM** no `BottomNav` entre **Agenda** e **Relatórios**.
- Rota nova: `/crm` (página principal) e `/crm/cliente/:id` reaproveitando a `ClienteFicha` com aba CRM.
- Ícone: `Heart` ou `Users` (lucide).

```text
Início | Movimentações | Agenda(centro) | CRM | Relatórios | Config
```

> Como o nav já está com 5 itens e Agenda é destaque central, reorganizamos para 6 itens mantendo Agenda no centro visual. Em telas pequenas, labels reduzidos.

## 2. Tela principal `/crm` — Central de Ações

Header simples ("CRM · Quem precisa de você hoje?") + grade de 6 cards (2 colunas mobile, 3 desktop). Cada card mostra contador grande + título + descrição curta. Clique abre um Drawer/Sheet com a lista detalhada e ações.

### Cards

1. **📞 Confirmar Agenda** — agendamentos nos próximos N dias (config, default 3) com `confirmation_status = 'pendente'`. Ações por item: WhatsApp, Confirmar (muda status), Remarcar (abre form).
2. **🔄 Retornos Pendentes** — clientes cujo último atendimento foi `atendido` e que não têm nenhum agendamento futuro. Ações: Agendar retorno (abre `ScheduleReturnDialog` ou form), WhatsApp.
3. **⚠ Clientes Inativas** — clientes sem atendimento (`atendido`) há mais de N dias (config, default 45). Ações: WhatsApp, Agendar.
4. **💰 Saldo Pendente** — agrupa por cliente os agendamentos com `paidAmount < amount` e status não cancelado. Mostra total/pago/saldo. Ações: Registrar pagamento (abre TransactionForm pré-preenchido), WhatsApp.
5. **⭐ Clientes VIP** — top N (default 10) por faturamento + frequência. Score = total gasto × peso 0.6 + nº atendimentos × peso 0.4 (normalizado). Lista simples.
6. **🎂 Aniversariantes** — clientes com aniversário no mês atual. *Requer campo `birth_date` em `clients`* (migration).

### Filtros rápidos (chips no topo)
Todas · Ativas · Inativas · Com saldo · Sem retorno · VIP — filtram uma lista única de clientes abaixo dos cards (modo lista).

### Mini-dashboard (faixa superior compacta)
Ativas | Inativas | Saldo total | Retornos | Confirmações | VIPs.

## 3. Ficha CRM da cliente

Nova aba **CRM** dentro de `ClienteFicha` (ao lado de Dados/Histórico/Fotos):

- **Resumo**: primeiro atendimento, último atendimento, próxima manutenção, status (Ativa/Inativa).
- **Financeiro**: total gasto, saldo pendente, último pagamento (valor + data), ticket médio.
- **Timeline unificada**: merge cronológico de atendimentos, pagamentos, fotos, observações, próximos retornos previstos. Ícones por tipo, data à esquerda.

## 4. Configurações CRM

Novo accordion em `Configuracoes` chamado **CRM**:

- Dias para cliente inativa (default 45)
- Dias antes para confirmação (default 3)
- Quantidade de VIPs (default 10)

Persistir em `user_settings` (novos campos).

## 5. Detalhes técnicos

### Banco
- `ALTER TABLE clients ADD COLUMN birth_date date NULL;`
- `ALTER TABLE user_settings` adicionar:
  - `crm_inactive_days int NOT NULL DEFAULT 45`
  - `crm_confirm_days int NOT NULL DEFAULT 3`
  - `crm_vip_count int NOT NULL DEFAULT 10`

### Código
- `src/pages/CRM.tsx` — central de ações.
- `src/components/crm/` — `ActionCard.tsx`, `ConfirmacoesPendentesSheet.tsx`, `RetornosPendentesSheet.tsx`, `InativasSheet.tsx`, `SaldoPendenteSheet.tsx`, `VipSheet.tsx`, `AniversariantesSheet.tsx`, `ClienteCrmTab.tsx`, `Timeline.tsx`, `WhatsAppButton.tsx`.
- `src/hooks/useCrm.ts` — derivações memoizadas a partir dos hooks existentes (`useClients`, `useAppointments`, `useTransactions`, `useClientPhotos`).
- `src/components/settings/CrmSettings.tsx` + entrada no accordion.
- `src/components/settings/ClientList.tsx` — adicionar campo aniversário.
- `BottomNav.tsx` — adicionar item CRM, rota em `App.tsx`.

### WhatsApp
Botão usa `https://wa.me/55<phone>?text=...` com mensagens template por contexto (confirmação / retorno / saldo / aniversário).

### Sem novas tabelas pesadas
Tudo derivado em memória dos hooks já existentes.

## 6. Fora de escopo desta entrega
- Envio automático de mensagens (apenas link wa.me).
- Notificações push.
- Score VIP customizável pelo usuário (usa fórmula fixa por enquanto).
