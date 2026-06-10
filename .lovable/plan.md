# Correção do fluxo "Agendar Agora" após concluir atendimento

## Diagnóstico do problema

O botão "Agendar Agora" abre o modal por uma fração de segundo e depois "some" porque os modais (`ScheduleReturnDialog` e `AppointmentForm` de retorno) estão renderizados **dentro** do componente `AppointmentPreview` (card do agendamento na dashboard).

Sequência que quebra hoje:

1. Usuária clica em ✓ Concluir no card.
2. `handleQuickComplete` chama `updateStatus({status: 'atendido'})`.
3. React Query invalida e o dashboard refiltra: a query `upcomingAppointments` em `src/pages/Index.tsx` (linha 67–71) remove agendamentos com status `atendido`/`cancelado`.
4. O `AppointmentPreview` daquele agendamento **desmonta**.
5. Junto com ele desmontam `ScheduleReturnDialog`, `PostAttendancePhotoPrompt` e o `AppointmentForm` de retorno → todo o estado (`returnDialogOpen`, `formOpen`, `prefill`) é destruído.
6. Resultado visível: a tela "volta" para a dashboard e nada acontece.

O mesmo problema existe em qualquer outra tela que use `AppointmentPreview` (ex.: `/agendamentos`, calendários semanal/mensal) sempre que a conclusão tira o agendamento da lista visível.

## Solução proposta

Subir o fluxo de pós-atendimento para um nível que **não desmonta** quando o card some.

### 1. Criar um `PostAttendanceFlowProvider` (contexto global)

Novo arquivo `src/contexts/PostAttendanceFlowContext.tsx` montado uma vez em `App.tsx` (dentro de `AppProvider`). Expõe:

- `startFlow(appointment)` — inicia o fluxo (foto → próxima manutenção).
- Internamente guarda o `sourceAppointment` em estado e controla a abertura sequencial de:
  - `PostAttendancePhotoPrompt`
  - `PhotoUploadDialog`
  - `ScheduleReturnDialog`
  - `AppointmentForm` com `prefill` (retorno)

Os modais são renderizados **uma única vez** dentro do Provider, portanto não somem quando qualquer card desmonta.

### 2. Simplificar `AppointmentPreview`

- Remover os states `historyOpen` (manter), `photoPromptOpen`, `photoUploadOpen`, `returnDialogOpen` e `wantsPhotoUpload`.
- Remover os JSX de `PostAttendancePhotoPrompt`, `PhotoUploadDialog` e `ScheduleReturnDialog`.
- `handleQuickComplete` passa a:
  ```ts
  updateStatus({ id: appointment.id, status: 'atendido' });
  if (hasBalance && onReceive) onReceive(appointment);
  startFlow(appointment); // do contexto
  ```
- `ClientPhotosDialog` (histórico, abre pelo ícone câmera) continua local — não tem relação com o pós-atendimento.

### 3. Garantir dados estáveis no fluxo

O contexto guarda uma **cópia** do `appointment` (não uma referência live), então mesmo que o React Query remova o item da lista o `ScheduleReturnDialog` e o `AppointmentForm` continuam recebendo os dados originais para sugerir cliente, serviço, data e duração corretamente.

### 4. Reaproveitar nas demais telas

Qualquer outro lugar que hoje chama "concluir atendimento" (ex.: calendário semanal/mensal, lista em `/agendamentos`) passa a usar `startFlow(appointment)` do mesmo contexto, eliminando duplicação.

## Verificação após implementação

1. Dashboard `/`: concluir um agendamento futuro → modal "Próxima Manutenção" aparece e permanece.
2. Clicar "Agendar Agora" → abre o `AppointmentForm` completo pré-preenchido (data sugerida, cliente, serviço, duração).
3. Clicar "Depois" → modal fecha sem efeitos colaterais; cliente aparece em "Retornos Pendentes" do CRM.
4. Repetir o fluxo em `/agendamentos`.
5. Confirmar que o histórico de fotos (ícone câmera) continua funcionando.

## Arquivos afetados

- **Novo:** `src/contexts/PostAttendanceFlowContext.tsx`
- **Editado:** `src/App.tsx` (adicionar provider)
- **Editado:** `src/components/dashboard/AppointmentPreview.tsx` (remover modais locais, usar `startFlow`)
- **Possível:** componentes equivalentes em `WeeklyCalendar`/`MonthlyCalendar`/`Agendamentos.tsx` se possuírem botão de concluir próprio.
