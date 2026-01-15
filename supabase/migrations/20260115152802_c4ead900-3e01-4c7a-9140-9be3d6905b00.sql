-- Add fee_percentage column to accounts table
ALTER TABLE public.accounts 
ADD COLUMN fee_percentage DECIMAL(5,2) DEFAULT 0;