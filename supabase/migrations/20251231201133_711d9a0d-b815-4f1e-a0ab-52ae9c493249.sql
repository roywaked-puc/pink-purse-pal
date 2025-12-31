-- Add duration column to services table (in minutes, default 60)
ALTER TABLE public.services 
ADD COLUMN duration integer NOT NULL DEFAULT 60;