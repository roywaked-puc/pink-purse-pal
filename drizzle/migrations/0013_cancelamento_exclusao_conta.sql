CREATE TABLE public.contas_exclusao (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL, email text,
 status text NOT NULL DEFAULT 'agendada' CHECK (status IN ('agendada','cancelada','concluida')),
 solicitado_em timestamptz NOT NULL DEFAULT now(), excluir_apos timestamptz NOT NULL DEFAULT (now() + interval '30 days'),
 cancelada_em timestamptz, concluida_em timestamptz, stripe_customer_id text,
 reembolsado boolean NOT NULL DEFAULT false, ultimo_erro text
);
GRANT SELECT ON public.contas_exclusao TO authenticated;
GRANT ALL ON public.contas_exclusao TO service_role;
ALTER TABLE public.contas_exclusao ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Consultar propria exclusao" ON public.contas_exclusao FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE UNIQUE INDEX contas_exclusao_agendada_usuario ON public.contas_exclusao(user_id) WHERE status='agendada';
CREATE INDEX contas_exclusao_vencidas ON public.contas_exclusao(excluir_apos) WHERE status='agendada';
CREATE FUNCTION public.exclusao_conta_pendente() RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
 SELECT (SELECT jsonb_build_object('solicitado_em',solicitado_em,'excluir_apos',excluir_apos,'reembolsado',reembolsado) FROM public.contas_exclusao WHERE user_id=auth.uid() AND status='agendada');
$$;
REVOKE ALL ON FUNCTION public.exclusao_conta_pendente() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.exclusao_conta_pendente() TO authenticated,service_role;
CREATE FUNCTION public.reativar_conta_exclusao(p_user_id uuid) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v public.contas_exclusao%ROWTYPE;
BEGIN
 SELECT * INTO v FROM public.contas_exclusao WHERE user_id=p_user_id AND status='agendada' FOR UPDATE;
 IF NOT FOUND THEN RETURN true; END IF;
 IF v.excluir_apos<=clock_timestamp() THEN RETURN false; END IF;
 UPDATE public.contas_exclusao SET status='cancelada',cancelada_em=clock_timestamp(),ultimo_erro=NULL WHERE id=v.id;
 RETURN true;
END; $$;
REVOKE ALL ON FUNCTION public.reativar_conta_exclusao(uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.reativar_conta_exclusao(uuid) TO service_role;
ALTER TABLE public.assinaturas ADD COLUMN estorno_exclusao_em timestamptz;
CREATE FUNCTION public.proteger_acesso_estornado() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$
BEGIN
 IF NEW.estorno_exclusao_em IS NOT NULL AND NEW.stripe_subscription_id IS NOT DISTINCT FROM OLD.stripe_subscription_id THEN
  NEW.plano:='sem_plano'; NEW.status:='canceled'; NEW.periodo_atual_fim:=NEW.estorno_exclusao_em;
  NEW.teste_ate:=LEAST(NEW.teste_ate,NEW.estorno_exclusao_em);
 END IF;
 IF NEW.stripe_subscription_id IS DISTINCT FROM OLD.stripe_subscription_id THEN NEW.estorno_exclusao_em:=NULL; END IF;
 RETURN NEW;
END; $$;
CREATE TRIGGER proteger_acesso_estornado BEFORE UPDATE ON public.assinaturas FOR EACH ROW EXECUTE FUNCTION public.proteger_acesso_estornado();
CREATE FUNCTION public.purgar_dados_conta(p_user_id uuid) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE v_id uuid; t record; v_tabelas text[]; v_restantes text[]; v_proximas text[]; v_nome text; v_existe boolean; v_avancou boolean;
BEGIN
 IF p_user_id IS NULL THEN RAISE EXCEPTION 'Conta invalida'; END IF;
 SELECT id INTO v_id FROM public.contas_exclusao WHERE user_id=p_user_id AND status='agendada' AND excluir_apos<=clock_timestamp() FOR UPDATE;
 IF v_id IS NULL THEN RAISE EXCEPTION 'Exclusao nao autorizada ou prazo nao vencido'; END IF;
 SELECT array_agg(c.relname ORDER BY c.relname) INTO v_tabelas FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace JOIN pg_attribute a ON a.attrelid=c.oid WHERE n.nspname='public' AND c.relkind IN ('r','p') AND a.attname='user_id' AND NOT a.attisdropped AND c.relname<>'contas_exclusao';
 -- Acquire every table lock before disabling triggers; other accounts cannot write while these transactional locks are held.
 FOREACH v_nome IN ARRAY COALESCE(v_tabelas,ARRAY[]::text[]) LOOP EXECUTE format('LOCK TABLE public.%I IN ACCESS EXCLUSIVE MODE',v_nome); END LOOP;
 FOREACH v_nome IN ARRAY COALESCE(v_tabelas,ARRAY[]::text[]) LOOP EXECUTE format('ALTER TABLE public.%I DISABLE TRIGGER USER',v_nome); END LOOP;
 v_restantes:=v_tabelas;
 WHILE COALESCE(cardinality(v_restantes),0)>0 LOOP
  v_proximas:=ARRAY[]::text[]; v_avancou:=false;
  FOREACH v_nome IN ARRAY v_restantes LOOP
   BEGIN
    EXECUTE format('DELETE FROM public.%I WHERE user_id=$1',v_nome) USING p_user_id;
    v_avancou:=true;
   EXCEPTION WHEN foreign_key_violation THEN v_proximas:=array_append(v_proximas,v_nome);
   END;
  END LOOP;
  IF NOT v_avancou THEN RAISE EXCEPTION 'Dependencias impedem exclusao completa'; END IF;
  v_restantes:=v_proximas;
 END LOOP;
 FOREACH v_nome IN ARRAY COALESCE(v_tabelas,ARRAY[]::text[]) LOOP
  EXECUTE format('SELECT EXISTS(SELECT 1 FROM public.%I WHERE user_id=$1)',v_nome) INTO v_existe USING p_user_id;
  IF v_existe THEN RAISE EXCEPTION 'Exclusao incompleta'; END IF;
  EXECUTE format('ALTER TABLE public.%I ENABLE TRIGGER USER',v_nome);
 END LOOP;
END; $$;
REVOKE ALL ON FUNCTION public.purgar_dados_conta(uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.purgar_dados_conta(uuid) TO service_role;