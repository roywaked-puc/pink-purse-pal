ALTER TABLE public.assinaturas ADD COLUMN acao_conta_token uuid;
ALTER TABLE public.assinaturas ADD COLUMN acao_conta_ate timestamptz;
ALTER TABLE public.assinaturas ADD COLUMN exclusao_tentativa_em timestamptz;
CREATE TABLE public.assinaturas_estornadas (subscription_id text PRIMARY KEY, user_id uuid NOT NULL, encerrada_em timestamptz NOT NULL);
GRANT ALL ON public.assinaturas_estornadas TO service_role;
REVOKE ALL ON public.assinaturas_estornadas FROM anon,authenticated;
ALTER TABLE public.assinaturas_estornadas ENABLE ROW LEVEL SECURITY;
CREATE FUNCTION public.iniciar_acao_conta(p_user_id uuid,p_token uuid) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 UPDATE public.assinaturas SET acao_conta_token=p_token,acao_conta_ate=clock_timestamp()+interval '5 minutes' WHERE user_id=p_user_id AND (acao_conta_token IS NULL OR acao_conta_ate<clock_timestamp());
 RETURN FOUND;
END; $$;
CREATE FUNCTION public.finalizar_acao_conta(p_user_id uuid,p_token uuid) RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path=public AS $$
 UPDATE public.assinaturas SET acao_conta_token=NULL,acao_conta_ate=NULL WHERE user_id=p_user_id AND acao_conta_token=p_token;
$$;
REVOKE ALL ON FUNCTION public.iniciar_acao_conta(uuid,uuid),public.finalizar_acao_conta(uuid,uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.iniciar_acao_conta(uuid,uuid),public.finalizar_acao_conta(uuid,uuid) TO service_role;
CREATE OR REPLACE FUNCTION public.proteger_acesso_estornado() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$
DECLARE v_fim timestamptz;
BEGIN
 IF NEW.estorno_exclusao_em IS NOT NULL AND NEW.stripe_subscription_id IS NOT NULL THEN
  INSERT INTO public.assinaturas_estornadas(subscription_id,user_id,encerrada_em) VALUES(NEW.stripe_subscription_id,NEW.user_id,NEW.estorno_exclusao_em) ON CONFLICT(subscription_id) DO NOTHING;
 END IF;
 SELECT encerrada_em INTO v_fim FROM public.assinaturas_estornadas WHERE subscription_id=NEW.stripe_subscription_id AND user_id=NEW.user_id;
 IF v_fim IS NOT NULL THEN
  NEW.estorno_exclusao_em:=v_fim; NEW.plano:='sem_plano';NEW.status:='canceled';NEW.periodo_atual_fim:=v_fim;NEW.teste_ate:=LEAST(NEW.teste_ate,v_fim);
 ELSIF NEW.stripe_subscription_id IS DISTINCT FROM OLD.stripe_subscription_id THEN NEW.estorno_exclusao_em:=NULL;
 END IF;
 RETURN NEW;
END; $$;