import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { sanitizeDbError } from '@/lib/sanitizeError';
import { chamarFuncao } from '@/hooks/useAssinatura';
import type { ExclusaoConta } from '@/types';

const exclusao = z.object({ solicitado_em: z.string(), excluir_apos: z.string(), reembolsado: z.boolean() }).nullable();
// A RPC é nova: até o Lovable regenerar src/integrations/supabase/types.ts ela não aparece nos tipos.
type RpcSemTipo = (this: typeof supabase, fn: string) => PromiseLike<{ data: unknown; error: Parameters<typeof sanitizeDbError>[0] | null }>;
const rpcExclusao = supabase.rpc as unknown as RpcSemTipo;

/** Exclusão de conta agendada (null quando a conta está ativa). */
export function useExclusaoConta() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['exclusao-conta', user?.id], enabled: !!user, staleTime: 60000, retry: 1,
    queryFn: async (): Promise<ExclusaoConta | null> => {
      const { data, error } = await rpcExclusao.call(supabase, 'exclusao_conta_pendente');
      if (error) throw sanitizeDbError(error);
      return exclusao.parse(data ?? null) as ExclusaoConta | null;
    },
  });
}

export function useSolicitarExclusaoConta() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => chamarFuncao<{ excluir_apos: string; reembolsado: boolean }>('excluir-conta', { acao: 'solicitar', confirmacao: 'EXCLUIR' }, 'Não foi possível concluir o pedido. Nada foi excluído. Tente novamente.'),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['exclusao-conta'] }),
  });
}

export function useReativarConta() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => chamarFuncao<{ reativada: boolean }>('excluir-conta', { acao: 'reativar' }, 'Não foi possível reativar a conta. Tente novamente.'),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['exclusao-conta'] });
      void queryClient.invalidateQueries({ queryKey: ['assinatura'] });
    },
  });
}
