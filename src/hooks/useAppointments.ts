import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Appointment, ConfirmationStatus } from '@/types';
import { sanitizeDbError } from '@/lib/sanitizeError';

// Helper function to check if Google Calendar is connected
async function checkGoogleCalendarConnected(userId: string): Promise<boolean> {
  const { data } = await supabase
    .from('user_settings')
    .select('google_calendar_enabled')
    .eq('user_id', userId)
    .single();
  
  return !!data?.google_calendar_enabled;
}

// Helper function to sync appointment to Google Calendar
async function syncToGoogleCalendar(appointment: {
  id: string;
  date: string;
  clientName: string;
  service: string;
  amount: number;
  duration: number;
  notes?: string;
  googleEventId?: string;
  serviceColor?: string;
  confirmationStatus?: string;
}): Promise<string | null> {
  try {
    const { data, error } = await supabase.functions.invoke('google-calendar', {
      body: {
        action: 'sync-appointment',
        appointment: {
          id: appointment.id,
          date: appointment.date,
          clientName: appointment.clientName,
          service: appointment.service,
          amount: appointment.amount,
          duration: appointment.duration,
          notes: appointment.notes,
          googleEventId: appointment.googleEventId,
          serviceColor: appointment.serviceColor,
          confirmationStatus: appointment.confirmationStatus,
        },
      },
    });

    if (error) {
      console.error('Failed to sync to Google Calendar:', error);
      return null;
    }

    return data?.eventId || null;
  } catch (e) {
    console.error('Failed to sync to Google Calendar:', e);
    return null;
  }
}

// Helper function to delete event from Google Calendar
async function deleteFromGoogleCalendar(eventId: string): Promise<void> {
  try {
    await supabase.functions.invoke('google-calendar', {
      body: {
        action: 'delete-event',
        eventId,
      },
    });
  } catch (e) {
    console.error('Failed to delete from Google Calendar:', e);
  }
}

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
        confirmationStatus: a.confirmation_status as ConfirmationStatus,
        duration: a.duration,
        notes: a.notes || undefined,
        googleEventId: a.google_event_id || undefined,
        parentAppointmentId: (a as any).parent_appointment_id || undefined,
        isPermuta: Boolean((a as any).is_permuta) || false,
        caixaReservaValorAplicado: (a as any).caixa_reserva_valor_aplicado != null ? Number((a as any).caixa_reserva_valor_aplicado) : undefined,
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
          parent_appointment_id: appointment.parentAppointmentId,
          is_permuta: appointment.isPermuta ?? false,
        })
        .select()
        .single();
      
      if (error) throw sanitizeDbError(error);
      
      // Check if Google Calendar is connected and sync
      const isConnected = await checkGoogleCalendarConnected(user.id);
      if (isConnected) {
        // Fetch service color if service_id exists
        let serviceColor: string | undefined;
        if (data.service_id) {
          const { data: serviceData } = await supabase
            .from('services')
            .select('color')
            .eq('id', data.service_id)
            .single();
          serviceColor = serviceData?.color || undefined;
        }

        const eventId = await syncToGoogleCalendar({
          id: data.id,
          date: data.date,
          clientName: data.client_name,
          service: data.service,
          amount: Number(data.amount),
          duration: data.duration,
          notes: data.notes || undefined,
          serviceColor,
          confirmationStatus: data.confirmation_status,
        });
        
        // Update appointment with Google Event ID if created and await completion
        if (eventId) {
          const { data: updated } = await supabase
            .from('appointments')
            .update({ google_event_id: eventId })
            .eq('id', data.id)
            .select()
            .single();
          if (updated) return updated;
        }
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    },
  });
}

export function useUpdateAppointment() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ id, appointment }: { id: string; appointment: Omit<Appointment, 'id'> }) => {
      if (!user) throw new Error('Not authenticated');
      
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
          parent_appointment_id: appointment.parentAppointmentId,
          is_permuta: appointment.isPermuta ?? false,
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw sanitizeDbError(error);
      
      // Check if Google Calendar is connected and sync
      const isConnected = await checkGoogleCalendarConnected(user.id);
      if (isConnected) {
        // Re-fetch google_event_id right before sync to get the most up-to-date value
        const { data: freshData } = await supabase
          .from('appointments')
          .select('google_event_id')
          .eq('id', id)
          .single();

        // Fetch service color if service_id exists
        let serviceColor: string | undefined;
        if (data.service_id) {
          const { data: serviceData } = await supabase
            .from('services')
            .select('color')
            .eq('id', data.service_id)
            .single();
          serviceColor = serviceData?.color || undefined;
        }

        const eventId = await syncToGoogleCalendar({
          id: data.id,
          date: data.date,
          clientName: data.client_name,
          service: data.service,
          amount: Number(data.amount),
          duration: data.duration,
          notes: data.notes || undefined,
          googleEventId: freshData?.google_event_id || undefined,
          serviceColor,
          confirmationStatus: data.confirmation_status,
        });
        
        // Update appointment with Google Event ID if changed
        if (eventId && eventId !== freshData?.google_event_id) {
          await supabase
            .from('appointments')
            .update({ google_event_id: eventId })
            .eq('id', data.id);
        }
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    },
  });
}

export function useDeleteAppointment() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error('Not authenticated');
      
      // Get google_event_id before deleting
      const { data: appointment } = await supabase
        .from('appointments')
        .select('google_event_id')
        .eq('id', id)
        .single();
      
      // If connected and has Google event, delete from Google first
      if (appointment?.google_event_id) {
        const isConnected = await checkGoogleCalendarConnected(user.id);
        if (isConnected) {
          await deleteFromGoogleCalendar(appointment.google_event_id);
        }
      }
      
      // Delete locally
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
    mutationFn: async ({ id, paidAmount, mode = 'add' }: { id: string; paidAmount: number; mode?: 'add' | 'set' }) => {
      const { data: current, error: fetchError } = await supabase
        .from('appointments')
        .select('paid_amount, amount')
        .eq('id', id)
        .single();
      
      if (fetchError) throw sanitizeDbError(fetchError);
      
      const newPaidAmount = mode === 'set'
        ? paidAmount
        : Number(current.paid_amount) + paidAmount;
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
      const { data: current, error: fetchError } = await supabase
        .from('appointments')
        .select('paid_amount, amount')
        .eq('id', id)
        .single();
      
      if (fetchError) throw sanitizeDbError(fetchError);
      
      const newPaidAmount = Math.max(0, Number(current.paid_amount) - amount);
      
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
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: ConfirmationStatus }) => {
      if (!user) throw new Error('Not authenticated');
      
      // 1. Update status in database
      const { error } = await supabase
        .from('appointments')
        .update({ confirmation_status: status })
        .eq('id', id);
      
      if (error) throw sanitizeDbError(error);
      
      // 2. Fetch complete appointment data for sync
      const { data: appointment } = await supabase
        .from('appointments')
        .select('*')
        .eq('id', id)
        .single();
      
      if (!appointment) return;
      
      // 3. Check if Google Calendar is connected
      const isConnected = await checkGoogleCalendarConnected(user.id);
      
      // 4. If connected and has event, sync to update title with status prefix
      if (isConnected && appointment.google_event_id) {
        let serviceColor: string | undefined;
        if (appointment.service_id) {
          const { data: serviceData } = await supabase
            .from('services')
            .select('color')
            .eq('id', appointment.service_id)
            .single();
          serviceColor = serviceData?.color || undefined;
        }

        await syncToGoogleCalendar({
          id: appointment.id,
          date: appointment.date,
          clientName: appointment.client_name,
          service: appointment.service,
          amount: Number(appointment.amount),
          duration: appointment.duration,
          notes: appointment.notes || undefined,
          googleEventId: appointment.google_event_id,
          serviceColor,
          confirmationStatus: status,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    },
  });
}
