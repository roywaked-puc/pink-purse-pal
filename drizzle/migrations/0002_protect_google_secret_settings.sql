REVOKE SELECT (google_client_secret) ON public.user_settings FROM authenticated;

CREATE OR REPLACE FUNCTION public.google_calendar_secret_configured()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_settings WHERE user_id = auth.uid() AND google_client_secret IS NOT NULL);
$$;
REVOKE ALL ON FUNCTION public.google_calendar_secret_configured() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.google_calendar_secret_configured() TO authenticated;