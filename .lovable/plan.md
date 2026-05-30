# Histórico Fotográfico das Clientes

Módulo completo de prontuário visual, integrado ao cadastro de clientes, à agenda e ao fluxo pós-atendimento.

## O que será entregue

### 1. Infraestrutura (backend)
- Tabela `client_photos` (id, user_id, client_id, appointment_id?, photo_date, photo_url, storage_path, observation, service_name?, created_at)
- RLS por `user_id` + GRANTs
- Bucket privado **`client-photos`** no Supabase Storage com policies por usuário (path `userId/clientId/arquivo.jpg`)
- Índices em `(client_id, photo_date desc)`

### 2. Hook `useClientPhotos`
- `listByClient(clientId)` — fotos ordenadas mais recentes primeiro
- `upload(file, { clientId, appointmentId?, observation, photoDate })` — envia ao Storage, gera signed URL, insere registro
- `updateObservation(id, obs)`
- `delete(id)` — remove do Storage + DB
- `stats(clientId)` — total, primeira, última, tempo de acompanhamento

### 3. Ficha do Cliente (`/cliente/:id`) — nova aba
Tabs **Dados** | **Histórico de Fotos**

Aba Fotos:
- Cabeçalho com indicadores: total · primeira · última · "Cliente há X meses"
- Botões: **➕ Adicionar Foto** · **📽 Evolução** (slideshow) · **Comparar** (ativa seleção de 2 fotos)
- Grade responsiva: 2 col mobile, 3 col tablet, 4 col desktop, com lazy loading
- Cada card: thumbnail, data, observação curta
- Click → modal fullscreen com: zoom (pinch/scroll), navegação ◀ ▶, editar observação, excluir
- Modo comparação: seleção de 2 fotos → view lado a lado (Antes | Depois) com datas
- Slideshow: avança automaticamente em ordem cronológica crescente

### 4. Modal "Adicionar Foto"
- Input file com `capture="environment"` (abre câmera no mobile, galeria no desktop)
- Múltiplos arquivos permitidos
- Preview + compressão client-side (máx 1600px, jpeg 0.85) antes do upload
- Campos: observação (com sugestões rápidas: Primeira aplicação, Manutenção 15 dias, Volume brasileiro, Volume egípcio, Correção de falhas), data (default hoje), serviço (auto se vier de agendamento)

### 5. Integração com a Agenda
- Em cada card/popover de agendamento, novo botão **📷 Histórico** ao lado de Editar/WhatsApp/Pagamento
- Click abre o modal de histórico fotográfico (mesmo componente da aba), focado no cliente

### 6. Pós-atendimento
- Quando o usuário marca um agendamento como **Atendido**, dispara dialog:
  > "Deseja adicionar fotos deste atendimento?"
  > [Adicionar Fotos] [Agora Não]
- "Adicionar Fotos" abre o modal já pré-preenchido com `appointmentId` + `clientId` + serviço

### 7. Performance & UX
- Thumbnails carregadas via `transform` do Supabase Storage (`width=400`)
- `loading="lazy"` em todas as imagens
- Signed URLs com cache de 1h em memória
- Mobile first, fluxo "adicionar foto" em < 3 toques

## Detalhes técnicos

```text
client_photos
├── id uuid pk
├── user_id uuid (RLS)
├── client_id uuid → clients
├── appointment_id uuid? → appointments
├── photo_date timestamptz
├── storage_path text   (userId/clientId/uuid.jpg)
├── observation text?
├── service_name text?
└── created_at timestamptz
```

Storage bucket: `client-photos` (privado), policies: usuário só lê/escreve sob `auth.uid()/...`.

Componentes novos:
- `src/hooks/useClientPhotos.ts`
- `src/components/clients/ClientPhotosTab.tsx`
- `src/components/clients/PhotoUploadDialog.tsx`
- `src/components/clients/PhotoLightbox.tsx` (fullscreen + zoom + nav + edit/delete)
- `src/components/clients/PhotoCompareDialog.tsx`
- `src/components/clients/PhotoSlideshowDialog.tsx`
- `src/components/clients/ClientPhotosButton.tsx` (reusável para agenda)
- `src/components/appointments/PostAttendancePhotoPrompt.tsx`

Atualizações:
- `src/pages/ClienteFicha.tsx` → Tabs (Dados | Fotos)
- `src/components/appointments/*` cards/popover → botão 📷
- `src/hooks/useAppointments.ts` (ou componentes de status) → disparar prompt ao virar **Atendido**
- `src/types/index.ts` → tipo `ClientPhoto`

Migrações:
1. Criar tabela `client_photos` + GRANTs + RLS + policies + índice
2. Criar bucket `client-photos` + storage policies

## Fora do escopo desta entrega
- Compartilhamento externo / exportação para redes sociais
- Marca d'água automática
- Edição de imagem (filtros/crop avançado) — apenas redimensionamento para upload
