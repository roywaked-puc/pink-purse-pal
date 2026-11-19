import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { ExclusaoContaPendente } from '@/types';
const pendente = z.object({ solicitado_em:z.string(), excluir_apos:z.string(), reembolsado:z.boolean() });
export function useExclusaoConta() {
  const { user } = useAuth();
  return useQuery({ queryKey:['exclusao-conta',user?.id], enabled:!!user, staleTime:0, refetchOnWindowFocus:true, retry:1,
    queryFn:async (): Promise<ExclusaoContaPendente | null> => {
      const { data,error } = await supabase.rpc('exclusao_conta_pendente');
      if (error) throw new Error('Não foi possível consultar a exclusão.');
      return data === null ? null : pendente.parse(data) as ExclusaoContaPendente;
    },
  });
}
export async function executarAcaoConta(nome: string, body: object) {
  const { data,error } = await supabase.functions.invoke(nome,{ body });
  if (error) {
    if ('context' in error && error.context instanceof Response) {
      const resposta = await error.context.json().catch(() => null);
      if (typeof resposta?.error === 'string') throw new Error(resposta.error);
    }
    throw new Error('Não foi possível concluir. Tente novamente.');
  }
  return data;
}
export function useAlterarExclusaoConta() {
  const client = useQueryClient();
  const { user } = useAuth();
  return useMutation({ mutationFn:(acao:'solicitar'|'reativar') => executarAcaoConta('excluir-conta',acao === 'solicitar' ? { acao,confirmacao:'EXCLUIR' } : { acao }),
    onSuccess:async () => {
      await Promise.all([client.invalidateQueries({ queryKey:['exclusao-conta',user?.id] }),client.invalidateQueries({ queryKey:['assinatura',user?.id] })]);
    },
  });
}
