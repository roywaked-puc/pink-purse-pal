import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Service } from '@/types';
import { sanitizeDbError } from '@/lib/sanitizeError';

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
      
      return data.map(s => ({
        id: s.id,
        description: s.description,
        amount: Number(s.amount),
        duration: s.duration,
        notes: s.notes || undefined,
        color: s.color || undefined,
        techniqueName: s.technique_name || undefined,
        tierType: s.tier_type || undefined,
        diasMin: s.dias_min ?? undefined,
        diasMax: s.dias_max ?? undefined,
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
      const { error } = await supabase
        .from('services')
        .update({
          description: service.description,
          amount: service.amount,
          duration: service.duration,
          notes: service.notes,
          color: service.color,
        })
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
