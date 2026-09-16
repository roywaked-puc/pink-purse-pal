ALTER TABLE public.appointments
  ADD COLUMN maintenance_number SMALLINT
  CHECK (maintenance_number IS NULL OR maintenance_number BETWEEN 1 AND 5);