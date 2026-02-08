

## Plano: Corrigir Atualização de Eventos no Google Calendar

### Problema Identificado

Ao editar a data/hora de um agendamento, o sistema pode criar um evento novo no Google Calendar em vez de atualizar o existente. Isso resulta em eventos duplicados.

### Causa Raiz

Analisando o codigo, identifiquei dois problemas no `useUpdateAppointment` (`src/hooks/useAppointments.ts`):

1. **O `google_event_id` retornado pelo Google nao e salvo apos um PUT bem-sucedido**: Na linha 247, a condicao `if (eventId && !existing?.google_event_id)` so salva o ID quando nao existia previamente. Porem, se por qualquer motivo o evento original for removido do Google e a API retornar 404, o PUT falha silenciosamente, e nenhuma acao corretiva e tomada.

2. **Falta de tratamento de falha no PUT com fallback para POST**: Se o evento no Google Calendar foi deletado manualmente pelo usuario, o PUT retorna erro 404. Atualmente, o sistema simplesmente falha silenciosamente, sem criar um novo evento nem limpar o `google_event_id` invalido.

3. **O `eventId` retornado apos o update nao e atualizado no banco**: Mesmo em cenarios normais, o Google pode retornar um ID diferente (raro, mas possivel). O codigo atual ignora isso.

### Alteracoes Necessarias

#### 1. Edge Function - Adicionar fallback de criacao quando PUT falha com 404

**Arquivo:** `supabase/functions/google-calendar/index.ts`

Quando o PUT retorna 404 (evento nao existe mais no Google), o sistema deve automaticamente criar um novo evento (POST) em vez de simplesmente retornar erro:

```text
Fluxo atual:
  PUT /events/{id} → 404 → retorna erro → nada acontece

Fluxo proposto:
  PUT /events/{id} → 404 → POST /events → retorna novo eventId
```

Modificacoes:
- Apos o PUT, verificar se o status e 404
- Se for 404, fazer um POST automaticamente para criar novo evento
- Retornar o novo `eventId` para o frontend salvar
- Adicionar logs para depuracao

#### 2. Hook useUpdateAppointment - Sempre salvar o eventId retornado

**Arquivo:** `src/hooks/useAppointments.ts`

Alterar a logica para sempre atualizar o `google_event_id` no banco quando o retorno for diferente do existente:

```text
Logica atual:
  if (eventId && !existing?.google_event_id) → salva

Logica proposta:
  if (eventId && eventId !== existing?.google_event_id) → salva
```

Isso garante que:
- Novos eventos sao salvos (quando `existing.google_event_id` e null)
- Eventos recriados apos fallback 404 tambem sao salvos (quando o ID muda)

### Resumo das Alteracoes

| Arquivo | Alteracao |
|---------|-----------|
| `supabase/functions/google-calendar/index.ts` | Adicionar fallback POST quando PUT retorna 404 |
| `src/hooks/useAppointments.ts` | Alterar condicao para salvar `eventId` sempre que mudar |

### Resultado Esperado

- Editar data/hora de um agendamento atualiza o evento existente no Google Calendar (PUT)
- Se o evento original foi deletado do Google, um novo e criado automaticamente (fallback POST)
- O `google_event_id` no banco sempre reflete o evento correto no Google Calendar
- Sem mais eventos duplicados
