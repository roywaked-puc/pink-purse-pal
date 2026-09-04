REVOKE ALL ON FUNCTION public.caixa_reserva_apply(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.caixa_reserva_tx_trigger() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.caixa_reserva_appointment_trigger() FROM PUBLIC, anon, authenticated;