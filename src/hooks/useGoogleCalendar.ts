import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUserSettings } from './useUserSettings';
import { Appointment } from '@/types';

export function useGoogleCalendar() {
  const { data: settings } = useUserSettings();
  const queryClient = useQueryClient();

  const isConnected = !!(
    settings?.google_calendar_enabled &&
    settings?.google_access_token
  );

  const hasCredentials = !!(
    settings?.google_client_id &&
    settings?.google_client_secret
  );

  return {
    isConnected,
    hasCredentials,
    settings,
  };
}

export function useGetGoogleAuthUrl() {
  return useMutation({
    mutationFn: async ({ clientId, redirectUri }: { clientId: string; redirectUri: string }) => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('Not authenticated');
      }

      const { data, error } = await supabase.functions.invoke('google-calendar', {
        body: {
          action: 'get-auth-url',
          clientId,
          redirectUri,
        },
      });

      if (error) throw error;
      return data as { authUrl: string };
    },
  });
}

export function useExchangeGoogleCode() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ code, redirectUri }: { code: string; redirectUri: string }) => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('Not authenticated');
      }

      const { data, error } = await supabase.functions.invoke('google-calendar', {
        body: {
          action: 'exchange-code',
          code,
          redirectUri,
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-settings'] });
    },
  });
}

export function useDisconnectGoogle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('Not authenticated');
      }

      const { data, error } = await supabase.functions.invoke('google-calendar', {
        body: { action: 'disconnect' },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-settings'] });
    },
  });
}

export function useSyncAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (appointment: Appointment & { googleEventId?: string }) => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('Not authenticated');
      }

      const { data, error } = await supabase.functions.invoke('google-calendar', {
        body: {
          action: 'sync-appointment',
          appointment: {
            id: appointment.id,
            date: appointment.date.toISOString(),
            clientName: appointment.clientName,
            service: appointment.service,
            amount: appointment.amount,
            duration: appointment.duration,
            notes: appointment.notes,
            googleEventId: appointment.googleEventId,
          },
        },
      });

      if (error) throw error;
      
      // Update appointment with Google Event ID if it's a new event
      if (data?.eventId && !appointment.googleEventId) {
        await supabase
          .from('appointments')
          .update({ google_event_id: data.eventId } as any)
          .eq('id', appointment.id);
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    },
  });
}

export function useDeleteGoogleEvent() {
  return useMutation({
    mutationFn: async (eventId: string) => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('Not authenticated');
      }

      const { data, error } = await supabase.functions.invoke('google-calendar', {
        body: {
          action: 'delete-event',
          eventId,
        },
      });

      if (error) throw error;
      return data;
    },
  });
}
