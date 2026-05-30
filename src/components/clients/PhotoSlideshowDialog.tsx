import { useEffect, useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Pause, Play, X } from 'lucide-react';
import { ClientPhotoWithUrls } from '@/hooks/useClientPhotos';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  photos: ClientPhotoWithUrls[]; // any order, we sort chronologically
  intervalMs?: number;
}

export function PhotoSlideshowDialog({ open, onOpenChange, photos, intervalMs = 2500 }: Props) {
  const sorted = [...photos].sort((a, b) => a.photoDate.getTime() - b.photoDate.getTime());
  const [i, setI] = useState(0);
  const [playing, setPlaying] = useState(true);

  useEffect(() => {
    if (open) {
      setI(0);
      setPlaying(true);
    }
  }, [open]);

  useEffect(() => {
    if (!open || !playing || sorted.length < 2) return;
    const t = setInterval(() => setI((x) => (x + 1) % sorted.length), intervalMs);
    return () => clearInterval(t);
  }, [open, playing, sorted.length, intervalMs]);

  if (sorted.length === 0) return null;
  const p = sorted[i];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl p-0 bg-black border-0 text-white">
        <div className="relative h-[85vh] flex items-center justify-center">
          <img
            key={p.id}
            src={p.fullUrl}
            alt=""
            className="max-h-full max-w-full object-contain animate-fade-in"
          />
          <div className="absolute top-3 right-3 flex gap-1">
            <Button size="icon" variant="ghost" onClick={() => setPlaying((x) => !x)} className="text-white hover:bg-white/10">
              {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </Button>
            <Button size="icon" variant="ghost" onClick={() => onOpenChange(false)} className="text-white hover:bg-white/10">
              <X className="w-4 h-4" />
            </Button>
          </div>
          <div className="absolute bottom-4 left-0 right-0 px-4 text-center">
            <p className="text-sm font-medium">
              {format(p.photoDate, "dd 'de' MMM yyyy", { locale: ptBR })}
            </p>
            {p.observation && <p className="text-xs text-white/80 italic">{p.observation}</p>}
            <div className="mt-2 flex justify-center gap-1">
              {sorted.map((_, idx) => (
                <span
                  key={idx}
                  className={`h-1 rounded-full transition-all ${idx === i ? 'w-6 bg-white' : 'w-1.5 bg-white/40'}`}
                />
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
