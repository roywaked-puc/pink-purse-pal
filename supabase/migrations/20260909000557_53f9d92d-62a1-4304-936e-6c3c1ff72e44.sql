CREATE OR REPLACE FUNCTION public.caixa_reserva_apply(p_appointment_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_app public.appointments%ROWTYPE;
  v_ativo boolean;
  v_valor numeric;
  v_inicio timestamptz;
  v_reserva numeric;
  v_rest numeric;
  r public.transactions%ROWTYPE;
  v_emp numeric;
  v_pes numeric;
BEGIN
  IF p_appointment_id IS NULL THEN
    RETURN;
  END IF;

  SELECT * INTO v_app FROM public.appointments WHERE id = p_appointment_id;
  IF NOT FOUND THEN
    RETURN;
  END IF;

  SELECT COALESCE(caixa_reserva_ativo, false), COALESCE(caixa_reserva_valor, 0), caixa_inicio_em
    INTO v_ativo, v_valor, v_inicio
    FROM public.user_settings
   WHERE user_id = v_app.user_id;

  IF NOT COALESCE(v_ativo, false) THEN
    RETURN;
  END IF;

  -- 1. Reverter divisão anterior (estado limpo)
  DELETE FROM public.transactions
   WHERE appointment_id = p_appointment_id
     AND is_caixa_reserva_split = true;

  UPDATE public.transactions
     SET scope = COALESCE(caixa_scope_original, scope),
         amount = COALESCE(caixa_amount_original, amount),
         caixa_scope_original = NULL,
         caixa_amount_original = NULL
   WHERE appointment_id = p_appointment_id
     AND (caixa_scope_original IS NOT NULL OR caixa_amount_original IS NOT NULL);

  -- 2. Casos em que nada deve ser dividido
  --    (inclui atendimentos anteriores ao início do controle de caixa)
  IF COALESCE(v_app.is_permuta, false)
     OR v_app.confirmation_status = 'cancelado'
     OR COALESCE(v_app.paid_amount, 0) <= 0
     OR (v_inicio IS NOT NULL AND v_app.date < v_inicio) THEN
    IF v_app.caixa_reserva_valor_aplicado IS NOT NULL THEN
      UPDATE public.appointments
         SET caixa_reserva_valor_aplicado = NULL
       WHERE id = p_appointment_id;
    END IF;
    RETURN;
  END IF;

  -- 3. Travar o valor de reserva no primeiro pagamento
  v_reserva := v_app.caixa_reserva_valor_aplicado;
  IF v_reserva IS NULL THEN
    v_reserva := v_valor;
    UPDATE public.appointments
       SET caixa_reserva_valor_aplicado = v_reserva
     WHERE id = p_appointment_id;
  END IF;

  -- 4. Divisão acumulada por agendamento
  v_rest := GREATEST(COALESCE(v_reserva, 0), 0);

  FOR r IN
    SELECT * FROM public.transactions
     WHERE appointment_id = p_appointment_id
       AND type = 'entrada'
       AND is_caixa_reserva_split = false
     ORDER BY created_at, id
  LOOP
    v_emp := LEAST(COALESCE(r.amount, 0), GREATEST(v_rest, 0));
    v_pes := COALESCE(r.amount, 0) - v_emp;
    v_rest := v_rest - v_emp;

    IF v_emp > 0 AND v_pes > 0 THEN
      UPDATE public.transactions
         SET caixa_scope_original = COALESCE(caixa_scope_original, scope),
             caixa_amount_original = COALESCE(caixa_amount_original, amount),
             scope = 'empresa',
             amount = v_emp
       WHERE id = r.id;

      INSERT INTO public.transactions (
        user_id, date, type, scope, category, category_id, account, account_id,
        amount, description, client_name, appointment_id, account_fee_type_id,
        payment_type, is_caixa_reserva_split
      ) VALUES (
        r.user_id, r.date, 'entrada', 'pessoal', r.category, r.category_id, r.account, r.account_id,
        v_pes,
        COALESCE(NULLIF(r.description, '') || ' · ', '') || 'Divisão automática de caixa',
        r.client_name, r.appointment_id, r.account_fee_type_id,
        r.payment_type, true
      );
    ELSIF v_emp > 0 THEN
      UPDATE public.transactions
         SET caixa_scope_original = COALESCE(caixa_scope_original, scope),
             scope = 'empresa'
       WHERE id = r.id;
    ELSE
      UPDATE public.transactions
         SET caixa_scope_original = COALESCE(caixa_scope_original, scope),
             scope = 'pessoal'
       WHERE id = r.id;
    END IF;
  END LOOP;
END;
$function$;