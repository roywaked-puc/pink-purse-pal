import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useUserSettings, useUpdateUserSettings } from '@/hooks/useUserSettings';
import { recortarQuadrado } from '@/lib/marca';
import { sanitizeDbError } from '@/lib/sanitizeError';

export const LOGOS_BUCKET = 'logos';
const EXTENSOES = ['png', 'jpg', 'jpeg', 'webp'] as const;

export const LOGO_TIPOS_ACEITOS = ['image/png', 'image/jpeg', 'image/webp'];
export const LOGO_TAMANHO_MAX = 2 * 1024 * 1024; // 2 MB

function extensaoDoTipo(tipo: string): string {
  if (tipo === 'image/png') return 'png';
  if (tipo === 'image/webp') return 'webp';
  return 'jpg';
}

/** URL pública da logo com quebra de cache baseada na atualização das configurações. */
export function useLogoUrl(): string | null {
  const { data: settings, dataUpdatedAt } = useUserSettings();
  if (!settings?.logo_path) return null;
  const { data } = supabase.storage.from(LOGOS_BUCKET).getPublicUrl(settings.logo_path);
  return `${data.publicUrl}?v=${dataUpdatedAt}`;
}

/** URL pública da logo a partir de um caminho (para usos pontuais, ex.: PDF). */
export function logoPublicUrl(logoPath: string, versao?: number): string {
  const { data } = supabase.storage.from(LOGOS_BUCKET).getPublicUrl(logoPath);
  return versao ? `${data.publicUrl}?v=${versao}` : data.publicUrl;
}

/** Envia a logo: recorte quadrado, upsert em {userId}/logo.<ext>, apaga a extensão antiga. */
export function useUploadLogo() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: settings } = useUserSettings();

  return useMutation({
    mutationFn: async (file: File) => {
      if (!user) throw new Error('Not authenticated');
      if (!LOGO_TIPOS_ACEITOS.includes(file.type)) {
        throw new Error('Formato não aceito. Use uma imagem PNG, JPG ou WebP.');
      }
      if (file.size > LOGO_TAMANHO_MAX) {
        throw new Error('A imagem passa de 2 MB. Escolha uma menor.');
      }

      const blob = await recortarQuadrado(file);
      const ext = extensaoDoTipo(file.type);
      const path = `${user.id}/logo.${ext}`;
      const caminhoAntigo = settings?.logo_path ?? null;

      const { error } = await supabase.storage
        .from(LOGOS_BUCKET)
        .upload(path, blob, { upsert: true, contentType: file.type });
      if (error) throw sanitizeDbError(error);

      // Se a extensão mudou, apaga o arquivo antigo.
      if (caminhoAntigo && caminhoAntigo !== path) {
        await supabase.storage.from(LOGOS_BUCKET).remove([caminhoAntigo]);
      }

      const { error: settingsError } = await supabase
        .from('user_settings')
        .upsert({ user_id: user.id, logo_path: path } as any, { onConflict: 'user_id' });
      if (settingsError) throw sanitizeDbError(settingsError);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-settings'] });
    },
  });
}

/** Remove a logo do storage e limpa o caminho nas configurações. */
export function useRemoverLogo() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: settings } = useUserSettings();

  return useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Not authenticated');
      const caminho = settings?.logo_path;
      if (caminho) {
        await supabase.storage.from(LOGOS_BUCKET).remove([caminho]);
        // Garante que nenhuma variação antiga sobrou.
        await supabase.storage
          .from(LOGOS_BUCKET)
          .remove(EXTENSOES.map((e) => `${user.id}/logo.${e}`));
      }
      const { error } = await supabase
        .from('user_settings')
        .upsert({ user_id: user.id, logo_path: null } as any, { onConflict: 'user_id' });
      if (error) throw sanitizeDbError(error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-settings'] });
    },
  });
}

export { useUpdateUserSettings };
