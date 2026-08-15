
-- Enums
CREATE TYPE public.anamnese_question_type AS ENUM (
  'texto_curto','texto_longo','sim_nao','multipla_escolha','selecao_unica','data','numero','checkbox'
);
CREATE TYPE public.anamnese_response_status AS ENUM (
  'pendente','preenchida','assinada','arquivada'
);

-- Templates
CREATE TABLE public.anamnese_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.anamnese_templates TO authenticated;
GRANT ALL ON public.anamnese_templates TO service_role;
ALTER TABLE public.anamnese_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own templates" ON public.anamnese_templates FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_anamnese_templates_updated BEFORE UPDATE ON public.anamnese_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Versions
CREATE TABLE public.anamnese_template_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES public.anamnese_templates(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  version INTEGER NOT NULL DEFAULT 1,
  is_current BOOLEAN NOT NULL DEFAULT true,
  locked BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (template_id, version)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.anamnese_template_versions TO authenticated;
GRANT ALL ON public.anamnese_template_versions TO service_role;
ALTER TABLE public.anamnese_template_versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own versions" ON public.anamnese_template_versions FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Questions
CREATE TABLE public.anamnese_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version_id UUID NOT NULL REFERENCES public.anamnese_template_versions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  section TEXT NOT NULL DEFAULT 'Geral',
  label TEXT NOT NULL,
  type public.anamnese_question_type NOT NULL,
  options JSONB NOT NULL DEFAULT '[]'::jsonb,
  required BOOLEAN NOT NULL DEFAULT false,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.anamnese_questions TO authenticated;
GRANT ALL ON public.anamnese_questions TO service_role;
ALTER TABLE public.anamnese_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own questions" ON public.anamnese_questions FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Responses
CREATE TABLE public.anamnese_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  template_id UUID NOT NULL REFERENCES public.anamnese_templates(id) ON DELETE RESTRICT,
  version_id UUID NOT NULL REFERENCES public.anamnese_template_versions(id) ON DELETE RESTRICT,
  status public.anamnese_response_status NOT NULL DEFAULT 'pendente',
  filled_at TIMESTAMPTZ,
  signed_at TIMESTAMPTZ,
  signature_data TEXT,
  pdf_path TEXT,
  share_token UUID NOT NULL DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.anamnese_responses TO authenticated;
GRANT ALL ON public.anamnese_responses TO service_role;
ALTER TABLE public.anamnese_responses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own responses select" ON public.anamnese_responses FOR SELECT
  USING (auth.uid() = user_id);
CREATE POLICY "own responses insert" ON public.anamnese_responses FOR INSERT
  WITH CHECK (auth.uid() = user_id);
-- Update only if not signed (status differs from 'assinada' in OLD)
CREATE POLICY "own responses update unsigned" ON public.anamnese_responses FOR UPDATE
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own responses delete unsigned" ON public.anamnese_responses FOR DELETE
  USING (auth.uid() = user_id AND status <> 'assinada');
CREATE TRIGGER trg_anamnese_responses_updated BEFORE UPDATE ON public.anamnese_responses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Freeze trigger: once signed, only pdf_path/status='arquivada' can change
CREATE OR REPLACE FUNCTION public.anamnese_responses_freeze()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF OLD.status = 'assinada' THEN
    -- Allow only pdf_path update or status -> arquivada
    IF NEW.signature_data IS DISTINCT FROM OLD.signature_data
      OR NEW.signed_at IS DISTINCT FROM OLD.signed_at
      OR NEW.version_id <> OLD.version_id
      OR NEW.template_id <> OLD.template_id
      OR NEW.client_id <> OLD.client_id
      OR (NEW.status <> 'assinada' AND NEW.status <> 'arquivada') THEN
      RAISE EXCEPTION 'Anamnese assinada não pode ser modificada';
    END IF;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_anamnese_responses_freeze BEFORE UPDATE ON public.anamnese_responses
  FOR EACH ROW EXECUTE FUNCTION public.anamnese_responses_freeze();

-- Answers
CREATE TABLE public.anamnese_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  response_id UUID NOT NULL REFERENCES public.anamnese_responses(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.anamnese_questions(id) ON DELETE RESTRICT,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  value JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.anamnese_answers TO authenticated;
GRANT ALL ON public.anamnese_answers TO service_role;
ALTER TABLE public.anamnese_answers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own answers" ON public.anamnese_answers FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Freeze answers when response is signed
CREATE OR REPLACE FUNCTION public.anamnese_answers_freeze()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
DECLARE s public.anamnese_response_status;
BEGIN
  SELECT status INTO s FROM public.anamnese_responses
    WHERE id = COALESCE(NEW.response_id, OLD.response_id);
  IF s = 'assinada' THEN
    RAISE EXCEPTION 'Respostas de anamnese assinada não podem ser alteradas';
  END IF;
  RETURN COALESCE(NEW, OLD);
END $$;
CREATE TRIGGER trg_anamnese_answers_freeze
  BEFORE INSERT OR UPDATE OR DELETE ON public.anamnese_answers
  FOR EACH ROW EXECUTE FUNCTION public.anamnese_answers_freeze();

CREATE INDEX idx_anamnese_responses_client ON public.anamnese_responses(client_id);
CREATE INDEX idx_anamnese_responses_user ON public.anamnese_responses(user_id);
CREATE INDEX idx_anamnese_questions_version ON public.anamnese_questions(version_id);
CREATE INDEX idx_anamnese_versions_template ON public.anamnese_template_versions(template_id);
CREATE INDEX idx_anamnese_answers_response ON public.anamnese_answers(response_id);
