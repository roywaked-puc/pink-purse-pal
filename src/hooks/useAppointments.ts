import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Appointment } from '@/types';
import { sanitizeDbError } from '@/lib/sanitizeError';
import { useGoogleCalendar, useSyncAppointment, useDeleteGoogleEvent } from '@/hooks/useGoogleCalendar';

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
        confirmationStatus: a.confirmation_status as 'pendente' | 'confirmado' | 'atendido' | 'cancelado',
        duration: a.duration,
        notes: a.notes || undefined,
        googleEventId: a.google_event_id || undefined,
      }));
    },
    enabled: !!user,
  });
}

export function useAddAppointment() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { isConnected } = useGoogleCalendar();
  const syncAppointment = useSyncAppointment();

  return useMutation({
    mutationFn: async (appointment: Omit<Appointment, 'id'>) => {
      if (!user) throw new Error('Not authenticated');
      
      const { data, error } = await supabase
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
        })
        .select()
        .single();
      
      if (error) throw sanitizeDbError(error);
      return data;
    },
    onSuccess: (newAppointment) => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      
      // Sincronizar apenas se Google Calendar estiver conectado
      if (isConnected && newAppointment) {
        syncAppointment.mutate({
          id: newAppointment.id,
          date: new Date(newAppointment.date),
          clientName: newAppointment.client_name,
          service: newAppointment.service,
          amount: Number(newAppointment.amount),
          paidAmount: Number(newAppointment.paid_amount),
          paymentStatus: newAppointment.payment_status as 'pago' | 'nao_pago' | 'sinal',
          confirmationStatus: newAppointment.confirmation_status as 'pendente' | 'confirmado' | 'atendido' | 'cancelado',
          duration: newAppointment.duration,
          notes: newAppointment.notes || undefined,
        });
      }
    },
  });
}

export function useUpdateAppointment() {
  const queryClient = useQueryClient();
  const { isConnected } = useGoogleCalendar();
  const syncAppointment = useSyncAppointment();

  return useMutation({
    mutationFn: async ({ id, appointment }: { id: string; appointment: Omit<Appointment, 'id'> }) => {
      // Buscar google_event_id antes de atualizar
      const { data: existing } = await supabase
        .from('appointments')
        .select('google_event_id')
        .eq('id', id)
        .single();

      const { data, error } = await supabase
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
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw sanitizeDbError(error);
      
      return { ...data, google_event_id: existing?.google_event_id || data.google_event_id };
    },
    onSuccess: (updatedAppointment) => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      
      // Sincronizar apenas se Google Calendar estiver conectado
      if (isConnected && updatedAppointment) {
        syncAppointment.mutate({
          id: updatedAppointment.id,
          date: new Date(updatedAppointment.date),
          clientName: updatedAppointment.client_name,
          service: updatedAppointment.service,
          amount: Number(updatedAppointment.amount),
          paidAmount: Number(updatedAppointment.paid_amount),
          paymentStatus: updatedAppointment.payment_status as 'pago' | 'nao_pago' | 'sinal',
          confirmationStatus: updatedAppointment.confirmation_status as 'pendente' | 'confirmado' | 'atendido' | 'cancelado',
          duration: updatedAppointment.duration,
          notes: updatedAppointment.notes || undefined,
          googleEventId: updatedAppointment.google_event_id || undefined,
        });
      }
    },
  });
}

export function useDeleteAppointment() {
  const queryClient = useQueryClient();
  const { isConnected } = useGoogleCalendar();
  const deleteGoogleEvent = useDeleteGoogleEvent();

  return useMutation({
    mutationFn: async (id: string) => {
      // Buscar google_event_id antes de deletar
      const { data: appointment } = await supabase
        .from('appointments')
        .select('google_event_id')
        .eq('id', id)
        .single();
      
      // Se conectado e tem evento no Google, deletar primeiro
      if (isConnected && appointment?.google_event_id) {
        try {
          await deleteGoogleEvent.mutateAsync(appointment.google_event_id);
        } catch (e) {
          console.error('Failed to delete Google event:', e);
        }
      }
      
      // Deletar localmente
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
        .update({ confirmation_status: status })
        .eq('id', id);
      
      if (error) throw sanitizeDbError(error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    },
  });
}
