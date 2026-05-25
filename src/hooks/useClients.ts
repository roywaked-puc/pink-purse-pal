import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Client } from '@/types';
import { sanitizeDbError } from '@/lib/sanitizeError';

export function useClients() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['clients', user?.id],
    queryFn: async (): Promise<Client[]> => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('name');

      if (error) throw sanitizeDbError(error);

      return data.map((c: any) => ({
        id: c.id,
        name: c.name,
        phone: c.phone,
        notes: c.notes || undefined,
        recurrenceDays: c.recurrence_days ?? undefined,
      }));
    },
    enabled: !!user,
  });
}

export function useAddClient() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (client: Omit<Client, 'id'>): Promise<string> => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('clients')
        .insert({
          user_id: user.id,
          name: client.name,
          phone: client.phone,
          notes: client.notes,
          recurrence_days: client.recurrenceDays ?? null,
        } as any)
        .select('id')
        .single();

      if (error) throw sanitizeDbError(error);
      return data.id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
  });
}

export function useUpdateClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, client }: { id: string; client: Omit<Client, 'id'> }) => {
      const { error } = await supabase
        .from('clients')
        .update({
          name: client.name,
          phone: client.phone,
          notes: client.notes,
          recurrence_days: client.recurrenceDays ?? null,
        } as any)
        .eq('id', id);

      if (error) throw sanitizeDbError(error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
  });
}

export function useDeleteClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', id);

      if (error) throw sanitizeDbError(error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
  });
}
