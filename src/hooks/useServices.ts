import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Service } from '@/types';
import { sanitizeDbError } from '@/lib/sanitizeError';
import { calcularFaixas, faixaDescription } from '@/lib/serviceFaixas';

export function useServices() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['services', user?.id],
    queryFn: async (): Promise<Service[]> => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .order('description');
      
      if (error) throw sanitizeDbError(error);
      

      // Técnica/tipo/faixa derivados das colunas estruturadas (possui_manutencao, servico_pai_id, manutencao_ate_dias)
      const byId = new Map(data.map(s => [s.id, s]));
      const techniqueOf = (desc: string) => desc.replace(/\s*-\s*coloca[cç][aã]o\s*$/i, '').replace(/\s+/g, ' ').trim();
      const deMap = new Map<string, number>();
      const byParent = new Map<string, typeof data>();
      data.forEach(s => {
        if (s.servico_pai_id && s.manutencao_ate_dias != null) {
          const list = byParent.get(s.servico_pai_id) || [];
          list.push(s);
          byParent.set(s.servico_pai_id, list);
        }
      });
      byParent.forEach(list => {
        let prev = 0;
        [...list].sort((a, b) => a.manutencao_ate_dias! - b.manutencao_ate_dias!).forEach(f => {
          deMap.set(f.id, prev + 1);
          prev = f.manutencao_ate_dias!;
        });
      });
      const derive = (s: (typeof data)[number]) => {
        const pai = s.servico_pai_id ? byId.get(s.servico_pai_id) : undefined;
        if (pai && s.manutencao_ate_dias != null) {
          return { techniqueName: techniqueOf(pai.description), tierType: 'manutencao' as const, diasMin: deMap.get(s.id), diasMax: s.manutencao_ate_dias };
        }
        if (!s.servico_pai_id && s.possui_manutencao) {
          return { techniqueName: techniqueOf(s.description), tierType: 'colocacao' as const, diasMin: undefined, diasMax: undefined };
        }
        return { techniqueName: s.technique_name || undefined, tierType: 'avulso' as const, diasMin: undefined, diasMax: undefined };
      };

      return data.map(s => ({
        id: s.id,
        description: s.description,
        amount: Number(s.amount),
        duration: s.duration,
        notes: s.notes || undefined,
        color: s.color || undefined,
        ...derive(s),
        possuiManutencao: !!s.possui_manutencao,
        servicoPaiId: s.servico_pai_id || undefined,
        manutencaoAteDias: s.manutencao_ate_dias ?? undefined,
      }));
    },
    enabled: !!user,
  });
}

export function useAddService() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (service: Omit<Service, 'id'>): Promise<string> => {
      if (!user) throw new Error('Not authenticated');
      
      const { data, error } = await supabase
        .from('services')
        .insert({
          user_id: user.id,
          description: service.description,
          amount: service.amount,
          duration: service.duration,
          notes: service.notes,
          color: service.color,
          possui_manutencao: service.possuiManutencao ?? false,
          servico_pai_id: service.servicoPaiId ?? null,
          manutencao_ate_dias: service.manutencaoAteDias ?? null,
        })
        .select('id')
        .single();
      
      if (error) throw sanitizeDbError(error);
      return data.id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
    },
  });
}

export function useUpdateService() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, service }: { id: string; service: Omit<Service, 'id'> }) => {
      const patch: Record<string, unknown> = {
        description: service.description,
        amount: service.amount,
        duration: service.duration,
        notes: service.notes ?? null,
        color: service.color ?? null,
      };
      if (service.possuiManutencao !== undefined) patch.possui_manutencao = service.possuiManutencao;
      if (service.servicoPaiId !== undefined) patch.servico_pai_id = service.servicoPaiId;
      if (service.manutencaoAteDias !== undefined) patch.manutencao_ate_dias = service.manutencaoAteDias;

      const { error } = await supabase
        .from('services')
        .update(patch)
        .eq('id', id);
      
      if (error) throw sanitizeDbError(error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
    },
  });
}

export function useDeleteService() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('services')
        .delete()
        .eq('id', id);
      
      if (error) throw sanitizeDbError(error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
    },
  });
}

export interface FaixaDraft {
  id?: string;
  ate: number;
  amount: number;
  duration: number;
  /** "até" já gravado no banco (para ordenar as atualizações) */
  ateOriginal?: number;
}

export interface SaveServiceInput {
  id?: string;
  description: string;
  amount: number;
  duration: number;
  notes?: string;
  color?: string;
  possuiManutencao: boolean;
  techniqueName?: string;
  faixas: FaixaDraft[];
  removeFaixaIds: string[];
}

interface PaiDaFaixa {
  id: string;
  description: string;
  color?: string | null;
  techniqueName?: string;
}

/** Monta a linha de `services` de uma faixa de manutenção (inclui campos legados). */
function linhaFaixa(pai: PaiDaFaixa, f: { de: number; ate: number; amount: number; duration: number }) {
  return {
    description: faixaDescription(pai.description, f.ate),
    amount: f.amount,
    duration: f.duration,
    color: pai.color ?? null,
    servico_pai_id: pai.id,
    manutencao_ate_dias: f.ate,
    technique_name: pai.techniqueName || pai.description,
    tier_type: 'manutencao',
    dias_min: f.de,
    dias_max: f.ate,
  };
}

/** Salva o serviço principal e depois suas faixas de manutenção. */
export function useSaveServiceWithFaixas() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: SaveServiceInput): Promise<string> => {
      if (!user) throw new Error('Not authenticated');
      const base = {
        description: input.description,
        amount: input.amount,
        duration: input.duration,
        notes: input.notes ?? null,
        color: input.color ?? null,
        possui_manutencao: input.possuiManutencao,
      };

      let parentId = input.id;
      if (parentId) {
        const { error } = await supabase.from('services').update(base).eq('id', parentId);
        if (error) throw sanitizeDbError(error);
      } else {
        const { data, error } = await supabase
          .from('services')
          .insert({
            ...base,
            user_id: user.id,
            ...(input.possuiManutencao
              ? { technique_name: input.description, tier_type: 'colocacao' }
              : {}),
          })
          .select('id')
          .single();
        if (error) throw sanitizeDbError(error);
        parentId = data.id;
      }

      const removeIds = input.possuiManutencao
        ? input.removeFaixaIds
        : [...input.removeFaixaIds, ...input.faixas.filter(f => f.id).map(f => f.id!)];
      if (removeIds.length) {
        const { error } = await supabase.from('services').delete().in('id', removeIds);
        if (error) throw sanitizeDbError(error);
      }
      if (!input.possuiManutencao) return parentId!;

      const calc = calcularFaixas(input.faixas);
      const pai = { id: parentId!, description: input.description, color: input.color, techniqueName: input.techniqueName };
      const row = (f: (typeof calc)[number]) => linhaFaixa(pai, f);

      // Evita colisão temporária do "até" único: reduções em ordem crescente, aumentos em ordem decrescente.
      const existing = calc.filter(f => f.id);
      const decreases = existing.filter(f => f.ate <= (f.ateOriginal ?? f.ate)).sort((a, b) => a.ate - b.ate);
      const increases = existing.filter(f => f.ate > (f.ateOriginal ?? f.ate)).sort((a, b) => b.ate - a.ate);
      for (const f of [...decreases, ...increases]) {
        const { error } = await supabase.from('services').update(row(f)).eq('id', f.id!);
        if (error) throw sanitizeDbError(error);
      }

      const novas = calc.filter(f => !f.id).map(f => ({ ...row(f), user_id: user.id }));
      if (novas.length) {
        const { error } = await supabase.from('services').insert(novas);
        if (error) throw sanitizeDbError(error);
      }
      return parentId!;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
    },
  });
}

// ---------------------------------------------------------------------------
// Replicar mudança de faixa nos outros serviços (cada operação grava numa única chamada)
// ---------------------------------------------------------------------------

type FaixaGravada = { id?: string; de: number; ate: number; amount: number; duration: number };

/** Quantos atendimentos (qualquer status) apontam para cada faixa. */
async function contarAtendimentosPorFaixa(ids: string[]): Promise<Record<string, number>> {
  const pares = await Promise.all(
    ids.map(async id => {
      const { count, error } = await supabase
        .from('appointments')
        .select('id', { count: 'exact', head: true })
        .eq('service_id', id);
      if (error) throw sanitizeDbError(error);
      return [id, count ?? 0] as const;
    }),
  );
  return Object.fromEntries(pares);
}

const chaveAtendimentosPorFaixa = (userId: string | undefined, ids: string[]) => ['atendimentos-por-faixa', userId, [...ids].sort()];

export function useAtendimentosPorFaixa(ids: string[], enabled = true) {
  const { user } = useAuth();
  return useQuery({
    queryKey: chaveAtendimentosPorFaixa(user?.id, ids),
    queryFn: () => contarAtendimentosPorFaixa(ids),
    enabled: !!user && enabled && ids.length > 0,
    staleTime: 0,
  });
}

/** Mesma contagem do "Em uso", sob demanda (ex.: antes de salvar a exclusão de faixas). */
export function useConsultarAtendimentosPorFaixa() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return (ids: string[]) =>
    queryClient.fetchQuery({ queryKey: chaveAtendimentosPorFaixa(user?.id, ids), queryFn: () => contarAtendimentosPorFaixa(ids), staleTime: 0 });
}

/** (a) Inclui uma faixa em vários serviços num único insert. Retorna os ids criados. */
export function useIncluirFaixaEmLote() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (itens: { pai: PaiDaFaixa; faixa: FaixaGravada }[]): Promise<string[]> => {
      if (!user) throw new Error('Not authenticated');
      const linhas = itens.map(i => ({ ...linhaFaixa(i.pai, i.faixa), user_id: user.id }));
      const { data, error } = await supabase.from('services').insert(linhas).select('id');
      if (error) throw sanitizeDbError(error);
      return data.map(d => d.id);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['services'] }),
  });
}

/** Desfaz a inclusão em lote: apaga só as faixas recém-criadas, se ainda sem atendimentos. */
export function useDesfazerInclusaoFaixa() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (ids: string[]) => {
      await garantirSemAtendimentos(ids);
      const { error } = await supabase.from('services').delete().in('id', ids);
      if (error) throw sanitizeDbError(error);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['services'] }),
  });
}

/**
 * (b) Altera o "Até" de uma faixa em vários serviços num único upsert (tudo-ou-nada),
 * regravando também a faixa seguinte, que passa a começar em fimNovo + 1.
 */
export function useAlterarLimiteEmLote() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (itens: { pai: PaiDaFaixa; faixa: FaixaGravada; seguinte?: FaixaGravada; fimNovo: number }[]) => {
      if (!user) throw new Error('Not authenticated');
      const linhas = itens.flatMap(i => [
        { id: i.faixa.id!, user_id: user.id, ...linhaFaixa(i.pai, { ...i.faixa, ate: i.fimNovo }) },
        ...(i.seguinte ? [{ id: i.seguinte.id!, user_id: user.id, ...linhaFaixa(i.pai, { ...i.seguinte, de: i.fimNovo + 1 }) }] : []),
      ]);
      const { error } = await supabase.from('services').upsert(linhas, { onConflict: 'id' });
      if (error) throw sanitizeDbError(error);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['services'] }),
  });
}

/**
 * (c) Exclui uma faixa de vários serviços num único delete (tudo-ou-nada). Nunca apaga
 * faixa com atendimento: confere de novo antes de excluir.
 */
export function useExcluirFaixaEmLote() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (itens: { pai: PaiDaFaixa; faixa: FaixaGravada; seguinte?: FaixaGravada }[]) => {
      if (!user) throw new Error('Not authenticated');
      const ids = itens.map(i => i.faixa.id!);
      await garantirSemAtendimentos(ids);
      const { error } = await supabase.from('services').delete().in('id', ids);
      if (error) throw sanitizeDbError(error);
      // Campos legados (dias_min) da faixa seguinte: ninguém os lê; atualiza como a edição individual faz.
      const seguintes = itens
        .filter(i => i.seguinte)
        .map(i => ({ id: i.seguinte!.id!, user_id: user.id, ...linhaFaixa(i.pai, { ...i.seguinte!, de: i.faixa.de }) }));
      if (seguintes.length) await supabase.from('services').upsert(seguintes, { onConflict: 'id' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      queryClient.invalidateQueries({ queryKey: ['atendimentos-por-faixa'] });
    },
  });
}

async function garantirSemAtendimentos(ids: string[]) {
  const { count, error } = await supabase
    .from('appointments')
    .select('id', { count: 'exact', head: true })
    .in('service_id', ids);
  if (error) throw sanitizeDbError(error);
  if ((count ?? 0) > 0) throw new Error('Uma das faixas passou a ter atendimentos e foi mantida. Feche e confira de novo.');
}
