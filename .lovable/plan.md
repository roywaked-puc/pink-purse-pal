

## Plano: Sincronizacao Automatica com Google Calendar

### Objetivo

Adicionar sincronizacao automatica com o Google Calendar **apenas quando a conta estiver conectada**. Se nao estiver conectada, o comportamento permanece exatamente como esta hoje.

---

### Logica Condicional

```text
Ao criar/editar/excluir agendamento:
    │
    ▼
┌─────────────────────────────┐
│ Google Calendar conectado?  │
│ (isConnected = true)        │
└─────────┬───────────────────┘
          │
     ┌────┴────┐
     │         │
   Sim        Nao
     │         │
     ▼         ▼
┌─────────┐  ┌──────────────────┐
│ Chamar  │  │ Nao fazer nada   │
│ Edge    │  │ (comportamento   │
│ Function│  │ atual mantido)   │
└─────────┘  └──────────────────┘
```

---

### Arquivo a Modificar

| Arquivo | Alteracao |
|---------|-----------|
| `src/hooks/useAppointments.ts` | Adicionar sincronizacao condicional nos hooks de CRUD |

---

### Alteracoes Detalhadas

#### 1. Novos Imports

```typescript
import { useGoogleCalendar, useSyncAppointment, useDeleteGoogleEvent } from '@/hooks/useGoogleCalendar';
```

#### 2. useAddAppointment

- Modificar `insert` para usar `.select()` e retornar os dados do novo agendamento
- No `onSuccess`, verificar `isConnected` antes de chamar `syncAppointment`

#### 3. useUpdateAppointment

- Buscar `google_event_id` antes de atualizar
- No `onSuccess`, verificar `isConnected` antes de chamar `syncAppointment`

#### 4. useDeleteAppointment

- Antes de deletar, buscar `google_event_id`
- Se tiver `google_event_id` E `isConnected`, chamar `deleteGoogleEvent`
- Depois deletar o agendamento localmente

---

### Comportamento Final

| Cenario | Acao |
|---------|------|
| Google **nao conectado** + criar agendamento | Salva apenas localmente (comportamento atual) |
| Google **conectado** + criar agendamento | Salva localmente + cria evento no Google |
| Google **nao conectado** + editar agendamento | Atualiza apenas localmente |
| Google **conectado** + editar agendamento | Atualiza localmente + atualiza evento no Google |
| Google **nao conectado** + excluir agendamento | Exclui apenas localmente |
| Google **conectado** + excluir agendamento | Exclui do Google + exclui localmente |

---

### Tratamento de Erros

- Sincronizacao com Google sera **silenciosa** (nao bloqueia o fluxo principal)
- Se a sincronizacao falhar, o agendamento ainda sera salvo/editado/excluido localmente
- Toast de erro opcional se a sincronizacao falhar
- Erros serao logados no console para debugging

---

### Secao Tecnica

#### Codigo: useAddAppointment (Atualizado)

```typescript
export function useAddAppointment() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { isConnected } = useGoogleCalendar();
  const syncAppointment = useSyncAppointment();

  return useMutation({
    mutationFn: async (appointment: Omit<Appointment, 'id'>) => {
      if (!user) throw new Error('Not authenticated');
      
      const { data, error } = await supabase
        .from('appointments')
        .insert({
          user_id: user.id,
          date: appointment.date.toISOString(),
          // ... outros campos ...
        } as any)
        .select()
        .single();
      
      if (error) throw sanitizeDbError(error);
      return data;
    },
    onSuccess: (newAppointment) => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      
      // Sincronizar apenas se Google Calendar estiver conectado
      if (isConnected && newAppointment) {
        syncAppointment.mutate({
          id: newAppointment.id,
          date: new Date(newAppointment.date),
          clientName: newAppointment.client_name,
          service: newAppointment.service,
          amount: Number(newAppointment.amount),
          paidAmount: Number(newAppointment.paid_amount),
          paymentStatus: newAppointment.payment_status,
          confirmationStatus: newAppointment.confirmation_status,
          duration: newAppointment.duration,
          notes: newAppointment.notes,
        });
      }
    },
  });
}
```

#### Codigo: useDeleteAppointment (Atualizado)

```typescript
export function useDeleteAppointment() {
  const queryClient = useQueryClient();
  const { isConnected } = useGoogleCalendar();
  const deleteGoogleEvent = useDeleteGoogleEvent();

  return useMutation({
    mutationFn: async (id: string) => {
      // Buscar google_event_id antes de deletar
      const { data: appointment } = await supabase
        .from('appointments')
        .select('google_event_id')
        .eq('id', id)
        .single();
      
      // Se conectado e tem evento no Google, deletar primeiro
      if (isConnected && appointment?.google_event_id) {
        try {
          await deleteGoogleEvent.mutateAsync(appointment.google_event_id);
        } catch (e) {
          console.error('Failed to delete Google event:', e);
        }
      }
      
      // Deletar localmente
      const { error } = await supabase
        .from('appointments')
        .delete()
        .eq('id', id);
      
      if (error) throw sanitizeDbError(error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    },
  });
}
```

