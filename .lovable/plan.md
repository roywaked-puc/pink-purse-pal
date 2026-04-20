
## Análise do Problema do "Valor Recebido"

### Investigação

O campo `paidAmount` da agenda é atualizado em vários pontos:
1. **`useAddTransaction`** — quando uma transação é vinculada à agenda, soma ao `paidAmount`
2. **`useDeleteTransaction` / `subtractAppointmentPayment`** — subtrai ao excluir
3. **`updateAppointmentPayment`** — usado pelo botão "Receber"

### Causas Prováveis da Divergência

1. **Dessincronia entre soma de transações vinculadas e `paid_amount`**: Como o `paid_amount` é mantido manualmente (incrementado/decrementado), qualquer falha de rede, erro de mutation, ou edição direta pode deixar o valor fora de sincronia com a soma real das transações com `appointment_id` daquela agenda.

2. **Edição de transação vinculada**: Se uma transação vinculada tem o valor alterado (mesmo que a regra atual bloqueie isso na UI), o `paid_amount` não é recalculado.

3. **Taxas de conta (gross/net)**: Transações com conta que tem `feePercentage` salvam o valor líquido, mas a soma pode não bater com o que o usuário espera ver.

4. **Múltiplas operações concorrentes**: Race conditions entre criar/excluir transações podem causar somas incorretas.

### Solução Proposta

**Parte 1 — Botão para visualizar movimentos da agenda**

Adicionar no card de edição de agendamento (`AppointmentForm.tsx`) um botão "Ver Movimentos" que:
- Aparece apenas no modo edição (quando há `appointment.id`)
- Abre um Dialog listando todas as transações com `appointment_id` igual ao da agenda
- Mostra: data, valor, conta, descrição
- Exibe no rodapé: **Soma das transações** vs **paid_amount registrado**, destacando em vermelho se houver divergência
- Inclui botão "Recalcular paid_amount" que atualiza o `paid_amount` da agenda para igualar à soma real das transações vinculadas (correção manual)

**Parte 2 — Arquivos a alterar**

1. **Novo componente** `src/components/appointments/AppointmentTransactionsDialog.tsx`
   - Recebe `appointmentId`, `open`, `onOpenChange`
   - Busca transações filtrando `transactions` do contexto por `appointmentId`
   - Renderiza lista + totalizador + botão recalcular

2. **`src/components/appointments/AppointmentForm.tsx`**
   - Importar o novo dialog
   - Adicionar botão "Ver Movimentos" (ícone `Receipt` ou `ListOrdered`) próximo ao campo "Valor Recebido", visível apenas em edição
   - Estado local para abrir/fechar o dialog

3. **`src/contexts/AppContext.tsx`**
   - Já existe `updateAppointmentPayment(id, paidAmount)` — usar essa função para o "Recalcular"

### Diagrama do Fluxo

```text
[Editar Agenda] 
     │
     ▼
[Botão "Ver Movimentos"] ──► [Dialog]
                                │
                                ├─ Lista transações vinculadas
                                ├─ Soma real: R$ X
                                ├─ paid_amount: R$ Y
                                └─ [Recalcular] (se X ≠ Y)
                                       │
                                       ▼
                              updateAppointmentPayment(id, X)
```

### Observação
Esta abordagem dá ao usuário **visibilidade e controle** sobre a divergência, sem mudar a lógica atual de soma/subtração (que pode ser refatorada depois para calcular `paidAmount` derivado em tempo real, mas isso é mudança maior).
