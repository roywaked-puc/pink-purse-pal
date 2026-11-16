CREATE FUNCTION public.revisar_conta_corrente_permuta()
RETURNS jsonb LANGUAGE sql STABLE SECURITY INVOKER SET search_path=public AS $function$
SELECT jsonb_build_object(
 'corte',(SELECT permuta_corte_em FROM public.user_settings WHERE user_id=auth.uid()),
 'contas',COALESCE((SELECT jsonb_agg(jsonb_build_object(
  'conta_legada_id',a.id,'nome',a.name,
  'saldo_bruto',COALESCE(s.bruto,0),'saldo_liquido',COALESCE(s.liquido,0),
  'client_id_sugerido',COALESCE(f.client_id,n.id)) ORDER BY a.name,a.id)
 FROM public.accounts a
 LEFT JOIN LATERAL (SELECT SUM(l.valor_assinado_bruto) bruto,SUM(l.valor_assinado_liquido) liquido FROM public.permuta_transacoes_legadas l WHERE l.conta_legada_id=a.id) s ON true
 LEFT JOIN LATERAL (
  SELECT ap.client_id FROM public.permuta_transacoes_legadas l
  JOIN public.appointments ap ON ap.id=l.appointment_id AND ap.user_id=a.user_id
  JOIN public.clients c ON c.id=ap.client_id AND c.user_id=a.user_id
  WHERE l.conta_legada_id=a.id GROUP BY ap.client_id ORDER BY count(*) DESC,ap.client_id LIMIT 1
 ) f ON true
 LEFT JOIN LATERAL (SELECT c.id FROM public.clients c WHERE c.user_id=a.user_id AND c.name=a.name ORDER BY c.id LIMIT 1) n ON true
 WHERE a.user_id=auth.uid() AND a.type='permuta'),'[]'::jsonb),
 'atendimentos',COALESCE((SELECT jsonb_agg(jsonb_build_object('id',ap.id,'client_id',ap.client_id,'client_name',c.name,'date',ap.date,'amount',ap.amount) ORDER BY ap.date,ap.id)
 FROM public.appointments ap JOIN public.clients c ON c.id=ap.client_id AND c.user_id=ap.user_id
 WHERE ap.user_id=auth.uid() AND ap.is_permuta AND ap.confirmation_status='atendido' AND ap.date<now() AND ap.amount>0
 AND NOT EXISTS (SELECT 1 FROM public.permuta_transacoes_legadas l WHERE l.appointment_id=ap.id)),'[]'::jsonb)
);
$function$;
REVOKE ALL ON FUNCTION public.revisar_conta_corrente_permuta() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.revisar_conta_corrente_permuta() TO authenticated;

CREATE FUNCTION public.ativar_conta_corrente_permuta(p_itens jsonb)
RETURNS timestamptz LANGUAGE plpgsql SECURITY INVOKER SET search_path=public AS $function$
DECLARE
 v_usuario uuid:=auth.uid(); v_corte timestamptz; v_atual timestamptz;
 v_revisao jsonb; v_conta jsonb; v_item jsonb; v_ap jsonb;
 v_cliente uuid; v_saldo numeric; v_valor numeric; v_ids uuid[]:='{}';
 v_contas uuid[]:='{}'; v_id uuid; v_ap_id uuid; v_qtd integer;
BEGIN
 IF v_usuario IS NULL THEN RAISE EXCEPTION USING ERRCODE='42501',MESSAGE='Usuária não autenticada'; END IF;
 IF p_itens IS NULL OR jsonb_typeof(p_itens)<>'array' THEN RAISE EXCEPTION 'Revisão de permuta inválida'; END IF;
 INSERT INTO public.user_settings(user_id) VALUES(v_usuario) ON CONFLICT(user_id) DO NOTHING;
 SELECT permuta_corte_em INTO v_atual FROM public.user_settings WHERE user_id=v_usuario FOR UPDATE;
 IF v_atual IS NOT NULL THEN RAISE EXCEPTION 'Conta corrente de permuta já ativada'; END IF;
 -- Serialize activation with edits to the existing source rows. New concurrent rows are
 -- detected by the reviewed balances; use a single snapshot after acquiring the locks.
 PERFORM id FROM public.accounts WHERE user_id=v_usuario ORDER BY id FOR UPDATE;
 PERFORM id FROM public.transactions WHERE user_id=v_usuario ORDER BY id FOR UPDATE;
 PERFORM id FROM public.appointments WHERE user_id=v_usuario ORDER BY id FOR UPDATE;
 v_corte:=clock_timestamp();
 v_revisao:=public.revisar_conta_corrente_permuta();
 FOR v_item IN SELECT value FROM jsonb_array_elements(p_itens) LOOP
  v_id:=(v_item->>'conta_legada_id')::uuid;
  IF v_id IS NULL OR v_id=ANY(v_contas) OR NOT EXISTS (SELECT 1 FROM jsonb_array_elements(v_revisao->'contas') c WHERE (c->>'conta_legada_id')::uuid=v_id) THEN RAISE EXCEPTION 'Conta legada inválida ou repetida'; END IF;
  v_contas:=array_append(v_contas,v_id);
 END LOOP;
 FOR v_conta IN SELECT value FROM jsonb_array_elements(v_revisao->'contas') LOOP
  v_id:=(v_conta->>'conta_legada_id')::uuid;
  SELECT value INTO v_item FROM jsonb_array_elements(p_itens) WHERE (value->>'conta_legada_id')::uuid=v_id;
  v_saldo:=(v_conta->>'saldo_bruto')::numeric;
  IF v_item IS NULL THEN
   IF v_saldo<>0 THEN RAISE EXCEPTION 'Escolha uma cliente para cada conta com saldo'; END IF;
   CONTINUE;
  END IF;
  v_cliente:=NULLIF(v_item->>'client_id','')::uuid;
  IF v_cliente IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.clients WHERE id=v_cliente AND user_id=v_usuario) THEN RAISE EXCEPTION 'Cliente inválida'; END IF;
  IF v_item ? 'appointment_ids' AND jsonb_typeof(v_item->'appointment_ids')<>'array' THEN RAISE EXCEPTION 'Atendimentos da revisão inválidos'; END IF;
  FOR v_ap_id IN SELECT value::text::uuid FROM jsonb_array_elements_text(COALESCE(v_item->'appointment_ids','[]'::jsonb)) LOOP
   IF v_ap_id=ANY(v_ids) THEN RAISE EXCEPTION 'Atendimento repetido na revisão'; END IF;
   SELECT value INTO v_ap FROM jsonb_array_elements(v_revisao->'atendimentos') WHERE (value->>'id')::uuid=v_ap_id;
   IF v_ap IS NULL OR v_cliente IS NULL OR (v_ap->>'client_id')::uuid<>v_cliente THEN RAISE EXCEPTION 'Atendimento sem lançamento inválido para esta cliente'; END IF;
   v_ids:=array_append(v_ids,v_ap_id);
   v_saldo:=v_saldo+(v_ap->>'amount')::numeric;
  END LOOP;
  v_valor:=(v_item->>'valor')::numeric;
  IF v_valor IS NULL OR v_valor::text IN ('NaN','Infinity','-Infinity') OR v_valor IS DISTINCT FROM v_saldo THEN RAISE EXCEPTION 'Os saldos mudaram. Reabra e confira a revisão'; END IF;
  IF v_saldo<>0 AND v_cliente IS NULL THEN RAISE EXCEPTION 'Escolha uma cliente para cada conta com saldo'; END IF;
  IF v_saldo<>0 THEN
   INSERT INTO public.permuta_lancamentos(user_id,client_id,date,tipo,valor,conta_legada_id,descricao)
   VALUES(v_usuario,v_cliente,v_corte,'saldo_inicial',v_saldo,v_id,'Saldo migrado da conta '||(v_conta->>'nome'));
  END IF;
 END LOOP;
 UPDATE public.user_settings SET permuta_corte_em=v_corte WHERE user_id=v_usuario AND permuta_corte_em IS NULL;
 GET DIAGNOSTICS v_qtd=ROW_COUNT;
 IF v_qtd<>1 THEN RAISE EXCEPTION 'Não foi possível confirmar a ativação'; END IF;
 RETURN v_corte;
END;
$function$;
REVOKE ALL ON FUNCTION public.ativar_conta_corrente_permuta(jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.ativar_conta_corrente_permuta(jsonb) TO authenticated;