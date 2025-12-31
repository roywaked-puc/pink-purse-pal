-- Add duration column to appointments table (in minutes, default 60)
ALTER TABLE public.appointments 
ADD COLUMN duration integer NOT NULL DEFAULT 60;