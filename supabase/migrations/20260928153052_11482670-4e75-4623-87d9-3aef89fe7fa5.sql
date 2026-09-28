ALTER TABLE public.services
  ADD COLUMN IF NOT EXISTS possui_manutencao boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS servico_pai_id uuid REFERENCES public.services(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS manutencao_ate_dias integer;

ALTER TABLE public.services
  ADD CONSTRAINT services_faixa_ate_dias_check
    CHECK (servico_pai_id IS NULL OR (manutencao_ate_dias IS NOT NULL AND manutencao_ate_dias > 0)),
  ADD CONSTRAINT services_pai_ate_dias_unique UNIQUE (servico_pai_id, manutencao_ate_dias);

CREATE INDEX IF NOT EXISTS idx_services_servico_pai_id ON public.services(servico_pai_id);

CREATE OR REPLACE FUNCTION public.services_faixa_guard()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
DECLARE p public.services%ROWTYPE;
BEGIN
  IF NEW.servico_pai_id IS NULL THEN RETURN NEW; END IF;
  IF NEW.servico_pai_id = NEW.id THEN
    RAISE EXCEPTION 'Um serviço não pode ser faixa de si mesmo';
  END IF;
  SELECT * INTO p FROM public.services WHERE id = NEW.servico_pai_id;
  IF NOT FOUND OR p.user_id <> NEW.user_id THEN
    RAISE EXCEPTION 'Serviço principal inválido';
  END IF;
  IF p.servico_pai_id IS NOT NULL THEN
    RAISE EXCEPTION 'Uma faixa não pode ter faixas';
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER trg_services_faixa_guard
BEFORE INSERT OR UPDATE ON public.services
FOR EACH ROW EXECUTE FUNCTION public.services_faixa_guard();

-- Backfill (sem alterar description)
UPDATE public.services
   SET possui_manutencao = true
 WHERE lower(translate(description, 'çÇãÃáÁâÂ', 'cCaAaAaA')) ~ '\s-\s*colocacao\s*$';

WITH faixas AS (
  SELECT s.id, s.user_id, s.created_at,
         lower(btrim(regexp_replace(m[1], '\s+', ' ', 'g'))) AS tecnica,
         m[2]::int AS dias
    FROM public.services s,
         LATERAL regexp_match(
           lower(translate(s.description, 'çÇãÃáÁâÂ', 'cCaAaAaA')),
           '^(.*\S)\s*-\s*\d+\s*a?\s*manutencao\s+de\s+(\d+)\s*dias?\s*$') AS m
   WHERE s.servico_pai_id IS NULL AND m IS NOT NULL
),
pais AS (
  SELECT id, user_id,
         lower(btrim(regexp_replace(regexp_replace(translate(description, 'çÇãÃáÁâÂ', 'cCaAaAaA'), '\s-\s*colocacao\s*$', '', 'i'), '\s+', ' ', 'g'))) AS tecnica
    FROM public.services
   WHERE lower(translate(description, 'çÇãÃáÁâÂ', 'cCaAaAaA')) ~ '\s-\s*colocacao\s*$'
),
ligacoes AS (
  SELECT f.id, p.id AS pai_id, f.dias,
         count(*) OVER (PARTITION BY p.id, f.dias) AS dup,
         count(*) OVER (PARTITION BY f.id) AS npais
    FROM faixas f JOIN pais p ON p.user_id = f.user_id AND p.tecnica = f.tecnica
)
UPDATE public.services s
   SET servico_pai_id = l.pai_id, manutencao_ate_dias = l.dias
  FROM ligacoes l
 WHERE s.id = l.id AND l.dup = 1 AND l.npais = 1;