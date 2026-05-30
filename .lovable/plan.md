## Fluxo de Retorno/Manutenção Inteligente

Objetivo: após concluir um atendimento, oferecer agendamento imediato do retorno, mantendo a estrutura atual de serviços (cada manutenção continua sendo um serviço independente).

### 1. Banco de dados (migração única)

**Enum `confirmation_status_enum`**: adicionar valor `retorno_previsto`.

**Tabela `appointments`**: nova coluna `parent_appointment_id uuid` (nullable) para vincular o retorno ao atendimento que o originou. Índice em `(user_id, parent_appointment_id)`.

**Tabela `user_settings`**: novos campos
- `retention_intervals int[] default '{15,20,21,30}'`
- `retention_reminder_days int default 3`
- `retention_color_previsto text default '#FBBF24'`
- `retention_color_aguardando text default '#F97316'`
- `retention_color_confirmado text default '#10B981'`

### 2. Detecção de serviços de manutenção

Helper `findMaintenanceServices(currentService, allServices)`:
- Extrai a "base" do nome do serviço atual (texto antes de ` - `, ex: "Volume Brasileiro").
- Procura serviços cujo nome começa com a mesma base **e** contém "manutenção" ou "retorno" (case/acentos-insensível).
- Para cada match, tenta extrair número de dias por regex (`/(\d+)\s*dias?/i`); se não houver, cai no primeiro valor de `retention_intervals`.

### 3. Componentes novos

**`ScheduleReturnDialog.tsx`** (`src/components/appointments/`)
- Etapa 1: pergunta "Deseja agendar o próximo retorno?" com botões **Agendar Retorno** / **Agora Não**.
- Etapa 2: lista de manutenções detectadas (radio). Se nenhuma for detectada, mostra todos os serviços do mesmo grupo + permite escolher manualmente.
- Etapa 3: sugere data (`atendimento.date + dias`) via `<Calendar>` editável + input de horário. Validação de conflito reaproveita a regra existente.
- Confirma → cria appointment novo com `confirmationStatus = 'retorno_previsto'`, `parentAppointmentId = atendimentoOrigem.id`, copia `clientId`, `clientName`, `serviceId`, `service`, `amount`, `duration`, observações da cliente.

**`ReturnsToConfirmCard.tsx`** (`src/components/dashboard/`)
- Card no Dashboard. Conta appointments com status `retorno_previsto` cuja data está dentro de `retention_reminder_days`.
- Click abre `ReturnsToConfirmDialog` listando: cliente, data/hora, telefone, botões **WhatsApp** (deeplink `wa.me`), **Confirmar** (status → `confirmado`), **Remarcar** (abre `AppointmentForm` existente).

**`RetentionSettings.tsx`** (`src/components/settings/`)
- Editor de lista de intervalos (chips removíveis + input).
- Input numérico de dias de lembrete.
- 3 color pickers (`<input type="color">`).
- Salva em `user_settings` via `useUserSettings`.

### 4. Integrações

**`useAppointments.ts` – `useUpdateConfirmationStatus`**: após gravar status `atendido`, retornar flag/contexto para a UI abrir o `ScheduleReturnDialog` (substitui ou complementa o `PostAttendancePhotoPrompt` atual: ambos podem ser disparados em sequência – fotos primeiro, depois retorno).

**`AppointmentPreview.tsx` / pontos que chamam `useUpdateConfirmationStatus('atendido')`**: encadear `PostAttendancePhotoPrompt` → `ScheduleReturnDialog`.

**Agenda (`MonthlyCalendar`, `WeeklyCalendar`, lista)**: badge "🔄 Retorno" quando `parentAppointmentId` existe. Cor do card mapeada conforme status:
- `retorno_previsto` (fora da janela de lembrete) → `retention_color_previsto`
- `retorno_previsto` (dentro da janela) → `retention_color_aguardando`
- `confirmado` & `parentAppointmentId` → `retention_color_confirmado`

**`ClienteFicha.tsx`**: nova mini-seção "Retenção" no topo da aba Dados com Último Atendimento (último `atendido`), Próxima Manutenção (próximo appointment futuro), Status do Retorno.

**`Configuracoes.tsx`**: novo `AccordionItem` "Retenção de Clientes" usando `RetentionSettings`.

**`src/types/index.ts`**: adicionar `'retorno_previsto'` ao `ConfirmationStatus`; campo `parentAppointmentId?` em `Appointment`; campos novos em `UserSettings`.

### 5. Fora de escopo (deixar explícito)
- Envio automático de WhatsApp (apenas deeplink manual).
- Notificações push/email.
- Refatorar serviços ou criar tabela de "tipos de manutenção".
- Edição de agendamentos de retorno fora dos fluxos já existentes.

### Fluxo final
Atendido → modal de foto (existente) → modal de retorno → escolhe manutenção → escolhe data/hora → cria appointment `retorno_previsto` → aparece no card "Retornos para Confirmar" do Dashboard a partir de `data - reminder_days`.
