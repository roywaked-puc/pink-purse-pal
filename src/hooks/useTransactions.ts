import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Transaction } from '@/types';
import { sanitizeDbError } from '@/lib/sanitizeError';

export function useTransactions() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['transactions', user?.id],
    queryFn: async (): Promise<Transaction[]> => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('date', { ascending: false });
      
      if (error) throw sanitizeDbError(error);
      
      return data.map(t => ({
        id: t.id,
        date: new Date(t.date),
        type: t.type as 'entrada' | 'saida',
        scope: t.scope as 'empresa' | 'pessoal',
        category: t.category,
        account: t.account,
        amount: Number(t.amount),
        grossAmount: t.gross_amount ? Number(t.gross_amount) : undefined,
        description: t.description || undefined,
        clientName: t.client_name || undefined,
        appointmentId: t.appointment_id || undefined,
        paymentType: t.payment_type as 'sinal' | 'pagamento' | undefined,
      }));
    },
    enabled: !!user,
  });
}

export function useAddTransaction() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (transaction: Omit<Transaction, 'id'>) => {
      if (!user) throw new Error('Not authenticated');
      
      const { error } = await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          date: transaction.date.toISOString(),
          type: transaction.type,
          scope: transaction.scope,
          category: transaction.category,
          account: transaction.account,
          amount: transaction.amount,
          gross_amount: transaction.grossAmount || null,
          description: transaction.description,
          client_name: transaction.clientName || null,
          appointment_id: transaction.appointmentId,
          payment_type: transaction.paymentType,
        });
      
      if (error) throw sanitizeDbError(error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });
}

export function useUpdateTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, transaction }: { id: string; transaction: Omit<Transaction, 'id'> }) => {
      const { error } = await supabase
        .from('transactions')
        .update({
          date: transaction.date.toISOString(),
          type: transaction.type,
          scope: transaction.scope,
          category: transaction.category,
          account: transaction.account,
          amount: transaction.amount,
          gross_amount: transaction.grossAmount || null,
          description: transaction.description,
          client_name: transaction.clientName || null,
          appointment_id: transaction.appointmentId,
          payment_type: transaction.paymentType,
        })
        .eq('id', id);
      
      if (error) throw sanitizeDbError(error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });
}

export function useDeleteTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id);
      
      if (error) throw sanitizeDbError(error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });
}
