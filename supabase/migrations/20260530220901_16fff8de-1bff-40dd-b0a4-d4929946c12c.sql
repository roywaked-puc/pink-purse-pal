-- Add new confirmation status value
ALTER TYPE confirmation_status_enum ADD VALUE IF NOT EXISTS 'retorno_previsto';

-- Add parent_appointment_id to appointments
ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS parent_appointment_id uuid;

CREATE INDEX IF NOT EXISTS idx_appointments_user_parent
  ON public.appointments(user_id, parent_appointment_id);

-- Retention settings on user_settings
ALTER TABLE public.user_settings
  ADD COLUMN IF NOT EXISTS retention_intervals integer[] NOT NULL DEFAULT '{15,20,21,30}',
  ADD COLUMN IF NOT EXISTS retention_reminder_days integer NOT NULL DEFAULT 3,
  ADD COLUMN IF NOT EXISTS retention_color_previsto text NOT NULL DEFAULT '#FBBF24',
  ADD COLUMN IF NOT EXISTS retention_color_aguardando text NOT NULL DEFAULT '#F97316',
  ADD COLUMN IF NOT EXISTS retention_color_confirmado text NOT NULL DEFAULT '#10B981';