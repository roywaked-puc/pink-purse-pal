ALTER TABLE public.appointments
ADD COLUMN IF NOT EXISTS is_permuta boolean NOT NULL DEFAULT false;