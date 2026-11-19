REVOKE ALL ON TABLE public.contas_exclusao FROM anon,authenticated;
GRANT SELECT ON TABLE public.contas_exclusao TO authenticated;
GRANT ALL ON TABLE public.contas_exclusao TO service_role;