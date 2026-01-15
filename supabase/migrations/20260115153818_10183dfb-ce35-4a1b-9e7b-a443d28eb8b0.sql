-- Adicionar coluna gross_amount para armazenar o valor bruto (antes da taxa)
ALTER TABLE public.transactions 
ADD COLUMN gross_amount DECIMAL(12,2);