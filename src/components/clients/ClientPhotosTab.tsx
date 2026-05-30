import { useMemo, useState } from 'react';
import { differenceInMonths, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Plus, Film, GitCompare, ImageOff, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ds/EmptyState';
import { Skeleton } from '@/components/ui/skeleton';
import { useClientPhotos, ClientPhotoWithUrls } from '@/hooks/useClientPhotos';
import { PhotoUploadDialog } from './PhotoUploadDialog';
import { PhotoLightbox } from './PhotoLightbox';
import { PhotoCompareDialog } from './PhotoCompareDialog';
import { PhotoSlideshowDialog } from './PhotoSlideshowDialog';
import { cn } from '@/lib/utils';

interface Props {
  clientId: string;
}

export function ClientPhotosTab({ clientId }: Props) {
  const { data: photos = [], isLoading } = useClientPhotos(clientId);

  const [uploadOpen, setUploadOpen] = useState(false);
  const [slideOpen, setSlideOpen] = useState(false);
  const [lightOpen, setLightOpen] = useState(false);
  const [lightIdx, setLightIdx] = useState(0);

  const [compareMode, setCompareMode] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [compareOpen, setCompareOpen] = useState(false);

  const stats = useMemo(() => {
    if (photos.length === 0) return null;
    const sorted = [...photos].sort((a, b) => a.photoDate.getTime() - b.photoDate.getTime());
    const first = sorted[0].photoDate;
    const last = sorted[sorted.length - 1].photoDate;
    const months = Math.max(1, differenceInMonths(new Date(), first));
    return { total: photos.length, first, last, months };
  }, [photos]);

  const togglePhoto = (id: string) => {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 2) return [prev[1], id];
      return [...prev, id];
    });
  };

  const openCompare = () => {
    if (selected.length === 2) setCompareOpen(true);
  };

  const photoA = photos.find((p) => p.id === selected[0]);
  const photoB = photos.find((p) => p.id === selected[1]);

  const openPhoto = (p: ClientPhotoWithUrls) => {
    if (compareMode) {
      togglePhoto(p.id);
      return;
    }
    setLightIdx(photos.indexOf(p));
    setLightOpen(true);
  };

  return (
    <div className="space-y-4">
      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <StatCard label="Total" value={String(stats.total)} />
          <StatCard label="Primeira" value={format(stats.first, 'dd/MM/yy')} />
          <StatCard label="Última" value={format(stats.last, 'dd/MM/yy')} />
          <StatCard label="Acompanhamento" value={`${stats.months} mes${stats.months > 1 ? 'es' : ''}`} />
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        <Button size="sm" onClick={() => setUploadOpen(true)}>
          <Plus className="w-4 h-4 mr-1" /> Adicionar foto
        </Button>
        {photos.length >= 2 && (
          <>
            <Button size="sm" variant="outline" onClick={() => setSlideOpen(true)}>
              <Film className="w-4 h-4 mr-1" /> Evolução
            </Button>
            <Button
              size="sm"
              variant={compareMode ? 'default' : 'outline'}
              onClick={() => {
                setCompareMode((m) => !m);
                setSelected([]);
              }}
            >
              <GitCompare className="w-4 h-4 mr-1" />
              {compareMode ? 'Cancelar' : 'Comparar'}
            </Button>
            {compareMode && (
              <Button size="sm" disabled={selected.length !== 2} onClick={openCompare}>
                Ver comparação ({selected.length}/2)
              </Button>
            )}
          </>
        )}
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="aspect-square rounded-xl" />
          ))}
        </div>
      ) : photos.length === 0 ? (
        <EmptyState
          icon={ImageOff}
          title="Nenhuma foto ainda"
          description="Registre a evolução desta cliente adicionando a primeira foto."
          action={
            <Button onClick={() => setUploadOpen(true)} size="sm">
              <Plus className="w-4 h-4 mr-1" /> Adicionar foto
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {photos.map((p) => {
            const isSelected = selected.includes(p.id);
            return (
              <button
                key={p.id}
                onClick={() => openPhoto(p)}
                className={cn(
                  'group relative aspect-square rounded-xl overflow-hidden border border-border bg-muted text-left transition-all',
                  compareMode && 'cursor-pointer',
                  isSelected && 'ring-4 ring-primary ring-offset-2'
                )}
              >
                <img
                  src={p.thumbUrl || p.fullUrl}
                  alt={p.observation ?? ''}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent text-white p-2">
                  <p className="text-xs font-medium">
                    {format(p.photoDate, "dd 'de' MMM yy", { locale: ptBR })}
                  </p>
                  {p.observation && (
                    <p className="text-[10px] truncate text-white/80">{p.observation}</p>
                  )}
                </div>
                {compareMode && (
                  <div
                    className={cn(
                      'absolute top-2 right-2 w-6 h-6 rounded-full border-2 border-white flex items-center justify-center',
                      isSelected ? 'bg-primary' : 'bg-black/40'
                    )}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}

      <PhotoUploadDialog open={uploadOpen} onOpenChange={setUploadOpen} clientId={clientId} />
      <PhotoLightbox
        open={lightOpen}
        onOpenChange={setLightOpen}
        photos={photos}
        index={lightIdx}
        onIndexChange={setLightIdx}
      />
      <PhotoCompareDialog
        open={compareOpen}
        onOpenChange={setCompareOpen}
        photoA={photoA}
        photoB={photoB}
      />
      <PhotoSlideshowDialog open={slideOpen} onOpenChange={setSlideOpen} photos={photos} />
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-3 rounded-xl bg-card border border-border shadow-soft">
      <p className="text-[10px] uppercase text-muted-foreground tracking-wide">{label}</p>
      <p className="font-semibold text-sm mt-1">{value}</p>
    </div>
  );
}
