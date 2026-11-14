-- =====================================================================
-- Minha Marca: nome do negócio, logo e cor principal por usuário
-- =====================================================================

ALTER TABLE public.user_settings
  ADD COLUMN nome_negocio text,
  ADD COLUMN logo_path text,                 -- layout: {auth.uid()}/logo.<ext>
  ADD COLUMN cor_primaria text,              -- hex, ex: #EC4899; NULL = rosa padrão
  ADD COLUMN onboarding_concluido_em timestamptz;

ALTER TABLE public.user_settings
  ADD CONSTRAINT user_settings_cor_primaria_check
  CHECK (cor_primaria IS NULL OR cor_primaria ~ '^#[0-9A-Fa-f]{6}$');

-- user_settings tem colunas com SELECT revogado (tokens do Google); se os
-- privilégios forem por coluna, as novas precisam de GRANT explícito.
GRANT SELECT (nome_negocio, logo_path, cor_primaria, onboarding_concluido_em),
      INSERT (nome_negocio, logo_path, cor_primaria, onboarding_concluido_em),
      UPDATE (nome_negocio, logo_path, cor_primaria, onboarding_concluido_em)
  ON public.user_settings TO authenticated;

-- Quem já usa o app não vê a tela de boas-vindas.
UPDATE public.user_settings
   SET onboarding_concluido_em = now()
 WHERE onboarding_concluido_em IS NULL;

-- Bucket público (a logo aparece na ficha que a cliente abre pelo link e
-- nos PDFs). Leitura por URL pública; escrita só na própria pasta.
-- SVG fica de fora de propósito (pode carregar script).
-- NOTA: o INSERT em storage.buckets foi removido porque a ferramenta de
-- migração rejeita escritas nessa tabela; o bucket "logos" é criado pela
-- ferramenta de storage. As políticas abaixo seguem exatamente como no SQL.

CREATE POLICY "Users can view own logo files" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'logos' AND (auth.uid())::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload own logo files" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'logos' AND (auth.uid())::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update own logo files" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'logos' AND (auth.uid())::text = (storage.foldername(name))[1])
  WITH CHECK (bucket_id = 'logos' AND (auth.uid())::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own logo files" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'logos' AND (auth.uid())::text = (storage.foldername(name))[1]);