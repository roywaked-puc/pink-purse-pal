import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { sanitizeDbError } from '@/lib/sanitizeError';
import type { ResumoAssinatura } from '@/types';

const resumo = z.object({ estado: z.enum(['isento', 'teste', 'pro', 'expirado']), teste_ate: z.string(), periodo_atual_fim: z.string().nullable(), periodicidade: z.enum(['mensal', 'anual']).nullable(), cancelar_no_fim_do_periodo: z.boolean(), status: z.string(), tem_customer: z.boolean() });
export function useAssinatura() {
  const { user } = useAuth();
  return useQuery({ queryKey: ['assinatura', user?.id], enabled: !!user, refetchInterval: 30000, refetchOnWindowFocus: true,
    queryFn: async (): Promise<ResumoAssinatura> => {
      const { data, error } = await supabase.rpc('resumo_assinatura');
      if (error) throw sanitizeDbError(error);
      return resumo.parse(data) as ResumoAssinatura;
    },
  });
}
export async function chamarFuncao<T = { url: string }>(nome: string, body: object, mensagemPadrao: string): Promise<T> {
  const { data, error } = await supabase.functions.invoke(nome, { body });
  if (error) {
    if ('context' in error && error.context instanceof Response) {
      const resposta = await error.context.json().catch(() => null);
      if (resposta?.error) throw new Error(resposta.error);
    }
    throw new Error(mensagemPadrao);
  }
  return data as T;
}
async function abrirPagamento(nome: string, body: object) {
  const data = await chamarFuncao(nome, body, 'Não foi possível abrir o pagamento. Tente novamente.');
  const url = new URL(data.url);
  if (url.protocol !== 'https:' || !['checkout.stripe.com', 'billing.stripe.com'].includes(url.hostname)) throw new Error('Endereço de pagamento inválido.');
  window.location.assign(url.href);
}
export function useAssinarPro() { return useMutation({ mutationFn: (periodicidade: 'mensal' | 'anual') => abrirPagamento('criar-checkout-assinatura', { periodicidade }) }); }
export function useGerenciarAssinatura() { return useMutation({ mutationFn: () => abrirPagamento('gerenciar-assinatura', {}) }); }
export function useCancelarAssinatura() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (acao: 'cancelar' | 'desfazer') => chamarFuncao<{ cancelar_no_fim_do_periodo: boolean }>('cancelar-assinatura', { acao }, 'Não foi possível atualizar sua assinatura. Tente novamente.'),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['assinatura'] }),
  });
}
