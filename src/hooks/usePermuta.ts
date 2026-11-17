import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useUserSettings } from './useUserSettings';
import { sanitizeDbError } from '@/lib/sanitizeError';
import { podeEditarPermuta, type LinhaPermuta } from '@/lib/permutaExtrato';
export function useExtratoPermuta(clientId?: string) {
  const { user } = useAuth();
  const { data: settings } = useUserSettings();
  return useQuery({
    queryKey: ['permuta-extrato', user?.id, clientId ?? 'todos'],
    enabled: Boolean(user && settings?.permuta_corte_em),
    queryFn: async (): Promise<LinhaPermuta[]> => {
      let query = supabase.from('permuta_extrato').select('*').order('date');
      if (clientId) query = query.eq('client_id', clientId);
      const { data, error } = await query;
      if (error) throw sanitizeDbError(error);
      return (data ?? []).map(l => ({ ...l, client_id: l.client_id ?? '', date: l.date ?? '', origem: l.origem ?? '', tipo: l.tipo ?? '', valor: Number(l.valor) }));
    },
  });
}
export interface SalvarPermuta { id?: string; clientId: string; tipo: 'fui_atendida' | 'ajuste'; date: string; descricao: string; valor: number }
export function useMutacoesPermuta() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const invalidar = () => { ['permuta-extrato', 'permuta-saldos', 'transactions', 'clients', 'revisao-permuta'].forEach(key => qc.invalidateQueries({ queryKey: [key] })); };
  const conferir = async () => {
    if (!user) throw new Error('Usuária não autenticada');
    const { data, error } = await supabase.from('user_settings').select('permuta_corte_em').eq('user_id', user.id).single();
    if (error) throw sanitizeDbError(error);
    if (!data.permuta_corte_em) throw new Error('Ative a conta corrente de permuta antes de lançar.');
    return user.id;
  };
  const salvar = useMutation({ mutationFn: async (l: SalvarPermuta) => {
    const userId = await conferir();
    if (!podeEditarPermuta(l.tipo) || !l.descricao.trim() || !Number.isFinite(l.valor) || !l.valor || (l.tipo === 'fui_atendida' && l.valor > 0)) throw new Error('Informe descrição e valor válidos.');
    const dados = { user_id: userId, client_id: l.clientId, tipo: l.tipo, date: l.date, descricao: l.descricao.trim(), valor: l.valor };
    const query = l.id ? supabase.from('permuta_lancamentos').update(dados).eq('id', l.id).in('tipo', ['fui_atendida', 'ajuste']) : supabase.from('permuta_lancamentos').insert(dados);
    const { data, error } = await query.select('id').single();
    if (error) throw sanitizeDbError(error);
    return data.id;
  }, onSuccess: invalidar });
  const excluir = useMutation({ mutationFn: async (id: string) => {
    await conferir();
    const { error } = await supabase.from('permuta_lancamentos').delete().eq('id', id).in('tipo', ['fui_atendida', 'ajuste']).select('id').single();
    if (error) throw sanitizeDbError(error);
  }, onSuccess: invalidar });
  const acerto = useMutation({ mutationFn: async (p: { clientId: string; date: string; valor: number; direcao: 'recebido' | 'pago'; accountId: string; categoryId: string; scope: 'empresa' | 'pessoal'; descricao: string }) => {
    await conferir();
    const { data, error } = await supabase.rpc('registrar_acerto_permuta', { p_client_id: p.clientId, p_date: p.date, p_valor: p.valor, p_direcao: p.direcao, p_account_id: p.accountId, p_category_id: p.categoryId, p_scope: p.scope, p_descricao: p.descricao });
    if (error) throw sanitizeDbError(error);
    return data;
  }, onSuccess: invalidar });
  return { salvar, excluir, acerto };
}
export function useAtivarPermuta() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: async (itens: { conta_legada_id: string; client_id: string | null; valor: number; appointment_ids: string[] }[]) => {
    const { data, error } = await supabase.rpc('ativar_conta_corrente_permuta', { p_itens: itens });
    if (error) throw sanitizeDbError(error);
    if (!data) throw new Error('Não foi possível confirmar a ativação.');
    return data;
  }, onSuccess: () => qc.invalidateQueries() });
}