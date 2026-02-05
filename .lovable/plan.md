

## Plano: Adicionar Ícones de Status no Título do Google Calendar

### Objetivo

Quando o status de confirmação de um agendamento mudar para **Confirmado** ou **Atendido**, atualizar o evento no Google Calendar adicionando um ícone/emoji no início do título para indicar visualmente o status.

```text
Status Visual no Google Calendar:
┌─────────────────────────────────────────────────────────┐
│  Pendente    → "Maria - Manicure"                       │
│  Confirmado  → "✓ Maria - Manicure"     (verde)         │
│  Atendido    → "✓✓ Maria - Manicure"    (azul)          │
│  Cancelado   → "✗ Maria - Manicure"     (vermelho)      │
└─────────────────────────────────────────────────────────┘
```

---

### Arquitetura da Solução

```text
┌─────────────────────────────────────────────────────────────────┐
│  useUpdateConfirmationStatus (hook)                             │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ 1. Atualiza status no banco local                         │  │
│  │ 2. Busca dados completos do agendamento                   │  │
│  │ 3. Verifica se Google Calendar está conectado             │  │
│  │ 4. Se SIM → Chama syncToGoogleCalendar com status         │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  Edge Function (google-calendar)                                │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ Recebe: confirmationStatus                                 │  │
│  │ Monta título: getStatusPrefix(status) + clientName + ...  │  │
│  │ Atualiza evento no Google Calendar via API                │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

### Alterações Necessárias

#### 1. Edge Function - Adicionar lógica de prefixo de status

**Arquivo:** `supabase/functions/google-calendar/index.ts`

Adicionar função para gerar prefixo baseado no status:

```typescript
// Função para gerar prefixo visual baseado no status
function getStatusPrefix(status?: string): string {
  switch (status) {
    case 'confirmado':
      return '✓ ';    // Check verde
    case 'atendido':
      return '✓✓ ';   // Double check azul
    case 'cancelado':
      return '✗ ';    // X vermelho
    default:
      return '';      // Pendente - sem prefixo
  }
}
```

Modificar a criação do evento para incluir o prefixo:

```typescript
// Na action 'sync-appointment'
const statusPrefix = getStatusPrefix(appointment.confirmationStatus);

const event: CalendarEvent = {
  summary: `${statusPrefix}${appointment.clientName} - ${appointment.service}`,
  // ... resto igual
};
```

---

#### 2. Helper function - Adicionar confirmationStatus ao sync

**Arquivo:** `src/hooks/useAppointments.ts`

Atualizar a interface do `syncToGoogleCalendar`:

```typescript
async function syncToGoogleCalendar(appointment: {
  id: string;
  date: string;
  clientName: string;
  service: string;
  amount: number;
  duration: number;
  notes?: string;
  googleEventId?: string;
  serviceColor?: string;
  confirmationStatus?: string;  // NOVO
}): Promise<string | null> {
  // ... enviar confirmationStatus no body
}
```

---

#### 3. Hook useUpdateConfirmationStatus - Sincronizar com Google

**Arquivo:** `src/hooks/useAppointments.ts`

Atualizar o hook para buscar dados completos e sincronizar:

```typescript
export function useUpdateConfirmationStatus() {
  const queryClient = useQueryClient();
  const { user } = useAuth();  // ADICIONAR

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: ConfirmationStatus }) => {
      if (!user) throw new Error('Not authenticated');
      
      // 1. Atualizar status no banco
      const { error } = await supabase
        .from('appointments')
        .update({ confirmation_status: status })
        .eq('id', id);
      
      if (error) throw sanitizeDbError(error);
      
      // 2. Buscar dados completos do agendamento para sincronização
      const { data: appointment } = await supabase
        .from('appointments')
        .select('*')
        .eq('id', id)
        .single();
      
      if (!appointment) return;
      
      // 3. Verificar se Google Calendar está conectado
      const isConnected = await checkGoogleCalendarConnected(user.id);
      
      // 4. Se conectado e tem evento, sincronizar
      if (isConnected && appointment.google_event_id) {
        let serviceColor: string | undefined;
        if (appointment.service_id) {
          const { data: serviceData } = await supabase
            .from('services')
            .select('color')
            .eq('id', appointment.service_id)
            .single();
          serviceColor = serviceData?.color || undefined;
        }

        await syncToGoogleCalendar({
          id: appointment.id,
          date: appointment.date,
          clientName: appointment.client_name,
          service: appointment.service,
          amount: Number(appointment.amount),
          duration: appointment.duration,
          notes: appointment.notes || undefined,
          googleEventId: appointment.google_event_id,
          serviceColor,
          confirmationStatus: status,  // NOVO
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    },
  });
}
```

---

#### 4. Atualizar useAddAppointment e useUpdateAppointment

**Arquivo:** `src/hooks/useAppointments.ts`

Passar `confirmationStatus` também nas outras sincronizações:

```typescript
// Em useAddAppointment
const eventId = await syncToGoogleCalendar({
  // ... outros campos
  confirmationStatus: data.confirmation_status,  // ADICIONAR
});

// Em useUpdateAppointment
const eventId = await syncToGoogleCalendar({
  // ... outros campos
  confirmationStatus: data.confirmation_status,  // ADICIONAR
});
```

---

### Resumo das Alterações

| Arquivo | Alteração |
|---------|-----------|
| `supabase/functions/google-calendar/index.ts` | Adicionar função `getStatusPrefix()` e usar no título |
| `src/hooks/useAppointments.ts` | Adicionar `confirmationStatus` à interface e sincronizar no `useUpdateConfirmationStatus` |

---

### Resultado Visual no Google Calendar

| Status | Título no Google Calendar |
|--------|---------------------------|
| Pendente | `Maria - Manicure` |
| Confirmado | `✓ Maria - Manicure` |
| Atendido | `✓✓ Maria - Manicure` |
| Cancelado | `✗ Maria - Manicure` |

Isso permite visualizar rapidamente o status dos agendamentos diretamente no Google Calendar, sem precisar abrir o app.

