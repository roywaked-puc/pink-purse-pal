-- =====================================================================
-- Cria o tipo de conta 'permuta' e reclassifica as contas que hoje estão
-- como 'banco' mas na verdade representam controle de permuta por pessoa
-- (não são dinheiro real — usadas só para saber o que foi dado/recebido).
-- =====================================================================

-- 1. Amplia o CHECK constraint de accounts.type para aceitar 'permuta'
ALTER TABLE public.accounts DROP CONSTRAINT IF EXISTS accounts_type_check;
ALTER TABLE public.accounts
  ADD CONSTRAINT accounts_type_check
  CHECK (type IN ('dinheiro', 'banco', 'maquininha', 'permuta'));

-- 2. Reclassifica as 9 contas de permuta (nomes de pessoa) — mantém id e
--    histórico de transações intactos, só muda o "type"
UPDATE public.accounts
SET type = 'permuta'
WHERE id IN (
  '5fe43470-f407-4fb7-8f71-dd90bf0f7355', -- Tati
  '38d0fbfb-bcad-4d6e-aa33-a9d890baaefb', -- Paty
  'b27059c7-d147-46da-a4f4-b80e829ff564', -- Gislei
  'f8a8cb17-89d8-4b58-99f8-6333a9dca200', -- Jucimara
  '2e8634c3-63b6-4da1-9e02-c5a974ae3bac', -- Laura
  'eaa35289-bf23-4bef-adc5-b50b32a5a70d', -- Kamilla
  'ac51fcfb-8cde-4b1b-8952-89d08e078c31', -- Ferzinha
  '45e530b9-df5c-4aea-8a8b-f41da7a556b0', -- Thania
  '36448a46-de54-45f8-bffe-5c9a9906c4f5'  -- Ju unha
);

-- 3. Remove qualquer tipo de cobrança (Pix/Débito/Crédito) que essas contas
--    tenham ganhado por engano em algum backfill anterior — permuta não
--    usa taxa de cartão
DELETE FROM public.account_fee_types
WHERE account_id IN (
  '5fe43470-f407-4fb7-8f71-dd90bf0f7355',
  '38d0fbfb-bcad-4d6e-aa33-a9d890baaefb',
  'b27059c7-d147-46da-a4f4-b80e829ff564',
  'f8a8cb17-89d8-4b58-99f8-6333a9dca200',
  '2e8634c3-63b6-4da1-9e02-c5a974ae3bac',
  'eaa35289-bf23-4bef-adc5-b50b32a5a70d',
  'ac51fcfb-8cde-4b1b-8952-89d08e078c31',
  '45e530b9-df5c-4aea-8a8b-f41da7a556b0',
  '36448a46-de54-45f8-bffe-5c9a9906c4f5'
);