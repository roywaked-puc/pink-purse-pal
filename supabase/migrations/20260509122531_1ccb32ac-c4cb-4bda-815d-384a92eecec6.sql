REVOKE SELECT (google_access_token, google_refresh_token) ON public.user_settings FROM authenticated;
REVOKE SELECT (google_access_token, google_refresh_token) ON public.user_settings FROM anon;