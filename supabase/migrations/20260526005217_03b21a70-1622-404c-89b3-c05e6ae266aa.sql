
DO $$ BEGIN
  CREATE TYPE public.confirmation_status_enum AS ENUM ('pendente', 'confirmado', 'atendido', 'cancelado');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE public.payment_status_enum AS ENUM ('pago', 'nao_pago', 'sinal');
EXCEPTION WHEN duplicate_object THEN null; END $$;

ALTER TABLE public.appointments DROP CONSTRAINT IF EXISTS appointments_payment_status_check;
ALTER TABLE public.appointments DROP CONSTRAINT IF EXISTS appointments_confirmation_status_check;

ALTER TABLE public.appointments
  ALTER COLUMN confirmation_status DROP DEFAULT;
ALTER TABLE public.appointments
  ALTER COLUMN confirmation_status TYPE public.confirmation_status_enum
    USING confirmation_status::public.confirmation_status_enum;
ALTER TABLE public.appointments
  ALTER COLUMN confirmation_status SET DEFAULT 'pendente'::public.confirmation_status_enum;

ALTER TABLE public.appointments
  ALTER COLUMN payment_status DROP DEFAULT;
ALTER TABLE public.appointments
  ALTER COLUMN payment_status TYPE public.payment_status_enum
    USING payment_status::public.payment_status_enum;
ALTER TABLE public.appointments
  ALTER COLUMN payment_status SET DEFAULT 'nao_pago'::public.payment_status_enum;
