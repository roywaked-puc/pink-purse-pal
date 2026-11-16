import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { sanitizeDbError } from '@/lib/sanitizeError';
import type { RevisaoPermuta } from '@/lib/revisaoPermuta';

export function useRevisaoPermuta(aberta: boolean) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['revisao-permuta', user?.id],
    enabled: Boolean(user) && aberta,
    staleTime: 0,
    queryFn: async (): Promise<RevisaoPermuta> => {
      const { data, error } = await supabase.rpc('revisar_conta_corrente_permuta');
      if (error) throw sanitizeDbError(error);
      return data as unknown as RevisaoPermuta;
    },
  });
}