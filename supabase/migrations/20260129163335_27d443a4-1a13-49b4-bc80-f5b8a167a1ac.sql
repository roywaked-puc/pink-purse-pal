-- Adicionar colunas de credenciais Google por usuário
ALTER TABLE public.user_settings 
ADD COLUMN IF NOT EXISTS google_client_id TEXT,
ADD COLUMN IF NOT EXISTS google_client_secret TEXT;