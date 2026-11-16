ALTER TABLE public.user_settings ADD COLUMN permuta_corte_em timestamptz;
ALTER TABLE public.clients ADD COLUMN paga_permuta boolean NOT NULL DEFAULT false;
UPDATE public.clients SET paga_permuta = (conta_permuta_padrao_id IS NOT NULL);
COMMENT ON COLUMN public.clients.paga_permuta IS 'Preferência independente de permuta; usada pelo app após ativação da nova conta corrente.';
COMMENT ON COLUMN public.clients.conta_permuta_padrao_id IS 'Vínculo legado de conta permuta; preservado e usado pelo fluxo anterior à ativação.';
COMMENT ON COLUMN public.user_settings.permuta_corte_em IS 'NULL mantém o fluxo legado; data de ativação da conta corrente por cliente.';
GRANT SELECT (user_id, permuta_corte_em), INSERT (permuta_corte_em), UPDATE (permuta_corte_em) ON public.user_settings TO authenticated;
GRANT SELECT (paga_permuta), INSERT (paga_permuta), UPDATE (paga_permuta) ON public.clients TO authenticated;

CREATE VIEW public.permuta_transacoes_legadas WITH (security_invoker = true) AS
SELECT t.user_id, t.id AS transaction_id, a.id AS conta_legada_id, a.name AS conta_legada_nome,
 t.appointment_id, t.date, t.type, t.scope, t.category, t.description, t.amount, t.gross_amount,
 COALESCE(t.gross_amount,t.amount) AS valor_bruto,
 CASE WHEN t.type='entrada' THEN COALESCE(t.gross_amount,t.amount) ELSE -COALESCE(t.gross_amount,t.amount) END AS valor_assinado_bruto,
 CASE WHEN t.type='entrada' THEN t.amount ELSE -t.amount END AS valor_assinado_liquido
FROM public.transactions t JOIN public.accounts a ON a.user_id=t.user_id AND a.type='permuta'
 AND (t.account_id=a.id OR (t.account_id IS NULL AND (t.account=a.id::text OR t.account=a.name)))
WHERE t.user_id=(SELECT auth.uid());
GRANT SELECT ON public.permuta_transacoes_legadas TO authenticated, service_role;

CREATE TABLE public.permuta_lancamentos (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL,
 client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE RESTRICT,
 date timestamptz NOT NULL,
 tipo text NOT NULL CHECK (tipo IN ('fui_atendida','acerto_recebido','acerto_pago','saldo_inicial','ajuste')),
 valor numeric(12,2) NOT NULL CHECK (valor<>0), descricao text,
 transaction_id uuid REFERENCES public.transactions(id) ON DELETE RESTRICT,
 conta_legada_id uuid REFERENCES public.accounts(id) ON DELETE SET NULL,
 created_at timestamptz NOT NULL DEFAULT now(),
 CONSTRAINT permuta_sinal_ok CHECK ((tipo IN ('fui_atendida','acerto_recebido') AND valor<0) OR (tipo='acerto_pago' AND valor>0) OR tipo IN ('saldo_inicial','ajuste')),
 CONSTRAINT permuta_acerto_tem_transacao CHECK ((tipo IN ('acerto_recebido','acerto_pago'))=(transaction_id IS NOT NULL)),
 CONSTRAINT permuta_valor_finito CHECK (valor::text NOT IN ('NaN','Infinity','-Infinity'))
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.permuta_lancamentos TO authenticated;
GRANT ALL ON public.permuta_lancamentos TO service_role;
ALTER TABLE public.permuta_lancamentos ENABLE ROW LEVEL SECURITY;
CREATE POLICY permuta_lancamentos_ler ON public.permuta_lancamentos FOR SELECT TO authenticated USING (user_id=(SELECT auth.uid()));
CREATE POLICY permuta_lancamentos_inserir ON public.permuta_lancamentos FOR INSERT TO authenticated WITH CHECK (
 user_id=(SELECT auth.uid())
 AND EXISTS (SELECT 1 FROM public.clients c WHERE c.id=client_id AND c.user_id=(SELECT auth.uid()))
 AND (transaction_id IS NULL OR EXISTS (SELECT 1 FROM public.transactions t WHERE t.id=transaction_id AND t.user_id=(SELECT auth.uid())))
 AND (conta_legada_id IS NULL OR EXISTS (SELECT 1 FROM public.accounts a WHERE a.id=conta_legada_id AND a.user_id=(SELECT auth.uid()) AND a.type='permuta'))
);
CREATE POLICY permuta_lancamentos_atualizar ON public.permuta_lancamentos FOR UPDATE TO authenticated USING (user_id=(SELECT auth.uid())) WITH CHECK (
 user_id=(SELECT auth.uid())
 AND EXISTS (SELECT 1 FROM public.clients c WHERE c.id=client_id AND c.user_id=(SELECT auth.uid()))
 AND (transaction_id IS NULL OR EXISTS (SELECT 1 FROM public.transactions t WHERE t.id=transaction_id AND t.user_id=(SELECT auth.uid())))
 AND (conta_legada_id IS NULL OR EXISTS (SELECT 1 FROM public.accounts a WHERE a.id=conta_legada_id AND a.user_id=(SELECT auth.uid()) AND a.type='permuta'))
);
CREATE POLICY permuta_lancamentos_excluir ON public.permuta_lancamentos FOR DELETE TO authenticated USING (user_id=(SELECT auth.uid()));
CREATE INDEX permuta_lancamentos_usuario_cliente_data_idx ON public.permuta_lancamentos (user_id,client_id,date);
CREATE INDEX permuta_lancamentos_transacao_idx ON public.permuta_lancamentos (transaction_id) WHERE transaction_id IS NOT NULL;

CREATE VIEW public.permuta_extrato WITH (security_invoker = true) AS
SELECT ap.user_id,ap.client_id,ap.date,'agendamento'::text AS origem,'atendimento'::text AS tipo,
 ap.service AS descricao,ap.amount-COALESCE(recebimentos.total,0) AS valor,
 ap.id AS appointment_id,NULL::uuid AS permuta_lancamento_id
FROM public.appointments ap
JOIN public.clients c ON c.id=ap.client_id AND c.user_id=ap.user_id
JOIN public.user_settings us ON us.user_id=ap.user_id
LEFT JOIN LATERAL (
 SELECT SUM(COALESCE(t.gross_amount,t.amount)) AS total FROM public.transactions t
 WHERE t.user_id=ap.user_id AND t.appointment_id=ap.id AND t.type='entrada'
 AND NOT EXISTS (SELECT 1 FROM public.permuta_transacoes_legadas leg WHERE leg.user_id=t.user_id AND leg.transaction_id=t.id)
) recebimentos ON true
WHERE ap.user_id=(SELECT auth.uid()) AND ap.is_permuta=true AND ap.confirmation_status='atendido'
 AND ap.client_id IS NOT NULL AND us.permuta_corte_em IS NOT NULL AND ap.date>=us.permuta_corte_em
 AND NOT EXISTS (SELECT 1 FROM public.permuta_transacoes_legadas leg WHERE leg.user_id=ap.user_id AND leg.appointment_id=ap.id)
 AND ap.amount-COALESCE(recebimentos.total,0)>0
UNION ALL
SELECT l.user_id,l.client_id,l.date,'lancamento'::text,l.tipo,l.descricao,l.valor,NULL::uuid,l.id
FROM public.permuta_lancamentos l WHERE l.user_id=(SELECT auth.uid());
GRANT SELECT ON public.permuta_extrato TO authenticated, service_role;
CREATE VIEW public.permuta_saldos WITH (security_invoker = true) AS
SELECT e.user_id,e.client_id,c.name AS client_name,SUM(e.valor) AS saldo,MAX(e.date) AS ultimo_movimento,COUNT(*) AS qtd_lancamentos
FROM public.permuta_extrato e JOIN public.clients c ON c.id=e.client_id AND c.user_id=e.user_id
WHERE e.user_id=(SELECT auth.uid()) GROUP BY e.user_id,e.client_id,c.name;
GRANT SELECT ON public.permuta_saldos TO authenticated, service_role;

CREATE FUNCTION public.proteger_lancamento_permuta() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $function$
BEGIN
 IF OLD.tipo IN ('saldo_inicial','acerto_recebido','acerto_pago') THEN
  RAISE EXCEPTION 'Saldos iniciais e acertos de permuta não podem ser alterados ou excluídos';
 END IF;
 IF TG_OP='UPDATE' THEN
  IF NEW.tipo IN ('saldo_inicial','acerto_recebido','acerto_pago') THEN
   RAISE EXCEPTION 'Não é permitido trocar um lançamento para saldo inicial ou acerto de permuta';
  END IF;
  RETURN NEW;
 END IF;
 RETURN OLD;
END;
$function$;
CREATE TRIGGER proteger_lancamento_permuta BEFORE UPDATE OR DELETE ON public.permuta_lancamentos FOR EACH ROW EXECUTE FUNCTION public.proteger_lancamento_permuta();

CREATE FUNCTION public.proteger_transacao_acerto_permuta() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $function$
DECLARE v_categoria public.categories%ROWTYPE;
BEGIN
 IF EXISTS (SELECT 1 FROM public.permuta_lancamentos l WHERE l.transaction_id=OLD.id) THEN
  IF NEW.amount IS DISTINCT FROM OLD.amount OR NEW.gross_amount IS DISTINCT FROM OLD.gross_amount
   OR NEW.type IS DISTINCT FROM OLD.type OR NEW.date IS DISTINCT FROM OLD.date
   OR NEW.account_id IS DISTINCT FROM OLD.account_id OR NEW.account IS DISTINCT FROM OLD.account
   OR NEW.scope IS DISTINCT FROM OLD.scope OR NEW.appointment_id IS DISTINCT FROM OLD.appointment_id THEN
   RAISE EXCEPTION 'Este lançamento é um acerto de permuta e não pode ser alterado aqui.';
  END IF;
  IF NEW.category_id IS DISTINCT FROM OLD.category_id OR NEW.category IS DISTINCT FROM OLD.category THEN
   SELECT * INTO v_categoria FROM public.categories c WHERE c.id=NEW.category_id AND c.user_id=NEW.user_id;
   IF NOT FOUND THEN RAISE EXCEPTION 'Categoria inválida'; END IF;
   IF v_categoria.type IS DISTINCT FROM NEW.type OR v_categoria.scope IS DISTINCT FROM NEW.scope OR v_categoria.name IS DISTINCT FROM NEW.category THEN
    RAISE EXCEPTION 'A categoria deve corresponder ao tipo e escopo do acerto';
   END IF;
  END IF;
 END IF;
 RETURN NEW;
END;
$function$;
CREATE TRIGGER proteger_transacao_acerto_permuta BEFORE UPDATE ON public.transactions FOR EACH ROW EXECUTE FUNCTION public.proteger_transacao_acerto_permuta();

CREATE FUNCTION public.registrar_acerto_permuta(p_client_id uuid,p_date timestamptz,p_valor numeric,p_direcao text,p_account_id uuid,p_category_id uuid,p_scope text,p_descricao text)
RETURNS TABLE (transaction_id uuid,permuta_lancamento_id uuid) LANGUAGE plpgsql SECURITY INVOKER SET search_path=public AS $function$
DECLARE
 v_usuario uuid:=auth.uid(); v_cliente public.clients%ROWTYPE; v_conta public.accounts%ROWTYPE;
 v_categoria public.categories%ROWTYPE; v_tipo text; v_descricao text; v_transacao uuid; v_lancamento uuid;
BEGIN
 IF v_usuario IS NULL THEN RAISE EXCEPTION USING ERRCODE='42501',MESSAGE='Usuária não autenticada'; END IF;
 IF p_valor IS NULL OR p_valor<=0 OR p_valor::text IN ('NaN','Infinity','-Infinity') OR p_valor<>round(p_valor,2) THEN
  RAISE EXCEPTION 'Informe um valor positivo com até duas casas decimais'; END IF;
 IF p_date IS NULL THEN RAISE EXCEPTION 'Informe a data do acerto'; END IF;
 IF p_direcao IS NULL OR p_direcao NOT IN ('recebido','pago') THEN RAISE EXCEPTION 'Direção do acerto inválida'; END IF;
 IF p_scope IS NULL OR p_scope NOT IN ('empresa','pessoal') THEN RAISE EXCEPTION 'Escolha o escopo empresa ou pessoal'; END IF;
 SELECT * INTO v_cliente FROM public.clients WHERE id=p_client_id AND user_id=v_usuario;
 IF NOT FOUND THEN RAISE EXCEPTION 'Cliente inválida'; END IF;
 SELECT * INTO v_conta FROM public.accounts WHERE id=p_account_id AND user_id=v_usuario;
 IF NOT FOUND THEN RAISE EXCEPTION 'Conta inválida'; END IF;
 IF v_conta.type='permuta' THEN RAISE EXCEPTION 'Escolha uma conta real para o acerto em dinheiro'; END IF;
 IF v_conta.type='maquininha' THEN RAISE EXCEPTION 'Use uma conta sem taxa para o acerto'; END IF;
 v_tipo:=CASE WHEN p_direcao='recebido' THEN 'entrada' ELSE 'saida' END;
 SELECT * INTO v_categoria FROM public.categories WHERE id=p_category_id AND user_id=v_usuario;
 IF NOT FOUND THEN RAISE EXCEPTION 'Categoria inválida'; END IF;
 IF v_categoria.type<>v_tipo OR v_categoria.scope<>p_scope THEN RAISE EXCEPTION 'A categoria deve corresponder ao tipo e escopo do acerto'; END IF;
 v_descricao:=COALESCE(NULLIF(btrim(p_descricao),''),'Acerto de permuta — '||v_cliente.name);
 INSERT INTO public.transactions (user_id,date,type,scope,category,category_id,account,account_id,amount,client_name,appointment_id,description)
 VALUES (v_usuario,p_date,v_tipo,p_scope,v_categoria.name,v_categoria.id,v_conta.name,v_conta.id,p_valor,v_cliente.name,NULL,v_descricao)
 RETURNING id INTO v_transacao;
 INSERT INTO public.permuta_lancamentos (user_id,client_id,date,tipo,valor,descricao,transaction_id)
 VALUES (v_usuario,v_cliente.id,p_date,CASE WHEN p_direcao='recebido' THEN 'acerto_recebido' ELSE 'acerto_pago' END,
 CASE WHEN p_direcao='recebido' THEN -p_valor ELSE p_valor END,v_descricao,v_transacao) RETURNING id INTO v_lancamento;
 RETURN QUERY SELECT v_transacao,v_lancamento;
END;
$function$;
REVOKE ALL ON FUNCTION public.registrar_acerto_permuta(uuid,timestamptz,numeric,text,uuid,uuid,text,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.registrar_acerto_permuta(uuid,timestamptz,numeric,text,uuid,uuid,text,text) TO authenticated;