import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { sanitizeDbError } from '@/lib/sanitizeError';

export interface UserSettings {
  id: string;
  user_id: string;
  google_calendar_enabled: boolean;
  google_client_id: string | null;
  google_client_secret: string | null;
  google_token_expiry: string | null;
}

// Safe column list — never select OAuth access/refresh tokens client-side.
const SAFE_COLUMNS =
  'id, user_id, google_calendar_enabled, google_client_id, google_client_secret, google_token_expiry';

export function useUserSettings() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['user-settings', user?.id],
    queryFn: async (): Promise<UserSettings | null> => {
      if (!user) return null;

      const { data, error } = await supabase
        .from('user_settings')
        .select(SAFE_COLUMNS)
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw sanitizeDbError(error);
      if (!data) return null;

      return {
        id: data.id,
        user_id: data.user_id,
        google_calendar_enabled: data.google_calendar_enabled ?? false,
        google_client_id: (data as any).google_client_id ?? null,
        google_client_secret: (data as any).google_client_secret ?? null,
        google_token_expiry: data.google_token_expiry ?? null,
      };
    },
    enabled: !!user,
  });
}

export function useUpdateUserSettings() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (settings: Partial<Omit<UserSettings, 'id' | 'user_id'>>) => {
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          ...settings,
        } as any, { onConflict: 'user_id' });

      if (error) throw sanitizeDbError(error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-settings'] });
    },
  });
}
