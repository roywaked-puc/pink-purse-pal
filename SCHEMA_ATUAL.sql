-- =====================================================================
-- SCHEMA_ATUAL.sql — Pink Purse Pal
-- Estado consolidado do banco (Lovable Cloud / Postgres), NÃO histórico.
-- Gerado a partir de supabase/migrations/ (24 migrações, até 2026-09-05).
-- Referência rápida para consultas — a fonte de verdade real continua
-- sendo supabase/migrations/ e o painel do Lovable Cloud.
--
-- Última migração: supabase/migrations/20260905213633_55af361d-899d-42b3-
-- 9e7b-e857a5a4747b.sql — reorganização do catálogo de serviços (ver seção
-- "services" abaixo). Reduziu o catálogo de 110 para 52 registros, unificando
-- manutenções redundantes ("1ª/2ª/3ª manutenção" tinham o mesmo preço para a
-- mesma faixa de dias — informação sem uso real) e religando os 118
-- agendamentos afetados ao registro sobrevivente. Zero agendamentos órfãos.
-- =====================================================================

-- Todas as tabelas de domínio têm RLS habilitado e políticas restritas a
-- auth.uid() = user_id (isolamento total por usuário). Exceções pontuais
-- estão comentadas junto da tabela.

-- ---------------------------------------------------------------------
-- clients
-- ---------------------------------------------------------------------
CREATE TABLE public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL DEFAULT '',
  notes TEXT,
  recurrence_days INTEGER,              -- add: 2026-05-25
  birth_date DATE,                      -- add: 2026-06-03
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- RLS: CRUD completo restrito a auth.uid() = user_id

-- ---------------------------------------------------------------------
-- services
-- ---------------------------------------------------------------------
-- Enum (via CHECK, não enum nativo):
--   tier_type: 'avulso' | 'colocacao' | 'manutencao'
CREATE TABLE public.services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  notes TEXT,
  duration INTEGER NOT NULL DEFAULT 60, -- minutos; add: 2025-12-31
  color TEXT,                           -- add: 2026-01-08
  technique_name TEXT,                  -- add: 2026-09-05 (ex: "Volume Russo", "Fox")
  tier_type TEXT CHECK (tier_type IN ('avulso', 'colocacao', 'manutencao')), -- add: 2026-09-05
  dias_min INTEGER,                     -- add: 2026-09-05 (faixa de dias desde o último atendimento; NULL para avulso/colocação)
  dias_max INTEGER,                     -- add: 2026-09-05 (idem)
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- RLS: CRUD completo restrito a auth.uid() = user_id
-- Nota (2026-09-05): technique_name/tier_type/dias_min/dias_max foram adicionados
-- e populados a partir de description via migração, que também unificou manutenções
-- redundantes por technique_name+dias_min+dias_max (mantendo o registro mais antigo
-- e religando appointments.service_id das duplicadas apagadas). description
-- continua existindo e sendo usada pelo front-end como está; as colunas novas
-- servem para agrupar/filtrar por técnica e faixa de dias (catálogo, agendamento,
-- relatórios) sem depender de parsing de texto livre.

-- ---------------------------------------------------------------------
-- categories
-- ---------------------------------------------------------------------
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('entrada', 'saida')),
  scope TEXT NOT NULL CHECK (scope IN ('empresa', 'pessoal')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- RLS: CRUD completo restrito a auth.uid() = user_id
-- Categorias padrão são criadas automaticamente via trigger handle_new_user()
-- no cadastro do usuário (Serviços/Vendas/Outros por escopo, ver função abaixo).

-- ---------------------------------------------------------------------
-- accounts
-- ---------------------------------------------------------------------
CREATE TABLE public.accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('dinheiro', 'banco', 'maquininha')),
  fee_percentage DECIMAL(5,2) DEFAULT 0, -- add: 2026-01-15 (taxa de maquininha)
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- RLS: CRUD completo restrito a auth.uid() = user_id
-- Contas padrão criadas automaticamente no cadastro: Dinheiro, Nubank, Maquininha Stone.

-- ---------------------------------------------------------------------
-- appointments
-- ---------------------------------------------------------------------
-- Enums (criados em 2026-05-26, substituindo os CHECK constraints originais):
--   confirmation_status_enum: 'pendente' | 'confirmado' | 'atendido' | 'cancelado'
--                              | 'retorno_previsto' (adicionado em 2026-05-30)
--   payment_status_enum: 'pago' | 'nao_pago' | 'sinal'
CREATE TABLE public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date TIMESTAMPTZ NOT NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  client_name TEXT NOT NULL,
  service_id UUID REFERENCES public.services(id) ON DELETE SET NULL,
  service TEXT NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  paid_amount NUMERIC NOT NULL DEFAULT 0,
  payment_status public.payment_status_enum NOT NULL DEFAULT 'nao_pago',
  confirmation_status public.confirmation_status_enum NOT NULL DEFAULT 'pendente',
  duration INTEGER NOT NULL DEFAULT 60,     -- minutos; add: 2025-12-31
  notes TEXT,                               -- add: 2026-01-02
  google_event_id TEXT,                     -- add: 2026-01-29 (integração Google Calendar)
  parent_appointment_id UUID,               -- add: 2026-05-30 (encadeia retornos)
  is_permuta BOOLEAN NOT NULL DEFAULT false,-- add: 2026-06-29
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- RLS: CRUD completo restrito a auth.uid() = user_id
-- Índices: (user_id), (date), (user_id, parent_appointment_id)

-- ---------------------------------------------------------------------
-- transactions
-- ---------------------------------------------------------------------
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date TIMESTAMPTZ NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('entrada', 'saida')),
  scope TEXT NOT NULL CHECK (scope IN ('empresa', 'pessoal')),
  category TEXT NOT NULL,                   -- legado (nome); ver category_id
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL, -- add: 2026-05-26
  account TEXT NOT NULL,                    -- legado (nome); ver account_id
  account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,    -- add: 2026-05-26
  amount NUMERIC NOT NULL DEFAULT 0,
  gross_amount DECIMAL(12,2),               -- add: 2026-01-15 (valor bruto antes da taxa)
  description TEXT,
  client_name TEXT,                         -- add: 2026-02-25
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  payment_type TEXT CHECK (payment_type IS NULL OR payment_type IN ('sinal', 'pagamento')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- RLS: CRUD completo restrito a auth.uid() = user_id
-- Índices: (user_id), (date), (account_id), (category_id)
-- Nota: category/account (texto) coexistem com category_id/account_id (FK) desde a
-- migração 2026-05-26, que fez backfill dos IDs a partir dos nomes. Ao evoluir, preferir
-- os campos *_id; os campos de texto seguem por compatibilidade com dados antigos.

-- ---------------------------------------------------------------------
-- user_settings (1:1 com o usuário — Google Calendar, CRM, Retenção)
-- ---------------------------------------------------------------------
CREATE TABLE public.user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  google_calendar_enabled BOOLEAN DEFAULT false,
  google_access_token TEXT,      -- SELECT revogado para authenticated/anon (2026-05-09)
  google_refresh_token TEXT,     -- idem — só acessível via service_role (Edge Function)
  google_client_id TEXT,
  google_client_secret TEXT,
  google_token_expiry TIMESTAMPTZ,
  retention_intervals INTEGER[] NOT NULL DEFAULT '{15,20,21,30}',
  retention_reminder_days INTEGER NOT NULL DEFAULT 3,
  retention_color_previsto TEXT NOT NULL DEFAULT '#FBBF24',
  retention_color_aguardando TEXT NOT NULL DEFAULT '#F97316',
  retention_color_confirmado TEXT NOT NULL DEFAULT '#10B981',
  crm_inactive_days INTEGER NOT NULL DEFAULT 45,
  crm_confirm_days INTEGER NOT NULL DEFAULT 3,
  crm_vip_count INTEGER NOT NULL DEFAULT 10,
  crm_monthly_goal NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()      -- trigger update_updated_at_column()
);
-- RLS: CRUD completo restrito a auth.uid() = user_id
-- IMPORTANTE: google_access_token e google_refresh_token têm SELECT revogado de
-- authenticated/anon — só a Edge Function (service_role) lê esses campos.

-- ---------------------------------------------------------------------
-- client_photos
-- ---------------------------------------------------------------------
CREATE TABLE public.client_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  client_id UUID NOT NULL,
  appointment_id UUID,
  photo_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  storage_path TEXT NOT NULL,   -- layout: {auth.uid()}/{client_id}/{file}
  observation TEXT,
  service_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- RLS: CRUD completo restrito a auth.uid() = user_id
-- Índices: (client_id, photo_date DESC), (user_id)
-- Storage: bucket privado "client-photos"; políticas de storage.objects também
-- restritas por auth.uid() no primeiro segmento do path.

-- ---------------------------------------------------------------------
-- Anamnese (templates versionados + respostas imutáveis após assinatura)
-- ---------------------------------------------------------------------
-- Enums:
--   anamnese_question_type: texto_curto | texto_longo | sim_nao | multipla_escolha
--                            | selecao_unica | data | numero | checkbox
--   anamnese_response_status: pendente | preenchida | assinada | arquivada

CREATE TABLE public.anamnese_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- RLS: ALL restrito a auth.uid() = user_id

CREATE TABLE public.anamnese_template_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES public.anamnese_templates(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  version INTEGER NOT NULL DEFAULT 1,
  is_current BOOLEAN NOT NULL DEFAULT true,
  locked BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (template_id, version)
);
-- RLS: ALL restrito a auth.uid() = user_id

CREATE TABLE public.anamnese_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version_id UUID NOT NULL REFERENCES public.anamnese_template_versions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  section TEXT NOT NULL DEFAULT 'Geral',
  label TEXT NOT NULL,
  type public.anamnese_question_type NOT NULL,
  options JSONB NOT NULL DEFAULT '[]'::jsonb,
  required BOOLEAN NOT NULL DEFAULT false,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- RLS: ALL restrito a auth.uid() = user_id

CREATE TABLE public.anamnese_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  template_id UUID NOT NULL REFERENCES public.anamnese_templates(id) ON DELETE RESTRICT,
  version_id UUID NOT NULL REFERENCES public.anamnese_template_versions(id) ON DELETE RESTRICT,
  status public.anamnese_response_status NOT NULL DEFAULT 'pendente',
  filled_at TIMESTAMPTZ,
  signed_at TIMESTAMPTZ,
  signature_data TEXT,
  pdf_path TEXT,
  share_token UUID NOT NULL DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- RLS: SELECT/INSERT/UPDATE restritos a auth.uid() = user_id;
--       DELETE só permitido se status <> 'assinada'.
-- TRIGGER anamnese_responses_freeze: uma vez status='assinada', bloqueia qualquer
-- alteração exceto pdf_path ou status -> 'arquivada'. Enforced no banco, não só na UI.

CREATE TABLE public.anamnese_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  response_id UUID NOT NULL REFERENCES public.anamnese_responses(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.anamnese_questions(id) ON DELETE RESTRICT,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  value JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- RLS (revisado em 2026-06-10): SELECT/DELETE por auth.uid() = user_id;
--   INSERT/UPDATE exigem também que o response_id e question_id pertençam ao usuário.
-- TRIGGER anamnese_answers_freeze: bloqueia INSERT/UPDATE/DELETE se a response
-- correspondente já está com status='assinada'.
-- Índices: (response_id)

-- =====================================================================
-- Relações principais (visão rápida)
-- =====================================================================
-- appointments.client_id       -> clients.id
-- appointments.service_id      -> services.id
-- appointments.parent_appointment_id -> appointments.id (auto-referência, retornos)
-- transactions.appointment_id  -> appointments.id
-- transactions.account_id      -> accounts.id
-- transactions.category_id     -> categories.id
-- client_photos.client_id      -> clients.id (sem FK declarada, mas é a relação de facto)
-- client_photos.appointment_id -> appointments.id (idem)
-- anamnese_responses.client_id -> clients.id
-- anamnese_responses.template_id/version_id -> anamnese_templates / _template_versions
-- anamnese_questions.version_id -> anamnese_template_versions.id
-- anamnese_answers.response_id -> anamnese_responses.id
-- anamnese_answers.question_id -> anamnese_questions.id
