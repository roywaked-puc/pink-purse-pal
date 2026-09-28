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
      
      const validTier = (value: unknown): 'avulso' | 'colocacao' | 'manutencao' | undefined => {
        if (value === 'avulso' || value === 'colocacao' || value === 'manutencao') return value;
        return undefined;
      };

      return data.map(s => ({
        id: s.id,
        description: s.description,
        amount: Number(s.amount),
        duration: s.duration,
        notes: s.notes || undefined,
        color: s.color || undefined,
        techniqueName: s.technique_name || undefined,
        tierType: validTier(s.tier_type),
        diasMin: s.dias_min ?? undefined,
        diasMax: s.dias_max ?? undefined,
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
      const technique = input.techniqueName || input.description;
      const row = (f: (typeof calc)[number]) => ({
        description: faixaDescription(input.description, f.ate),
        amount: f.amount,
        duration: f.duration,
        color: input.color ?? null,
        servico_pai_id: parentId,
        manutencao_ate_dias: f.ate,
        technique_name: technique,
        tier_type: 'manutencao',
        dias_min: f.de,
        dias_max: f.ate,
      });

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
