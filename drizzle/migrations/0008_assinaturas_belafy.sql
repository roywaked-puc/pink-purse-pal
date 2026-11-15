CREATE TABLE public.assinaturas (
 user_id uuid PRIMARY KEY,
 plano text NOT NULL DEFAULT 'sem_plano' CHECK (plano IN ('pro','sem_plano')),
 periodicidade text CHECK (periodicidade IN ('mensal','anual')),
 status text NOT NULL DEFAULT 'sem_assinatura',
 teste_ate timestamptz NOT NULL,
 stripe_customer_id text UNIQUE,
 stripe_subscription_id text UNIQUE,
 periodo_atual_fim timestamptz,
 cancelar_no_fim_do_periodo boolean NOT NULL DEFAULT false,
 isento boolean NOT NULL DEFAULT false,
 criado_em timestamptz NOT NULL DEFAULT now(),
 atualizado_em timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.assinaturas TO authenticated;
GRANT ALL ON public.assinaturas TO service_role;
ALTER TABLE public.assinaturas ENABLE ROW LEVEL SECURITY;
CREATE POLICY assinaturas_leitura_propria ON public.assinaturas FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE TABLE public.eventos_stripe (
 evento_id text PRIMARY KEY,
 tipo text NOT NULL,
 modo text NOT NULL CHECK (modo IN ('sandbox','live')),
 ocorrido_em timestamptz NOT NULL,
 processado_em timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.eventos_stripe TO service_role;
ALTER TABLE public.eventos_stripe ENABLE ROW LEVEL SECURITY;
INSERT INTO public.assinaturas(user_id,teste_ate,isento) SELECT id,created_at + interval '40 days',true FROM auth.users ON CONFLICT (user_id) DO NOTHING;
CREATE OR REPLACE FUNCTION public.plano_efetivo() RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
 SELECT COALESCE((SELECT CASE WHEN isento THEN 'isento' WHEN plano='pro' AND (status IN ('active','past_due') OR (status='canceled' AND periodo_atual_fim > now())) THEN 'pro' WHEN teste_ate > now() THEN 'teste' ELSE 'expirado' END FROM public.assinaturas WHERE user_id=auth.uid()),'expirado');
$$;
REVOKE ALL ON FUNCTION public.plano_efetivo() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.plano_efetivo() TO authenticated;
CREATE OR REPLACE FUNCTION public.resumo_assinatura() RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
 SELECT jsonb_build_object('estado',public.plano_efetivo(),'teste_ate',teste_ate,'periodo_atual_fim',periodo_atual_fim,'periodicidade',periodicidade,'cancelar_no_fim_do_periodo',cancelar_no_fim_do_periodo,'status',status,'tem_customer',stripe_customer_id IS NOT NULL) FROM public.assinaturas WHERE user_id=auth.uid();
$$;
REVOKE ALL ON FUNCTION public.resumo_assinatura() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.resumo_assinatura() TO authenticated;
CREATE OR REPLACE FUNCTION public.validar_criacao_agendamento() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF auth.uid() IS NULL OR NEW.user_id IS DISTINCT FROM auth.uid() THEN RAISE EXCEPTION USING ERRCODE='42501', MESSAGE='Usuário não autenticado'; END IF;
 IF public.plano_efetivo()='expirado' THEN RAISE EXCEPTION USING ERRCODE='P0010', MESSAGE='ASSINATURA_NECESSARIA'; END IF;
 RETURN NEW;
END; $$;
REVOKE ALL ON FUNCTION public.validar_criacao_agendamento() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER validar_assinatura_agendamento BEFORE INSERT ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.validar_criacao_agendamento();
CREATE OR REPLACE FUNCTION public.preservar_origem_agendamento() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$
BEGIN
 IF NEW.user_id IS DISTINCT FROM OLD.user_id OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN RAISE EXCEPTION USING ERRCODE='42501', MESSAGE='Origem do agendamento não pode ser alterada'; END IF;
 RETURN NEW;
END; $$;
REVOKE ALL ON FUNCTION public.preservar_origem_agendamento() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER preservar_origem_agendamento BEFORE UPDATE OF user_id,created_at ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.preservar_origem_agendamento();
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_aplicado boolean := false;
BEGIN
 BEGIN
  v_aplicado := public.aplicar_modelo_inicial(NEW.id);
 EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'aplicar_modelo_inicial falhou para %: %', NEW.id, SQLERRM;
  v_aplicado := false;
 END;
 IF NOT COALESCE(v_aplicado,false) THEN
  INSERT INTO public.categories(user_id,name,type,scope) VALUES
  (NEW.id,'Serviços','entrada','empresa'),(NEW.id,'Vendas de Produtos','entrada','empresa'),(NEW.id,'Outros','entrada','empresa'),
  (NEW.id,'Aluguel','saida','empresa'),(NEW.id,'Produtos','saida','empresa'),(NEW.id,'Equipamentos','saida','empresa'),(NEW.id,'Marketing','saida','empresa'),(NEW.id,'Funcionários','saida','empresa'),(NEW.id,'Impostos','saida','empresa'),(NEW.id,'Outros','saida','empresa'),
  (NEW.id,'Salário','entrada','pessoal'),(NEW.id,'Outros','entrada','pessoal'),(NEW.id,'Alimentação','saida','pessoal'),(NEW.id,'Transporte','saida','pessoal'),(NEW.id,'Lazer','saida','pessoal'),(NEW.id,'Saúde','saida','pessoal'),(NEW.id,'Outros','saida','pessoal');
  INSERT INTO public.accounts(user_id,name,type) VALUES (NEW.id,'Dinheiro','dinheiro'),(NEW.id,'Pix','banco'),(NEW.id,'Maquininha','maquininha');
 END IF;
 INSERT INTO public.assinaturas(user_id,teste_ate) VALUES(NEW.id,NEW.created_at + interval '40 days') ON CONFLICT(user_id) DO NOTHING;
 RETURN NEW;
END; $$;
CREATE OR REPLACE FUNCTION public.aplicar_evento_stripe(p_evento_id text,p_tipo text,p_modo text,p_ocorrido_em timestamptz,p_user_id uuid,p_customer text,p_subscription text,p_status text,p_periodicidade text,p_fim timestamptz,p_cancelar boolean,p_pago boolean) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE a public.assinaturas%ROWTYPE;
BEGIN
 SELECT * INTO a FROM public.assinaturas WHERE user_id=p_user_id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Assinatura não encontrada'; END IF;
 IF EXISTS(SELECT 1 FROM public.eventos_stripe WHERE evento_id=p_evento_id) THEN RETURN false; END IF;
 IF a.stripe_customer_id IS DISTINCT FROM p_customer THEN RAISE EXCEPTION 'Cliente Stripe inválido'; END IF;
 IF a.stripe_subscription_id IS NOT NULL AND a.stripe_subscription_id<>p_subscription THEN
  INSERT INTO public.eventos_stripe(evento_id,tipo,modo,ocorrido_em) VALUES(p_evento_id,p_tipo,p_modo,p_ocorrido_em) ON CONFLICT DO NOTHING;
  RETURN false;
 END IF;
 UPDATE public.assinaturas SET stripe_subscription_id=p_subscription,status=p_status,periodicidade=p_periodicidade,
 plano=CASE WHEN p_pago AND p_status IN ('active','past_due','canceled') THEN 'pro' WHEN p_status IN ('canceled','unpaid','incomplete_expired','paused') AND NOT (plano='pro' AND p_fim>now() AND p_status='canceled') THEN 'sem_plano' ELSE plano END,
 periodo_atual_fim=CASE WHEN p_pago THEN GREATEST(periodo_atual_fim,p_fim) ELSE periodo_atual_fim END,
 cancelar_no_fim_do_periodo=p_cancelar,atualizado_em=now() WHERE user_id=p_user_id;
 INSERT INTO public.eventos_stripe(evento_id,tipo,modo,ocorrido_em) VALUES(p_evento_id,p_tipo,p_modo,p_ocorrido_em);
 RETURN true;
END; $$;
REVOKE ALL ON FUNCTION public.aplicar_evento_stripe(text,text,text,timestamptz,uuid,text,text,text,text,timestamptz,boolean,boolean) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.aplicar_evento_stripe(text,text,text,timestamptz,uuid,text,text,text,text,timestamptz,boolean,boolean) TO service_role;