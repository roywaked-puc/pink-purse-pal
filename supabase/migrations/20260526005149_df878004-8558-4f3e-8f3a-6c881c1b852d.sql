
ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL;

UPDATE public.transactions t
SET account_id = a.id
FROM public.accounts a
WHERE t.account_id IS NULL
  AND a.user_id = t.user_id
  AND (t.account = a.id::text OR t.account = a.name);

UPDATE public.transactions t
SET category_id = c.id
FROM public.categories c
WHERE t.category_id IS NULL
  AND c.user_id = t.user_id
  AND c.name = t.category
  AND c.scope = t.scope
  AND c.type = t.type;

CREATE INDEX IF NOT EXISTS idx_transactions_account_id ON public.transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_category_id ON public.transactions(category_id);
