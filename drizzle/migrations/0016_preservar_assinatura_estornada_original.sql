CREATE OR REPLACE FUNCTION public.proteger_acesso_estornado() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$
DECLARE v_fim timestamptz;
BEGIN
 IF OLD.estorno_exclusao_em IS NOT NULL AND OLD.stripe_subscription_id IS NOT NULL THEN
  INSERT INTO public.assinaturas_estornadas(subscription_id,user_id,encerrada_em) VALUES(OLD.stripe_subscription_id,OLD.user_id,OLD.estorno_exclusao_em) ON CONFLICT(subscription_id) DO NOTHING;
 END IF;
 IF NEW.estorno_exclusao_em IS NOT NULL AND NEW.stripe_subscription_id IS NOT NULL AND (NEW.stripe_subscription_id IS NOT DISTINCT FROM OLD.stripe_subscription_id OR NEW.estorno_exclusao_em IS DISTINCT FROM OLD.estorno_exclusao_em) THEN
  INSERT INTO public.assinaturas_estornadas(subscription_id,user_id,encerrada_em) VALUES(NEW.stripe_subscription_id,NEW.user_id,NEW.estorno_exclusao_em) ON CONFLICT(subscription_id) DO NOTHING;
 END IF;
 SELECT encerrada_em INTO v_fim FROM public.assinaturas_estornadas WHERE subscription_id=NEW.stripe_subscription_id AND user_id=NEW.user_id;
 IF v_fim IS NOT NULL THEN
  NEW.estorno_exclusao_em:=v_fim;NEW.plano:='sem_plano';NEW.status:='canceled';NEW.periodo_atual_fim:=v_fim;NEW.teste_ate:=LEAST(NEW.teste_ate,v_fim);
 ELSIF NEW.stripe_subscription_id IS DISTINCT FROM OLD.stripe_subscription_id THEN NEW.estorno_exclusao_em:=NULL;
 END IF;
 RETURN NEW;
END; $$;