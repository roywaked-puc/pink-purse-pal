CREATE TABLE public.account_fee_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  fee_percentage DECIMAL(5,2) NOT NULL DEFAULT 0,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.account_fee_types TO authenticated;
GRANT ALL ON public.account_fee_types TO service_role;

ALTER TABLE public.account_fee_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "account_fee_types_all_own"
  ON public.account_fee_types
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_account_fee_types_account_id ON public.account_fee_types(account_id);

ALTER TABLE public.transactions
  ADD COLUMN account_fee_type_id UUID REFERENCES public.account_fee_types(id) ON DELETE SET NULL;

CREATE INDEX idx_transactions_account_fee_type_id ON public.transactions(account_fee_type_id);