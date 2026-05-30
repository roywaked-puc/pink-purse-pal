import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ClientPhotoWithUrls } from '@/hooks/useClientPhotos';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  photoA?: ClientPhotoWithUrls;
  photoB?: ClientPhotoWithUrls;
}

export function PhotoCompareDialog({ open, onOpenChange, photoA, photoB }: Props) {
  if (!photoA || !photoB) return null;
  // older = antes, newer = depois
  const [antes, depois] =
    photoA.photoDate.getTime() <= photoB.photoDate.getTime() ? [photoA, photoB] : [photoB, photoA];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl">
        <DialogHeader>
          <DialogTitle>Comparação Antes & Depois</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Antes', p: antes },
            { label: 'Depois', p: depois },
          ].map(({ label, p }) => (
            <div key={label} className="space-y-2">
              <div className="text-xs font-semibold uppercase tracking-wide text-primary">
                {label} · {format(p.photoDate, "dd 'de' MMM yyyy", { locale: ptBR })}
              </div>
              <div className="aspect-square bg-muted rounded-xl overflow-hidden">
                <img src={p.fullUrl} alt={p.observation ?? ''} className="w-full h-full object-cover" />
              </div>
              {p.observation && <p className="text-xs italic text-muted-foreground">{p.observation}</p>}
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
