

## Plano: Botão Google Calendar - Abrir App quando Sincronizado via API

### Comportamento Proposto

```text
┌─────────────────────────────────────────────────────────┐
│  Agendamento SEM sincronização (google_event_id = null) │
│  [📅+] Azul → Abre formulário para CRIAR novo evento    │
├─────────────────────────────────────────────────────────┤
│  Agendamento COM sincronização (google_event_id existe) │
│  [📅] Verde → Abre o Google Calendar diretamente        │
│        (o evento já está lá, só precisa visualizar)     │
└─────────────────────────────────────────────────────────┘
```

---

### Alterações Necessárias

#### 1. Adicionar campo `googleEventId` ao tipo Appointment

**Arquivo:** `src/types/index.ts`

Adicionar o campo opcional ao tipo:

```typescript
export interface Appointment {
  // ... campos existentes
  notes?: string;
  googleEventId?: string;  // NOVO
}
```

---

#### 2. Mapear `google_event_id` do banco de dados

**Arquivo:** `src/hooks/useAppointments.ts`

Na função `useAppointments`, adicionar o mapeamento:

```typescript
return data.map(a => ({
  // ... outros campos
  notes: a.notes || undefined,
  googleEventId: a.google_event_id || undefined,  // NOVO
}));
```

---

#### 3. Atualizar o botão no componente

**Arquivo:** `src/components/dashboard/AppointmentPreview.tsx`

Modificar a lógica do botão:

```typescript
import { Calendar, CalendarPlus } from 'lucide-react';  // Adicionar Calendar

// Verificar se já está sincronizado
const hasGoogleEvent = !!appointment.googleEventId;

// URL depende do estado de sincronização
const googleCalendarUrl = hasGoogleEvent 
  ? 'https://calendar.google.com'  // Abre o Google Calendar direto
  : formatGoogleCalendarUrl(appointment, appointment.duration);  // Cria novo evento

// Botão com ícone e cor diferentes
<Button
  variant="ghost"
  size="icon"
  asChild
  className={cn(
    "h-8 w-8",
    hasGoogleEvent 
      ? "text-green-600 hover:text-green-700"  // Sincronizado
      : "text-blue-600 hover:text-blue-700"     // Não sincronizado
  )}
>
  <a href={googleCalendarUrl} target="_blank" rel="noopener noreferrer">
    {hasGoogleEvent 
      ? <Calendar className="w-4 h-4" />      // Ícone de calendário
      : <CalendarPlus className="w-4 h-4" />  // Ícone de adicionar
    }
  </a>
</Button>
```

---

### Resumo Visual

| Situação | Ícone | Cor | Ação |
|----------|-------|-----|------|
| Sem sincronização API | 📅+ (CalendarPlus) | Azul | Abre formulário para criar evento |
| Com sincronização API | 📅 (Calendar) | Verde | Abre o Google Calendar |

---

### Arquivos Modificados

| Arquivo | Alteração |
|---------|-----------|
| `src/types/index.ts` | Adicionar `googleEventId?: string` |
| `src/hooks/useAppointments.ts` | Mapear `google_event_id` do banco |
| `src/components/dashboard/AppointmentPreview.tsx` | Lógica condicional do botão |

