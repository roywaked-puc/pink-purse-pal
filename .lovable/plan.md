

## Plano: Integracao Unidirecional com Google Calendar API (App -> Google)

### Visao Geral

Implementar uma opcao para o usuario escolher se deseja integrar automaticamente com o Google Calendar via API. Quando ativada, ao criar ou editar um agendamento no app, o evento sera automaticamente criado/atualizado no Google Calendar do usuario.

**Importante:** A sincronizacao e apenas do App para o Google Calendar. Eventos criados diretamente no Google Calendar NAO serao importados para o app.

---

### Arquitetura Simplificada

```text
+------------------+       +-----------------+       +------------------+
|   App Frontend   | ----> |  Edge Function  | ----> | Google Calendar  |
|  (cria/edita)    |       |  (google-cal)   |       |      API         |
+------------------+       +-----------------+       +------------------+
         |
         v
+------------------+
|   Supabase DB    |
| (appointments +  |
|  user_settings)  |
+------------------+
```

---

### Componentes Necessarios

| Componente | Descricao |
|------------|-----------|
| Tabela `user_settings` | Armazena preferencia e tokens OAuth do usuario |
| Coluna `google_event_id` em `appointments` | Rastreia eventos sincronizados |
| Edge Function `google-calendar` | Gerencia OAuth e operacoes no Google Calendar |
| Hook `useGoogleCalendar` | Gerencia estado da integracao |
| Componente `GoogleCalendarSettings` | UI para ativar/desativar e conectar conta |

---

### 1. Criar Tabela `user_settings`

```sql
CREATE TABLE public.user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  google_calendar_enabled BOOLEAN DEFAULT false,
  google_access_token TEXT,
  google_refresh_token TEXT,
  google_token_expiry TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- RLS policies
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own settings"
  ON public.user_settings FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

---

### 2. Adicionar Coluna em `appointments`

```sql
ALTER TABLE public.appointments 
ADD COLUMN google_event_id TEXT;
```

---

### 3. Secrets Necessarios

| Secret | Descricao |
|--------|-----------|
| `GOOGLE_CLIENT_ID` | Client ID do projeto Google Cloud |
| `GOOGLE_CLIENT_SECRET` | Client Secret do projeto Google Cloud |

---

### 4. Edge Function `google-calendar`

**Arquivo:** `supabase/functions/google-calendar/index.ts`

Endpoints simplificados (sem fetch de eventos):

| Rota | Metodo | Descricao |
|------|--------|-----------|
| `/auth-url` | GET | Gera URL de autorizacao OAuth |
| `/callback` | POST | Troca codigo por tokens |
| `/disconnect` | POST | Revoga tokens e desconecta |
| `/sync-event` | POST | Cria/atualiza evento no Google Calendar |
| `/delete-event` | POST | Remove evento do Google Calendar |

**Fluxo de Sincronizacao:**

Quando usuario cria/edita agendamento:
1. App envia dados para edge function `/sync-event`
2. Edge function autentica com tokens do usuario
3. Cria ou atualiza evento no Google Calendar
4. Retorna `google_event_id` para salvar no banco

---

### 5. Hook `useGoogleCalendar`

**Arquivo:** `src/hooks/useGoogleCalendar.ts`

```typescript
export function useGoogleCalendar() {
  // Estado
  const { data: settings } = useQuery(['user-settings']);
  
  // Acoes
  const connect = () => { /* Inicia OAuth */ };
  const disconnect = () => { /* Revoga tokens */ };
  const syncEvent = async (appointment) => { /* Sincroniza evento */ };
  const deleteEvent = async (googleEventId) => { /* Remove evento */ };
  
  return {
    isEnabled: settings?.google_calendar_enabled,
    isConnected: !!settings?.google_refresh_token,
    connect,
    disconnect,
    syncEvent,
    deleteEvent,
  };
}
```

---

### 6. Hook `useUserSettings`

**Arquivo:** `src/hooks/useUserSettings.ts`

Gerencia preferencias do usuario:

```typescript
export function useUserSettings() {
  const { user } = useAuth();
  
  const { data: settings } = useQuery(['user-settings', user?.id], ...);
  
  const updateSettings = useMutation({
    mutationFn: async (updates) => {
      await supabase.from('user_settings').upsert({ user_id: user.id, ...updates });
    }
  });
  
  return { settings, updateSettings };
}
```

---

### 7. Modificar Hooks de Agendamento

**Arquivo:** `src/hooks/useAppointments.ts`

Adicionar sincronizacao ao criar/editar/deletar:

```typescript
export function useAddAppointment() {
  const { syncEvent, isEnabled, isConnected } = useGoogleCalendar();
  
  return useMutation({
    mutationFn: async (appointment) => {
      // 1. Salvar no banco
      const { data } = await supabase.from('appointments').insert(...).select().single();
      
      // 2. Se integracao ativa, sincronizar
      if (isEnabled && isConnected) {
        try {
          const googleEventId = await syncEvent({...appointment, id: data.id});
          if (googleEventId) {
            await supabase.from('appointments')
              .update({ google_event_id: googleEventId })
              .eq('id', data.id);
          }
        } catch (error) {
          console.error('Erro ao sincronizar com Google Calendar:', error);
          // Nao falha a operacao principal
        }
      }
    },
  });
}
```

Mesma logica para `useUpdateAppointment` e `useDeleteAppointment`.

---

### 8. Componente de Configuracoes

**Arquivo:** `src/components/settings/GoogleCalendarSettings.tsx`

```text
+-------------------------------------------------------+
| Google Calendar                                       |
|-------------------------------------------------------|
| Sincronizar agendamentos automaticamente              |
| com seu Google Calendar                               |
|                                                       |
| [Switch] Ativar integracao                            |
|                                                       |
| Status: Conectado como usuario@gmail.com              |
| [ Desconectar ]                                       |
|                                                       |
| Quando ativado, novos agendamentos e edicoes          |
| aparecem automaticamente no seu Google Calendar.      |
+-------------------------------------------------------+
```

---

### 9. Atualizar Pagina de Configuracoes

**Arquivo:** `src/pages/Configuracoes.tsx`

Adicionar novo AccordionItem para integracoes.

---

### 10. Comportamento do Botao Atual

Quando a integracao via API esta **ATIVA**:
- O botao de calendario no card pode mostrar um icone diferente (check) indicando que ja foi sincronizado
- Ou continua abrindo o Google Calendar para visualizacao

Quando a integracao via API esta **DESATIVADA**:
- Comportamento atual permanece (abre URL do Google Calendar)

---

### Arquivos a Criar

| Arquivo | Descricao |
|---------|-----------|
| `supabase/functions/google-calendar/index.ts` | Edge function para OAuth e sincronizacao |
| `src/hooks/useGoogleCalendar.ts` | Hook para gerenciar integracao |
| `src/hooks/useUserSettings.ts` | Hook para preferencias do usuario |
| `src/components/settings/GoogleCalendarSettings.tsx` | UI da integracao |

---

### Arquivos a Modificar

| Arquivo | Alteracao |
|---------|-----------|
| `src/types/index.ts` | Adicionar tipo `UserSettings` |
| `src/hooks/useAppointments.ts` | Adicionar sincronizacao automatica |
| `src/pages/Configuracoes.tsx` | Adicionar secao de integracoes |
| `src/pages/Agendamentos.tsx` | Indicador visual de sincronizacao (opcional) |

---

### Requisitos para o Usuario

Para usar a integracao, o usuario precisara:

1. **Criar projeto no Google Cloud Console**
   - Ativar Google Calendar API
   - Configurar tela de consentimento OAuth
   - Criar credenciais OAuth 2.0 (Web application)
   - Adicionar URL de redirect autorizado

2. **Configurar secrets no Lovable Cloud**
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`

---

### Fluxo do Usuario

1. Acessar Configuracoes > Integracoes
2. Ativar switch "Integrar com Google Calendar"
3. Clicar em "Conectar conta Google"
4. Autorizar acesso no popup do Google
5. A partir de agora:
   - Novos agendamentos aparecem automaticamente no Google Calendar
   - Edicoes de agendamentos atualizam o evento no Google Calendar
   - Exclusoes removem o evento do Google Calendar

---

### Diferencas do Plano Anterior

| Aspecto | Bidirecional (anterior) | Unidirecional (atual) |
|---------|------------------------|----------------------|
| Sincronizacao | App <-> Google | App -> Google apenas |
| Polling/Webhook | Necessario | Nao necessario |
| Complexidade | Alta | Moderada |
| Endpoint `/fetch-events` | Sim | Nao |
| Conflitos de dados | Possivel | Nenhum |

