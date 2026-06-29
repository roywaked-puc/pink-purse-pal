import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { sanitizeDbError } from '@/lib/sanitizeError';

export interface UserSettings {
  id: string;
  user_id: string;
  google_calendar_enabled: boolean;
  google_client_id: string | null;
  google_client_secret_configured: boolean;
  google_token_expiry: string | null;
  retention_intervals: number[];
  retention_reminder_days: number;
  retention_color_previsto: string;
  retention_color_aguardando: string;
  retention_color_confirmado: string;
  crm_inactive_days: number;
  crm_confirm_days: number;
  crm_vip_count: number;
  crm_monthly_goal: number;
}

const DEFAULTS = {
  retention_intervals: [15, 20, 21, 30],
  retention_reminder_days: 3,
  retention_color_previsto: '#FBBF24',
  retention_color_aguardando: '#F97316',
  retention_color_confirmado: '#10B981',
  crm_inactive_days: 45,
  crm_confirm_days: 3,
  crm_vip_count: 10,
  crm_monthly_goal: 0,
};

// Safe column list — never select OAuth client secret or access/refresh tokens client-side.
const SAFE_COLUMNS =
  'id, user_id, google_calendar_enabled, google_client_id, google_token_expiry, retention_intervals, retention_reminder_days, retention_color_previsto, retention_color_aguardando, retention_color_confirmado, crm_inactive_days, crm_confirm_days, crm_vip_count, crm_monthly_goal';

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

      const d = data as any;
      return {
        id: d.id,
        user_id: d.user_id,
        google_calendar_enabled: d.google_calendar_enabled ?? false,
        google_client_id: d.google_client_id ?? null,
        google_client_secret: d.google_client_secret ?? null,
        google_token_expiry: d.google_token_expiry ?? null,
        retention_intervals: d.retention_intervals ?? DEFAULTS.retention_intervals,
        retention_reminder_days: d.retention_reminder_days ?? DEFAULTS.retention_reminder_days,
        retention_color_previsto: d.retention_color_previsto ?? DEFAULTS.retention_color_previsto,
        retention_color_aguardando: d.retention_color_aguardando ?? DEFAULTS.retention_color_aguardando,
        retention_color_confirmado: d.retention_color_confirmado ?? DEFAULTS.retention_color_confirmado,
        crm_inactive_days: d.crm_inactive_days ?? DEFAULTS.crm_inactive_days,
        crm_confirm_days: d.crm_confirm_days ?? DEFAULTS.crm_confirm_days,
        crm_vip_count: d.crm_vip_count ?? DEFAULTS.crm_vip_count,
        crm_monthly_goal: d.crm_monthly_goal ?? DEFAULTS.crm_monthly_goal,
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

export function retentionDefaults() {
  return { ...DEFAULTS };
}
