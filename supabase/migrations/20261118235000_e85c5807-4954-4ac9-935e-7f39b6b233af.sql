-- =====================================================================
-- Exclusão de conta com prazo de 30 dias para desistir (LGPD / Termos §14)
--
-- Fluxo:
--   1. A usuária pede a exclusão (Edge Function `excluir-conta`, acao=solicitar):
--      cria uma linha 'agendada' com excluir_apos = now() + 30 dias, cancela a
--      renovação no Stripe (ou cancela + estorna se estiver nos 7 dias de
--      arrependimento). O app passa a mostrar só a tela "Conta em exclusão".
--   2. Dentro do prazo ela pode entrar e reativar (acao=reativar -> 'cancelada').
--   3. Depois do prazo, a Edge Function `purgar-contas-excluidas` (agendada,
--      protegida por segredo) apaga arquivos do Storage, chama
--      purgar_dados_conta() e por fim remove o usuário do Auth -> 'concluida'.
--
-- Guardrails: o "nunca apagar histórico" vale DENTRO de uma conta ativa. A
-- exclusão da conta inteira é um pedido explícito da titular (LGPD art. 18) e só
-- acontece depois do prazo de desistência. A anamnese assinada continua imutável
-- para qualquer caminho do app; só a purga, rodando como service_role, desliga os
-- triggers de congelamento dentro da própria transação.
--
-- Esta tabela é escrita apenas pelo backend (service_role). A usuária só lê a
-- própria linha, por isso authenticated recebe apenas SELECT (exceção consciente
-- ao modelo SELECT/INSERT/UPDATE/DELETE do CLAUDE.md §4.4).
-- =====================================================================

CREATE TABLE public.contas_exclusao (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,                 -- sem FK: a linha sobrevive à exclusão do auth.users
  email TEXT,                            -- apagado ao concluir
  status TEXT NOT NULL DEFAULT 'agendada' CHECK (status IN ('agendada', 'cancelada', 'concluida')),
  solicitado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  excluir_apos TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '30 days'),
  cancelada_em TIMESTAMPTZ,
  concluida_em TIMESTAMPTZ,
  stripe_customer_id TEXT,               -- mantido para registros de cobrança (prazo fiscal)
  reembolsado BOOLEAN NOT NULL DEFAULT false,
  ultimo_erro TEXT,                      -- erro sanitizado da última tentativa de purga
  CHECK (excluir_apos > solicitado_em)
);

CREATE UNIQUE INDEX contas_exclusao_uma_agendada ON public.contas_exclusao (user_id) WHERE status = 'agendada';
CREATE INDEX contas_exclusao_vencidas ON public.contas_exclusao (excluir_apos) WHERE status = 'agendada';

GRANT SELECT ON public.contas_exclusao TO authenticated;
GRANT ALL ON public.contas_exclusao TO service_role;
ALTER TABLE public.contas_exclusao ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ver propria exclusao" ON public.contas_exclusao FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- ---------------------------------------------------------------------
-- Estado da exclusão para o app (null quando não há exclusão agendada)
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.exclusao_conta_pendente()
RETURNS JSONB
LANGUAGE sql STABLE SECURITY INVOKER SET search_path = public AS $$
  SELECT jsonb_build_object('solicitado_em', solicitado_em, 'excluir_apos', excluir_apos, 'reembolsado', reembolsado)
  FROM public.contas_exclusao
  WHERE user_id = auth.uid() AND status = 'agendada'
  LIMIT 1;
$$;
REVOKE ALL ON FUNCTION public.exclusao_conta_pendente() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.exclusao_conta_pendente() TO authenticated;

-- ---------------------------------------------------------------------
-- Purga dos dados de uma conta (só service_role, só exclusão vencida)
--
-- Apaga, em todas as tabelas do schema public que têm coluna user_id, as linhas
-- da usuária. É genérica de propósito: tabelas novas entram automaticamente.
-- Triggers de usuário (congelamento de anamnese, divisão de caixa, proteção de
-- cliente com saldo de permuta etc.) são desligados só dentro desta transação,
-- porque a conta inteira está sendo removida. FKs continuam valendo; a ordem é
-- resolvida por tentativas. Se sobrar qualquer linha, tudo é desfeito.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.purgar_dados_conta(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  t TEXT;
  tabelas TEXT[];
  pendentes TEXT[];
  restantes TEXT[];
  passada INT := 0;
  sobra BIGINT;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.contas_exclusao
    WHERE user_id = p_user_id AND status = 'agendada' AND excluir_apos <= now()
  ) THEN
    RAISE EXCEPTION 'EXCLUSAO_NAO_VENCIDA';
  END IF;

  SELECT array_agg(c.relname::TEXT ORDER BY c.relname) INTO tabelas
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  JOIN pg_attribute a ON a.attrelid = c.oid AND a.attname = 'user_id' AND NOT a.attisdropped
  WHERE n.nspname = 'public' AND c.relkind IN ('r', 'p') AND c.relname <> 'contas_exclusao';

  IF tabelas IS NULL THEN RETURN; END IF;

  FOREACH t IN ARRAY tabelas LOOP
    EXECUTE format('ALTER TABLE public.%I DISABLE TRIGGER USER', t);
  END LOOP;

  pendentes := tabelas;
  WHILE array_length(pendentes, 1) > 0 AND passada < 15 LOOP
    passada := passada + 1;
    restantes := ARRAY[]::TEXT[];
    FOREACH t IN ARRAY pendentes LOOP
      BEGIN
        EXECUTE format('DELETE FROM public.%I WHERE user_id = $1', t) USING p_user_id;
      EXCEPTION WHEN foreign_key_violation THEN
        restantes := restantes || t;
      END;
    END LOOP;
    pendentes := restantes;
  END LOOP;

  FOREACH t IN ARRAY tabelas LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE TRIGGER USER', t);
  END LOOP;

  IF array_length(pendentes, 1) > 0 THEN
    RAISE EXCEPTION 'PURGA_INCOMPLETA: %', array_to_string(pendentes, ',');
  END IF;

  FOREACH t IN ARRAY tabelas LOOP
    EXECUTE format('SELECT count(*) FROM public.%I WHERE user_id = $1', t) INTO sobra USING p_user_id;
    IF sobra > 0 THEN RAISE EXCEPTION 'PURGA_INCOMPLETA: %', t; END IF;
  END LOOP;
END $$;

REVOKE ALL ON FUNCTION public.purgar_dados_conta(UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.purgar_dados_conta(UUID) TO service_role;
