import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { sanitizeDbError } from '@/lib/sanitizeError';
import { listarLembretesConfirmacao } from '@/lib/lembretesConfirmacao';
import type { Appointment } from '@/types';

export function useLembretesConfirmacao(agendamentos: Appointment[], dias = 3, horasAviso = 48, agora = new Date()) {
  return listarLembretesConfirmacao(agendamentos, dias, horasAviso, agora);
}

export function useMarcarLembreteEnviado() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error('Entre na sua conta para enviar o lembrete');
      const { data, error } = await supabase.from('appointments')
        .update({ confirmation_sent_at: new Date().toISOString() })
        .eq('id', id).eq('user_id', user.id).select('id, confirmation_sent_at').single();
      if (error) throw sanitizeDbError(error);
      return data;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['appointments'] }); },
  });
}