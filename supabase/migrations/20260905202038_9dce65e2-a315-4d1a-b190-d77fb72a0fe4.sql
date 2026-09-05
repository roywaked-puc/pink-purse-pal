UPDATE public.user_settings
SET caixa_inicio_em = now()
WHERE caixa_reserva_ativo = true AND caixa_inicio_em IS NULL;

CREATE OR REPLACE FUNCTION public.caixa_inicio_em_guard()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.caixa_reserva_ativo = true AND NEW.caixa_inicio_em IS NULL THEN
    NEW.caixa_inicio_em := now();
  END IF;
  RETURN NEW;
END $$;

REVOKE EXECUTE ON FUNCTION public.caixa_inicio_em_guard() FROM anon, authenticated;

DROP TRIGGER IF EXISTS trg_caixa_inicio_em_guard ON public.user_settings;
CREATE TRIGGER trg_caixa_inicio_em_guard
BEFORE INSERT OR UPDATE ON public.user_settings
FOR EACH ROW EXECUTE FUNCTION public.caixa_inicio_em_guard();