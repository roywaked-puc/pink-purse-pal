

## Corrigir Duplicação de Eventos no Google Calendar

### Problema Identificado

Ao analisar o código, encontrei **duas causas principais** de duplicação:

1. **Race condition na criação**: Em `useAddAppointment` (linha 154-172), o fluxo é:
   - Insere agendamento no banco (sem `google_event_id`)
   - Chama `syncToGoogleCalendar` (sem `googleEventId` → cria evento novo via POST)
   - Recebe o `eventId` e atualiza o banco com `google_event_id`
   - `onSuccess` dispara `invalidateQueries` → re-fetch dos agendamentos

   Se o usuário salva e rapidamente interage (ex: muda status, edita), a segunda operação pode pegar o agendamento **antes** do `google_event_id` ser salvo, criando um segundo POST.

2. **Race condition na atualização**: Em `useUpdateAppointment` (linha 192-252), busca o `google_event_id` existente, mas se duas atualizações rápidas ocorrerem em sequência, a segunda pode iniciar antes que a primeira tenha completado o sync e salvo o `eventId`.

3. **`invalidateQueries` durante sync**: O `onSuccess` invalida queries imediatamente, mas o `google_event_id` pode ainda não ter sido salvo no banco, fazendo com que um re-render com dados stale dispare outro sync sem o ID.

### Solução

Aplicar **idempotência** no edge function usando o `appointment.id` como identificador único, evitando criar eventos duplicados mesmo que o POST seja chamado múltiplas vezes.

### Alterações

**1. Edge Function `supabase/functions/google-calendar/index.ts`**

No action `sync-appointment`, antes de criar um novo evento (POST):
- Buscar no Google Calendar se já existe um evento com o `appointment.id` no `extendedProperties.private.appointmentId`
- Se encontrar, fazer UPDATE (PUT) em vez de criar novo
- Ao criar eventos, sempre incluir `extendedProperties.private.appointmentId` com o ID do agendamento

Isso garante que mesmo que o POST seja chamado duas vezes sem `googleEventId`, o segundo chamado encontra o evento existente e atualiza em vez de duplicar.

**2. `src/hooks/useAppointments.ts`**

Na função `useAddAppointment`:
- Mover a atualização do `google_event_id` no banco para **antes** do retorno, e aguardar a conclusão
- Retornar o dado atualizado (com `google_event_id`) para evitar stale data

Na função `useUpdateAppointment`:
- Re-buscar o `google_event_id` logo antes do sync (em vez de usar o valor lido no início da mutation) para pegar o ID mais atualizado

### Detalhes da Busca por Idempotência (Edge Function)

```text
Fluxo atual (pode duplicar):
  POST /events → novo evento (sem verificação)

Fluxo corrigido:
  1. GET /events?privateExtendedProperty=appointmentId=<uuid>
  2. Se encontrou → PUT /events/<id> (atualiza)
  3. Se não encontrou → POST /events (cria com extendedProperties)
```

Isso é a solução mais robusta pois funciona independente de timing ou race conditions no cliente.

