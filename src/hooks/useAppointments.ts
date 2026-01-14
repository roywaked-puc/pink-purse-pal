import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Appointment } from '@/types';
import { sanitizeDbError } from '@/lib/sanitizeError';

export function useAppointments() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['appointments', user?.id],
    queryFn: async (): Promise<Appointment[]> => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .order('date', { ascending: true });
      
      if (error) throw sanitizeDbError(error);
      
      return data.map(a => ({
        id: a.id,
        date: new Date(a.date),
        clientId: a.client_id || undefined,
        clientName: a.client_name,
        serviceId: a.service_id || undefined,
        service: a.service,
        amount: Number(a.amount),
        paidAmount: Number(a.paid_amount),
        paymentStatus: a.payment_status as 'pago' | 'nao_pago' | 'sinal',
        confirmationStatus: (a as any).confirmation_status as 'pendente' | 'confirmado' | 'atendido' | 'cancelado',
        duration: a.duration,
        notes: a.notes || undefined,
      }));
    },
    enabled: !!user,
  });
}

export function useAddAppointment() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (appointment: Omit<Appointment, 'id'>) => {
      if (!user) throw new Error('Not authenticated');
      
      const { error } = await supabase
        .from('appointments')
        .insert({
          user_id: user.id,
          date: appointment.date.toISOString(),
          client_id: appointment.clientId,
          client_name: appointment.clientName,
          service_id: appointment.serviceId,
          service: appointment.service,
          amount: appointment.amount,
          paid_amount: appointment.paidAmount,
          payment_status: appointment.paymentStatus,
          confirmation_status: appointment.confirmationStatus,
          duration: appointment.duration,
          notes: appointment.notes,
        } as any);
      
      if (error) throw sanitizeDbError(error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    },
  });
}

export function useUpdateAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, appointment }: { id: string; appointment: Omit<Appointment, 'id'> }) => {
      const { error } = await supabase
        .from('appointments')
        .update({
          date: appointment.date.toISOString(),
          client_id: appointment.clientId,
          client_name: appointment.clientName,
          service_id: appointment.serviceId,
          service: appointment.service,
          amount: appointment.amount,
          paid_amount: appointment.paidAmount,
          payment_status: appointment.paymentStatus,
          confirmation_status: appointment.confirmationStatus,
          duration: appointment.duration,
          notes: appointment.notes,
        } as any)
        .eq('id', id);
      
      if (error) throw sanitizeDbError(error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    },
  });
}

export function useDeleteAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('appointments')
        .delete()
        .eq('id', id);
      
      if (error) throw sanitizeDbError(error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    },
  });
}

export function useUpdateAppointmentPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, paidAmount }: { id: string; paidAmount: number }) => {
      // First get current appointment data
      const { data: current, error: fetchError } = await supabase
        .from('appointments')
        .select('paid_amount, amount')
        .eq('id', id)
        .single();
      
      if (fetchError) throw sanitizeDbError(fetchError);
      
      const newPaidAmount = Number(current.paid_amount) + paidAmount;
      let newStatus: 'nao_pago' | 'sinal' | 'pago' = 'nao_pago';
      
      if (newPaidAmount >= Number(current.amount)) {
        newStatus = 'pago';
      } else if (newPaidAmount > 0) {
        newStatus = 'sinal';
      }
      
      const { error } = await supabase
        .from('appointments')
        .update({
          paid_amount: newPaidAmount,
          payment_status: newStatus,
        })
        .eq('id', id);
      
      if (error) throw sanitizeDbError(error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    },
  });
}

export function useSubtractAppointmentPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, amount }: { id: string; amount: number }) => {
      // First get current appointment data
      const { data: current, error: fetchError } = await supabase
        .from('appointments')
        .select('paid_amount, amount')
        .eq('id', id)
        .single();
      
      if (fetchError) throw sanitizeDbError(fetchError);
      
      // Subtract the amount (minimum 0)
      const newPaidAmount = Math.max(0, Number(current.paid_amount) - amount);
      
      // Recalculate status
      let newStatus: 'nao_pago' | 'sinal' | 'pago' = 'nao_pago';
      if (newPaidAmount >= Number(current.amount)) {
        newStatus = 'pago';
      } else if (newPaidAmount > 0) {
        newStatus = 'sinal';
      }
      
      const { error } = await supabase
        .from('appointments')
        .update({
          paid_amount: newPaidAmount,
          payment_status: newStatus,
        })
        .eq('id', id);
      
      if (error) throw sanitizeDbError(error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    },
  });
}

export function useUpdateConfirmationStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'pendente' | 'confirmado' | 'atendido' | 'cancelado' }) => {
      const { error } = await supabase
        .from('appointments')
        .update({ confirmation_status: status } as any)
        .eq('id', id);
      
      if (error) throw sanitizeDbError(error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    },
  });
}
