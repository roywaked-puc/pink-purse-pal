import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { ClientPhoto } from '@/types';
import { sanitizeDbError } from '@/lib/sanitizeError';

const BUCKET = 'client-photos';

// Simple in-memory signed-URL cache (1h TTL)
const urlCache = new Map<string, { url: string; expiresAt: number }>();

async function getSignedUrl(path: string, width?: number): Promise<string> {
  const key = `${path}|w=${width ?? 0}`;
  const cached = urlCache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.url;

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, 60 * 60, width ? { transform: { width, resize: 'cover' } } : undefined);

  if (error || !data) throw error ?? new Error('No signed URL');
  urlCache.set(key, { url: data.signedUrl, expiresAt: Date.now() + 55 * 60 * 1000 });
  return data.signedUrl;
}

export interface ClientPhotoWithUrls extends ClientPhoto {
  thumbUrl: string;
  fullUrl: string;
}

async function compressImage(file: File, maxSize = 1600, quality = 0.85): Promise<Blob> {
  if (!file.type.startsWith('image/')) return file;
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(bitmap, 0, 0, w, h);
  return await new Promise<Blob>((resolve) =>
    canvas.toBlob((b) => resolve(b ?? file), 'image/jpeg', quality)
  );
}

export function useClientPhotos(clientId: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['client_photos', clientId, user?.id],
    enabled: !!user && !!clientId,
    queryFn: async (): Promise<ClientPhotoWithUrls[]> => {
      const { data, error } = await supabase
        .from('client_photos' as any)
        .select('*')
        .eq('client_id', clientId!)
        .order('photo_date', { ascending: false });

      if (error) throw sanitizeDbError(error);

      const rows = (data ?? []) as any[];
      const enriched = await Promise.all(
        rows.map(async (r) => {
          const [thumbUrl, fullUrl] = await Promise.all([
            getSignedUrl(r.storage_path, 400).catch(() => ''),
            getSignedUrl(r.storage_path).catch(() => ''),
          ]);
          return {
            id: r.id,
            clientId: r.client_id,
            appointmentId: r.appointment_id || undefined,
            photoDate: new Date(r.photo_date),
            storagePath: r.storage_path,
            observation: r.observation || undefined,
            serviceName: r.service_name || undefined,
            createdAt: new Date(r.created_at),
            thumbUrl,
            fullUrl,
          } as ClientPhotoWithUrls;
        })
      );
      return enriched;
    },
  });
}

export function useUploadClientPhoto() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      clientId: string;
      file: File;
      observation?: string;
      photoDate?: Date;
      appointmentId?: string;
      serviceName?: string;
    }) => {
      if (!user) throw new Error('Not authenticated');
      const blob = await compressImage(input.file);
      const ext = 'jpg';
      const filename = `${crypto.randomUUID()}.${ext}`;
      const path = `${user.id}/${input.clientId}/${filename}`;

      const { error: upErr } = await supabase.storage
        .from(BUCKET)
        .upload(path, blob, { contentType: 'image/jpeg', upsert: false });
      if (upErr) throw upErr;

      const { error: insErr } = await supabase.from('client_photos' as any).insert({
        user_id: user.id,
        client_id: input.clientId,
        appointment_id: input.appointmentId ?? null,
        photo_date: (input.photoDate ?? new Date()).toISOString(),
        storage_path: path,
        observation: input.observation ?? null,
        service_name: input.serviceName ?? null,
      });
      if (insErr) {
        await supabase.storage.from(BUCKET).remove([path]);
        throw sanitizeDbError(insErr);
      }
    },
    onSuccess: (_d, vars) => {
      queryClient.invalidateQueries({ queryKey: ['client_photos', vars.clientId] });
    },
  });
}

export function useUpdateClientPhoto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, observation }: { id: string; observation: string | null }) => {
      const { error } = await supabase
        .from('client_photos' as any)
        .update({ observation })
        .eq('id', id);
      if (error) throw sanitizeDbError(error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client_photos'] });
    },
  });
}

export function useDeleteClientPhoto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, storagePath }: { id: string; storagePath: string }) => {
      const { error } = await supabase.from('client_photos' as any).delete().eq('id', id);
      if (error) throw sanitizeDbError(error);
      await supabase.storage.from(BUCKET).remove([storagePath]);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client_photos'] });
    },
  });
}
