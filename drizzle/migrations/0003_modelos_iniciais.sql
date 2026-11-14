-- =====================================================================
-- Modelo inicial para novos cadastros
-- Cria um "modelo" (foto congelada) a partir de uma conta de referência e
-- aplica esse modelo automaticamente a cada novo usuário.
-- Copia: serviços (com faixas de manutenção), categorias, configurações
-- (CRM, retenção, cancelamento, valor de reserva do caixa) e o template de
-- anamnese atual. NUNCA copia clientes, agendamentos, movimentações, fotos,
-- fichas respondidas ou credenciais do Google.
-- =====================================================================

-- 1. Tabela do modelo --------------------------------------------------
CREATE TABLE public.modelos_iniciais (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  segmento text NOT NULL,
  conteudo jsonb NOT NULL,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT modelos_iniciais_segmento_key UNIQUE (segmento)
);

-- RLS ligado e SEM políticas: nenhum usuário lê ou escreve direto.
-- Só as funções SECURITY DEFINER abaixo acessam a tabela.
ALTER TABLE public.modelos_iniciais ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.modelos_iniciais FROM PUBLIC, anon, authenticated;

-- 2. Gerar (ou regerar) o modelo a partir de uma conta ------------------
CREATE OR REPLACE FUNCTION public.gerar_modelo_inicial(
  p_email text,
  p_segmento text DEFAULT 'lash',
  p_nome text DEFAULT 'Lash Designer'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_uid uuid;
  v_servicos jsonb;
  v_categorias jsonb;
  v_config jsonb;
  v_anamnese jsonb;
BEGIN
  SELECT id INTO v_uid FROM auth.users WHERE lower(email) = lower(p_email);
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Conta de referência não encontrada: %', p_email;
  END IF;

  -- Serviços (notes fica de fora: é anotação privada da dona da conta)
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
           'ref', s.id,
           'pai_ref', s.servico_pai_id,
           'description', s.description,
           'amount', s.amount,
           'duration', s.duration,
           'color', s.color,
           'technique_name', s.technique_name,
           'tier_type', s.tier_type,
           'dias_min', s.dias_min,
           'dias_max', s.dias_max,
           'possui_manutencao', s.possui_manutencao,
           'manutencao_ate_dias', s.manutencao_ate_dias
         ) ORDER BY s.created_at, s.id), '[]'::jsonb)
    INTO v_servicos
    FROM public.services s
   WHERE s.user_id = v_uid;

  -- Categorias (sem duplicadas; escopo empresa/pessoal preservado)
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
           'name', c.name, 'type', c.type, 'scope', c.scope
         ) ORDER BY c.scope, c.type, c.name), '[]'::jsonb)
    INTO v_categorias
    FROM (SELECT DISTINCT name, type, scope
            FROM public.categories WHERE user_id = v_uid) c;

  -- Configurações. Ficam de fora: Google, meta mensal, texto da mensagem
  -- de confirmação e a chave do caixa (novo usuário sempre começa desligado).
  SELECT jsonb_build_object(
           'retention_intervals', us.retention_intervals,
           'retention_reminder_days', us.retention_reminder_days,
           'retention_color_previsto', us.retention_color_previsto,
           'retention_color_aguardando', us.retention_color_aguardando,
           'retention_color_confirmado', us.retention_color_confirmado,
           'crm_inactive_days', us.crm_inactive_days,
           'crm_confirm_days', us.crm_confirm_days,
           'crm_vip_count', us.crm_vip_count,
           'caixa_reserva_valor', us.caixa_reserva_valor,
           'cancellation_notice_hours', us.cancellation_notice_hours,
           'cancellation_fee', us.cancellation_fee
         )
    INTO v_config
    FROM public.user_settings us
   WHERE us.user_id = v_uid;

  -- Anamnese: só templates ativos, só a versão atual, só as perguntas.
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
           'name', t.name,
           'description', t.description,
           'perguntas', (
             SELECT COALESCE(jsonb_agg(jsonb_build_object(
                      'section', q.section,
                      'label', q.label,
                      'type', q.type,
                      'options', q.options,
                      'required', q.required,
                      'order_index', q.order_index
                    ) ORDER BY q.order_index, q.created_at, q.id), '[]'::jsonb)
               FROM public.anamnese_questions q
              WHERE q.version_id = v.id)
         ) ORDER BY t.created_at, t.id), '[]'::jsonb)
    INTO v_anamnese
    FROM public.anamnese_templates t
    JOIN public.anamnese_template_versions v
      ON v.template_id = t.id AND v.is_current = true
   WHERE t.user_id = v_uid AND t.active = true;

  INSERT INTO public.modelos_iniciais (nome, segmento, conteudo, ativo)
  VALUES (
    p_nome, p_segmento,
    jsonb_build_object(
      'servicos', v_servicos,
      'categorias', v_categorias,
      'contas', jsonb_build_array(
        jsonb_build_object('name', 'Dinheiro', 'type', 'dinheiro'),
        jsonb_build_object('name', 'Pix', 'type', 'banco'),
        jsonb_build_object('name', 'Maquininha', 'type', 'maquininha')),
      'configuracoes', v_config,
      'anamnese', v_anamnese),
    true)
  ON CONFLICT (segmento) DO UPDATE
    SET nome = EXCLUDED.nome,
        conteudo = EXCLUDED.conteudo,
        ativo = true,
        updated_at = now();

  RAISE NOTICE 'Modelo "%" gerado: % serviços, % categorias, % template(s) de anamnese',
    p_segmento, jsonb_array_length(v_servicos), jsonb_array_length(v_categorias),
    jsonb_array_length(v_anamnese);
END;
$function$;

-- 3. Aplicar o modelo a um usuário novo ---------------------------------
-- Retorna false se não havia modelo ativo ou se a conta já tinha dados.
CREATE OR REPLACE FUNCTION public.aplicar_modelo_inicial(
  p_user_id uuid,
  p_segmento text DEFAULT 'lash'
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_c jsonb;
  v_item jsonb;
  v_q jsonb;
  v_mapa jsonb := '{}'::jsonb;  -- id do serviço no modelo -> id novo
  v_novo uuid;
  v_template uuid;
  v_versao uuid;
BEGIN
  SELECT conteudo INTO v_c
    FROM public.modelos_iniciais
   WHERE segmento = p_segmento AND ativo = true;
  IF v_c IS NULL THEN
    RETURN false;
  END IF;

  -- Nunca aplicar sobre uma conta que já tem dados
  IF EXISTS (SELECT 1 FROM public.services WHERE user_id = p_user_id)
     OR EXISTS (SELECT 1 FROM public.categories WHERE user_id = p_user_id) THEN
    RETURN false;
  END IF;

  -- Categorias
  INSERT INTO public.categories (user_id, name, type, scope)
  SELECT p_user_id, x.name, x.type, x.scope
    FROM jsonb_to_recordset(COALESCE(v_c->'categorias', '[]'::jsonb))
         AS x(name text, type text, scope text);

  -- Contas
  INSERT INTO public.accounts (user_id, name, type)
  SELECT p_user_id, x.name, x.type
    FROM jsonb_to_recordset(COALESCE(v_c->'contas', '[]'::jsonb))
         AS x(name text, type text);

  -- Serviços principais primeiro (as faixas dependem deles)
  FOR v_item IN
    SELECT t.item
      FROM jsonb_array_elements(COALESCE(v_c->'servicos', '[]'::jsonb))
           WITH ORDINALITY AS t(item, ord)
     WHERE t.item->>'pai_ref' IS NULL
     ORDER BY t.ord
  LOOP
    INSERT INTO public.services (
      user_id, description, amount, duration, color, technique_name,
      tier_type, dias_min, dias_max, possui_manutencao)
    VALUES (
      p_user_id,
      v_item->>'description',
      COALESCE((v_item->>'amount')::numeric, 0),
      COALESCE((v_item->>'duration')::integer, 60),
      v_item->>'color',
      v_item->>'technique_name',
      v_item->>'tier_type',
      (v_item->>'dias_min')::integer,
      (v_item->>'dias_max')::integer,
      COALESCE((v_item->>'possui_manutencao')::boolean, false))
    RETURNING id INTO v_novo;
    v_mapa := v_mapa || jsonb_build_object(v_item->>'ref', v_novo);
  END LOOP;

  -- Faixas de manutenção, religadas ao serviço principal novo
  FOR v_item IN
    SELECT t.item
      FROM jsonb_array_elements(COALESCE(v_c->'servicos', '[]'::jsonb))
           WITH ORDINALITY AS t(item, ord)
     WHERE t.item->>'pai_ref' IS NOT NULL
       AND v_mapa ? (t.item->>'pai_ref')
     ORDER BY t.ord
  LOOP
    INSERT INTO public.services (
      user_id, description, amount, duration, color, technique_name,
      tier_type, dias_min, dias_max, possui_manutencao,
      servico_pai_id, manutencao_ate_dias)
    VALUES (
      p_user_id,
      v_item->>'description',
      COALESCE((v_item->>'amount')::numeric, 0),
      COALESCE((v_item->>'duration')::integer, 60),
      v_item->>'color',
      v_item->>'technique_name',
      v_item->>'tier_type',
      (v_item->>'dias_min')::integer,
      (v_item->>'dias_max')::integer,
      COALESCE((v_item->>'possui_manutencao')::boolean, false),
      (v_mapa->>(v_item->>'pai_ref'))::uuid,
      (v_item->>'manutencao_ate_dias')::integer);
  END LOOP;

  -- Configurações (caixa sempre começa desligado; meta mensal zerada)
  IF jsonb_typeof(v_c->'configuracoes') = 'object' THEN
    INSERT INTO public.user_settings (
      user_id, retention_intervals, retention_reminder_days,
      retention_color_previsto, retention_color_aguardando,
      retention_color_confirmado, crm_inactive_days, crm_confirm_days,
      crm_vip_count, caixa_reserva_valor, caixa_reserva_ativo,
      cancellation_notice_hours, cancellation_fee)
    SELECT p_user_id,
           COALESCE(r.retention_intervals, '{15,20,21,30}'::integer[]),
           COALESCE(r.retention_reminder_days, 3),
           COALESCE(r.retention_color_previsto, '#FBBF24'),
           COALESCE(r.retention_color_aguardando, '#F97316'),
           COALESCE(r.retention_color_confirmado, '#10B981'),
           COALESCE(r.crm_inactive_days, 45),
           COALESCE(r.crm_confirm_days, 3),
           COALESCE(r.crm_vip_count, 10),
           COALESCE(r.caixa_reserva_valor, 0),
           false,
           COALESCE(r.cancellation_notice_hours, 48),
           COALESCE(r.cancellation_fee, 50)
      FROM jsonb_populate_record(NULL::public.user_settings, v_c->'configuracoes') r
    ON CONFLICT (user_id) DO NOTHING;
  END IF;

  -- Anamnese: template novo, versão 1, destravada
  FOR v_item IN
    SELECT t.item
      FROM jsonb_array_elements(COALESCE(v_c->'anamnese', '[]'::jsonb))
           WITH ORDINALITY AS t(item, ord)
     ORDER BY t.ord
  LOOP
    INSERT INTO public.anamnese_templates (user_id, name, description, active)
    VALUES (p_user_id, v_item->>'name', v_item->>'description', true)
    RETURNING id INTO v_template;

    INSERT INTO public.anamnese_template_versions (template_id, user_id, version, is_current, locked)
    VALUES (v_template, p_user_id, 1, true, false)
    RETURNING id INTO v_versao;

    FOR v_q IN
      SELECT t.item
        FROM jsonb_array_elements(COALESCE(v_item->'perguntas', '[]'::jsonb))
             WITH ORDINALITY AS t(item, ord)
       ORDER BY t.ord
    LOOP
      INSERT INTO public.anamnese_questions (
        version_id, user_id, section, label, type, options, required, order_index)
      VALUES (
        v_versao, p_user_id,
        COALESCE(v_q->>'section', 'Geral'),
        v_q->>'label',
        (v_q->>'type')::public.anamnese_question_type,
        COALESCE(v_q->'options', '[]'::jsonb),
        COALESCE((v_q->>'required')::boolean, false),
        COALESCE((v_q->>'order_index')::integer, 0));
    END LOOP;
  END LOOP;

  RETURN true;
END;
$function$;

-- Ninguém chama essas funções pelo app: só a migração e o gatilho de cadastro.
REVOKE EXECUTE ON FUNCTION public.gerar_modelo_inicial(text, text, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.aplicar_modelo_inicial(uuid, text) FROM PUBLIC, anon, authenticated;

-- 4. Cadastro: aplica o modelo; se algo falhar, cai no básico ------------
-- Um erro aqui bloquearia o cadastro, por isso o modelo roda dentro de um
-- bloco protegido e existe um conjunto mínimo de reserva.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_aplicado boolean := false;
BEGIN
  BEGIN
    v_aplicado := public.aplicar_modelo_inicial(NEW.id);
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'aplicar_modelo_inicial falhou para %: %', NEW.id, SQLERRM;
    v_aplicado := false;
  END;

  IF NOT COALESCE(v_aplicado, false) THEN
    INSERT INTO public.categories (user_id, name, type, scope) VALUES
      (NEW.id, 'Serviços', 'entrada', 'empresa'),
      (NEW.id, 'Vendas de Produtos', 'entrada', 'empresa'),
      (NEW.id, 'Outros', 'entrada', 'empresa'),
      (NEW.id, 'Aluguel', 'saida', 'empresa'),
      (NEW.id, 'Produtos', 'saida', 'empresa'),
      (NEW.id, 'Equipamentos', 'saida', 'empresa'),
      (NEW.id, 'Marketing', 'saida', 'empresa'),
      (NEW.id, 'Funcionários', 'saida', 'empresa'),
      (NEW.id, 'Impostos', 'saida', 'empresa'),
      (NEW.id, 'Outros', 'saida', 'empresa'),
      (NEW.id, 'Salário', 'entrada', 'pessoal'),
      (NEW.id, 'Outros', 'entrada', 'pessoal'),
      (NEW.id, 'Alimentação', 'saida', 'pessoal'),
      (NEW.id, 'Transporte', 'saida', 'pessoal'),
      (NEW.id, 'Lazer', 'saida', 'pessoal'),
      (NEW.id, 'Saúde', 'saida', 'pessoal'),
      (NEW.id, 'Outros', 'saida', 'pessoal');

    INSERT INTO public.accounts (user_id, name, type) VALUES
      (NEW.id, 'Dinheiro', 'dinheiro'),
      (NEW.id, 'Pix', 'banco'),
      (NEW.id, 'Maquininha', 'maquininha');
  END IF;

  RETURN NEW;
END;
$function$;

-- 5. Tirar a foto da conta de referência --------------------------------
SELECT public.gerar_modelo_inicial('ligia.waked@gmail.com', 'lash', 'Lash Designer');