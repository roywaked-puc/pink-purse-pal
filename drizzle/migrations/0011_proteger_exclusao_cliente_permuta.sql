CREATE FUNCTION public.proteger_exclusao_cliente_permuta() RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path=public AS $function$
DECLARE v_saldo numeric;
BEGIN
 SELECT COALESCE(SUM(valor),0) INTO v_saldo FROM public.permuta_extrato WHERE client_id=OLD.id AND user_id=OLD.user_id;
 IF v_saldo<>0 THEN RAISE EXCEPTION USING ERRCODE='P0011',MESSAGE='CLIENTE_SALDO_PERMUTA'; END IF;
 RETURN OLD;
END;
$function$;
CREATE TRIGGER proteger_exclusao_cliente_permuta BEFORE DELETE ON public.clients FOR EACH ROW EXECUTE FUNCTION public.proteger_exclusao_cliente_permuta();