-- Add confirmation_status column to appointments table
ALTER TABLE public.appointments 
ADD COLUMN confirmation_status text NOT NULL DEFAULT 'pendente';