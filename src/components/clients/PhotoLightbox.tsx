import { useEffect, useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ChevronLeft, ChevronRight, Trash2, Pencil, Check, X, ZoomIn, ZoomOut } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ClientPhotoWithUrls, useDeleteClientPhoto, useUpdateClientPhoto } from '@/hooks/useClientPhotos';
import { DeleteConfirmDialog } from '@/components/shared/DeleteConfirmDialog';
import { useToast } from '@/hooks/use-toast';

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  photos: ClientPhotoWithUrls[];
  index: number;
  onIndexChange: (i: number) => void;
}

export function PhotoLightbox({ open, onOpenChange, photos, index, onIndexChange }: Props) {
  const photo = photos[index];
  const [zoom, setZoom] = useState(1);
  const [editing, setEditing] = useState(false);
  const [obs, setObs] = useState('');
  const [confirmDel, setConfirmDel] = useState(false);
  const upd = useUpdateClientPhoto();
  const del = useDeleteClientPhoto();
  const { toast } = useToast();

  useEffect(() => {
    setZoom(1);
    setEditing(false);
    setObs(photo?.observation ?? '');
  }, [index, photo?.id]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
      if (e.key === 'Escape') onOpenChange(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  if (!photo) return null;

  const prev = () => onIndexChange((index - 1 + photos.length) % photos.length);
  const next = () => onIndexChange((index + 1) % photos.length);

  const handleSaveObs = async () => {
    await upd.mutateAsync({ id: photo.id, observation: obs || null });
    setEditing(false);
    toast({ title: 'Observação atualizada' });
  };

  const handleDelete = async () => {
    await del.mutateAsync({ id: photo.id, storagePath: photo.storagePath });
    setConfirmDel(false);
    toast({ title: 'Foto removida' });
    if (photos.length === 1) onOpenChange(false);
    else onIndexChange(Math.max(0, index - 1));
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-5xl p-0 bg-black/95 border-0 text-white">
          <div className="relative flex flex-col h-[90vh]">
            {/* Image */}
            <div className="relative flex-1 overflow-auto flex items-center justify-center">
              <img
                src={photo.fullUrl}
                alt={photo.observation ?? ''}
                style={{ transform: `scale(${zoom})`, transition: 'transform .2s' }}
                className="max-h-full max-w-full object-contain origin-center select-none"
                draggable={false}
              />

              {photos.length > 1 && (
                <>
                  <button
                    onClick={prev}
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 rounded-full p-2"
                    aria-label="Anterior"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <button
                    onClick={next}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 rounded-full p-2"
                    aria-label="Próxima"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </>
              )}
            </div>

            {/* Bottom bar */}
            <div className="bg-black/80 backdrop-blur p-4 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="text-sm">
                  <p className="font-medium">
                    {format(photo.photoDate, "dd 'de' MMM yyyy", { locale: ptBR })}
                  </p>
                  {photo.serviceName && (
                    <p className="text-xs text-white/60">{photo.serviceName}</p>
                  )}
                  <p className="text-xs text-white/60">
                    {index + 1} / {photos.length}
                  </p>
                </div>
                <div className="flex gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))}
                    className="text-white hover:bg-white/10"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => setZoom((z) => Math.min(4, z + 0.25))}
                    className="text-white hover:bg-white/10"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => setEditing((e) => !e)}
                    className="text-white hover:bg-white/10"
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => setConfirmDel(true)}
                    className="text-red-400 hover:bg-white/10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {editing ? (
                <div className="flex gap-2 items-start">
                  <Textarea
                    value={obs}
                    onChange={(e) => setObs(e.target.value)}
                    rows={2}
                    maxLength={300}
                    className="bg-white/10 text-white border-white/20"
                  />
                  <div className="flex flex-col gap-1">
                    <Button size="icon" onClick={handleSaveObs} disabled={upd.isPending}>
                      <Check className="w-4 h-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => {
                        setObs(photo.observation ?? '');
                        setEditing(false);
                      }}
                      className="text-white hover:bg-white/10"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                photo.observation && <p className="text-sm italic text-white/80">{photo.observation}</p>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <DeleteConfirmDialog
        open={confirmDel}
        onOpenChange={setConfirmDel}
        onConfirm={handleDelete}
        title="Excluir foto?"
        description="Esta ação não pode ser desfeita."
      />
    </>
  );
}
