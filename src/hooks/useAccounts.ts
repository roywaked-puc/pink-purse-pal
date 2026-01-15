import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Account } from '@/types';
import { sanitizeDbError } from '@/lib/sanitizeError';

export function useAccounts() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['accounts', user?.id],
    queryFn: async (): Promise<Account[]> => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('accounts')
        .select('*')
        .order('name');
      
      if (error) throw sanitizeDbError(error);
      
      return data.map(a => ({
        id: a.id,
        name: a.name,
        type: a.type as 'dinheiro' | 'banco' | 'maquininha',
        feePercentage: a.fee_percentage || 0,
      }));
    },
    enabled: !!user,
  });
}

export function useAddAccount() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (account: Omit<Account, 'id'>) => {
      if (!user) throw new Error('Not authenticated');
      
      const { error } = await supabase
        .from('accounts')
        .insert({
          user_id: user.id,
          name: account.name,
          type: account.type,
          fee_percentage: account.feePercentage || 0,
        });
      
      if (error) throw sanitizeDbError(error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    },
  });
}

export function useUpdateAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, account }: { id: string; account: Omit<Account, 'id'> }) => {
      const { error } = await supabase
        .from('accounts')
        .update({
          name: account.name,
          type: account.type,
          fee_percentage: account.feePercentage || 0,
        })
        .eq('id', id);
      
      if (error) throw sanitizeDbError(error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    },
  });
}

export function useDeleteAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('accounts')
        .delete()
        .eq('id', id);
      
      if (error) throw sanitizeDbError(error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    },
  });
}
