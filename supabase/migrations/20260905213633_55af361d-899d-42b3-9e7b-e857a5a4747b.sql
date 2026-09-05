ALTER TABLE public.services
  ADD COLUMN IF NOT EXISTS technique_name TEXT,
  ADD COLUMN IF NOT EXISTS tier_type TEXT,
  ADD COLUMN IF NOT EXISTS dias_min INTEGER,
  ADD COLUMN IF NOT EXISTS dias_max INTEGER;

ALTER TABLE public.services
  DROP CONSTRAINT IF EXISTS services_tier_type_check;
ALTER TABLE public.services
  ADD CONSTRAINT services_tier_type_check
  CHECK (tier_type IS NULL OR tier_type IN ('avulso', 'colocacao', 'manutencao'));

WITH parsed AS (
  SELECT
    s.id,
    CASE
      WHEN s.description ~* 'manuten' THEN 'manutencao'
      WHEN s.description ~* 'coloca'  THEN 'colocacao'
      ELSE 'avulso'
    END AS tier,
    btrim(regexp_replace(
      regexp_replace(s.description, '\s+', ' ', 'g'),
      '\s*[-–—]\s*(\d+\s*)?(manuten..o|coloca..o).*$', '', 'i'
    )) AS tech,
    (regexp_match(s.description, '(\d+)\s*dias'))[1]::int AS dias
  FROM public.services s
)
UPDATE public.services s
SET
  tier_type = p.tier,
  technique_name = CASE
    WHEN lower(p.tech) = 'volume u' THEN 'Volume U Preto'
    WHEN lower(p.tech) = 'volume russo' THEN 'Volume Russo'
    ELSE p.tech
  END,
  dias_min = CASE WHEN p.tier = 'manutencao' THEN
    CASE p.dias WHEN 15 THEN 1 WHEN 20 THEN 16 WHEN 25 THEN 21 ELSE NULL END END,
  dias_max = CASE WHEN p.tier = 'manutencao' THEN p.dias END
FROM parsed p
WHERE p.id = s.id;

WITH ranked AS (
  SELECT
    id, user_id, technique_name, dias_min, dias_max,
    first_value(id) OVER (
      PARTITION BY user_id, lower(technique_name), dias_min, dias_max
      ORDER BY created_at, id
    ) AS keeper_id
  FROM public.services
  WHERE tier_type = 'manutencao' AND dias_min IS NOT NULL
),
dups AS (
  SELECT id, keeper_id FROM ranked WHERE id <> keeper_id
),
redirected AS (
  UPDATE public.appointments a
  SET service_id = d.keeper_id
  FROM dups d
  WHERE a.service_id = d.id
  RETURNING a.id
)
DELETE FROM public.services s
USING dups d
WHERE s.id = d.id;