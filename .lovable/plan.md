## Causa

O fluxo de "Agendar Retorno" (e o prompt de foto pós-atendimento) só está conectado ao componente `AppointmentPreview` usado no **Dashboard**. Quando você marca como **Atendido** dentro da página `/agendamentos` — seja pelo menu de 3 pontinhos (linha 187) ou pelo botão verde de check (linha 307) ou pelo botão "Receber" que muda status para atendido (linha 293) — o código chama direto `updateConfirmationStatus` e **não dispara** o `ScheduleReturnDialog`. Por isso a tela do próximo agendamento não aparece.

Você não fez nada de errado — é uma integração faltando na página de Agendamentos.

## Correção proposta

Integrar o mesmo fluxo já existente (`PostAttendancePhotoPrompt` → `PhotoUploadDialog` → `ScheduleReturnDialog`) na página `src/pages/Agendamentos.tsx`.

### Mudanças em `src/pages/Agendamentos.tsx`

1. Adicionar estado:
   - `returnSource: Appointment | null`
   - `photoPromptSource: Appointment | null`
   - `photoUploadSource: Appointment | null`

2. Criar handler único `handleMarkAttended(appointment)` que:
   - Chama `updateConfirmationStatus({ id, status: 'atendido' })`
   - Se houver saldo em aberto, abre o `TransactionForm` (fluxo "Receber" atual)
   - Se tiver `clientId`, abre `PostAttendancePhotoPrompt`; caso contrário, abre direto `ScheduleReturnDialog`

3. Substituir as 3 chamadas diretas a `updateConfirmationStatus({status:'atendido'})` (DropdownMenu linha 187, botão verde linha 307, e o trecho do "Receber" linhas 292-294) por esse handler.

4. Renderizar no final do componente (uma vez só, controlado pelos estados):
   - `<PostAttendancePhotoPrompt>` → ao confirmar abre `PhotoUploadDialog`; ao fechar abre `ScheduleReturnDialog`
   - `<PhotoUploadDialog>` → ao fechar abre `ScheduleReturnDialog`
   - `<ScheduleReturnDialog>` com `sourceAppointment={returnSource}`

### Pequena correção em `AppointmentPreview.tsx`

Na linha 312-316, há um bug menor de timing: o callback usa `photoUploadOpen` que ainda é `false` no momento do fechamento, então o `ScheduleReturnDialog` pode abrir mesmo quando o usuário escolheu "Sim, adicionar foto". Trocar a lógica para usar uma flag de intenção (ex.: `didOpenUpload.current`) — corrigir junto para manter consistência entre Dashboard e Agendamentos.

## Fora de escopo

- Não mexer no Calendário Mensal/Semanal nesta rodada (status só é alterado lá via edição do form, que abre outro fluxo). Se quiser, integro depois.
- Não alterar a lógica de detecção de manutenção, banco ou tipos.

## Arquivos afetados

- `src/pages/Agendamentos.tsx` (edição)
- `src/components/dashboard/AppointmentPreview.tsx` (pequeno fix de timing)