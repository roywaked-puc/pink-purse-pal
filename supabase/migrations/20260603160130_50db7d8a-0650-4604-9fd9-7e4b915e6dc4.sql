ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS birth_date date NULL;

ALTER TABLE public.user_settings 
  ADD COLUMN IF NOT EXISTS crm_inactive_days integer NOT NULL DEFAULT 45,
  ADD COLUMN IF NOT EXISTS crm_confirm_days integer NOT NULL DEFAULT 3,
  ADD COLUMN IF NOT EXISTS crm_vip_count integer NOT NULL DEFAULT 10;