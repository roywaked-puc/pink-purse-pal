

## Plano Atualizado: Credenciais Google por Usuário

### Mudança de Arquitetura

Em vez de usar secrets globais do sistema, cada usuário armazenará suas próprias credenciais do Google Cloud Console (Client ID e Client Secret) na sua configuração pessoal.

---

### 1. Migração do Banco de Dados

Adicionar novas colunas à tabela `user_settings`:

```sql
ALTER TABLE public.user_settings 
ADD COLUMN google_client_id TEXT,
ADD COLUMN google_client_secret TEXT;
```

---

### 2. Fluxo Atualizado do Usuário

1. Acessar Configurações > Integrações > Google Calendar
2. Inserir **Client ID** e **Client Secret** do Google Cloud Console
3. Clicar em "Conectar conta Google"
4. Autorizar acesso no popup do Google
5. Integração ativada

---

### 3. UI do Componente GoogleCalendarSettings

```text
+-------------------------------------------------------+
| Google Calendar                                       |
|-------------------------------------------------------|
| Sincronizar agendamentos automaticamente              |
| com seu Google Calendar                               |
|                                                       |
| Credenciais do Google Cloud Console:                  |
| Client ID: [____________________________]             |
| Client Secret: [________________________]             |
|                                                       |
| [  Salvar Credenciais  ]                              |
|                                                       |
| Status: Desconectado                                  |
| [  Conectar conta Google  ] (habilitado após salvar)  |
|                                                       |
| Instruções:                                           |
| 1. Acesse console.cloud.google.com                    |
| 2. Crie um projeto e ative Google Calendar API        |
| 3. Configure a tela de consentimento OAuth            |
| 4. Crie credenciais OAuth 2.0 (Web application)       |
| 5. Copie Client ID e Client Secret aqui               |
+-------------------------------------------------------+
```

---

### 4. Arquivos a Criar

| Arquivo | Descrição |
|---------|-----------|
| `supabase/functions/google-calendar/index.ts` | Edge function para OAuth e sincronização |
| `src/hooks/useGoogleCalendar.ts` | Hook para gerenciar integração |
| `src/hooks/useUserSettings.ts` | Hook para preferências do usuário |
| `src/components/settings/GoogleCalendarSettings.tsx` | UI da integração com campos de credenciais |

---

### 5. Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/types/index.ts` | Adicionar tipo `UserSettings` com client_id e client_secret |
| `src/hooks/useAppointments.ts` | Adicionar sincronização automática |
| `src/pages/Configuracoes.tsx` | Adicionar seção de integrações |

---

### 6. Edge Function `google-calendar`

A edge function receberá as credenciais do usuário do banco de dados:

```typescript
// Buscar credenciais do usuário
const { data: settings } = await supabase
  .from('user_settings')
  .select('google_client_id, google_client_secret, google_access_token, google_refresh_token')
  .eq('user_id', userId)
  .single();

// Usar credenciais do usuário para OAuth
const clientId = settings.google_client_id;
const clientSecret = settings.google_client_secret;
```

---

### 7. Segurança

- Credenciais armazenadas com RLS (apenas o próprio usuário acessa)
- Tokens OAuth nunca expostos no frontend
- Edge function valida autenticação antes de acessar credenciais

---

### Próximos Passos

1. Executar migração para adicionar colunas `google_client_id` e `google_client_secret`
2. Criar a Edge Function `google-calendar`
3. Criar hooks `useUserSettings` e `useGoogleCalendar`
4. Criar componente `GoogleCalendarSettings`
5. Modificar `useAppointments` para sincronização automática
6. Atualizar página de Configurações

