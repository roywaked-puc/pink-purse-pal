import { useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Camera, ImagePlus, X } from 'lucide-react';
import { useUploadClientPhoto } from '@/hooks/useClientPhotos';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

const SUGGESTIONS = [
  'Primeira aplicação',
  'Manutenção 15 dias',
  'Volume brasileiro',
  'Volume egípcio',
  'Correção de falhas',
];

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  clientId: string;
  appointmentId?: string;
  serviceName?: string;
  defaultDate?: Date;
}

export function PhotoUploadDialog({ open, onOpenChange, clientId, appointmentId, serviceName, defaultDate }: Props) {
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [observation, setObservation] = useState('');
  const [photoDate, setPhotoDate] = useState(format(defaultDate ?? new Date(), 'yyyy-MM-dd'));
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const upload = useUploadClientPhoto();
  const { toast } = useToast();

  const handlePicked = (list: FileList | null) => {
    if (!list) return;
    const arr = Array.from(list).filter((f) => f.type.startsWith('image/'));
    setFiles((prev) => [...prev, ...arr]);
    setPreviews((prev) => [...prev, ...arr.map((f) => URL.createObjectURL(f))]);
  };

  const removeAt = (i: number) => {
    setFiles((prev) => prev.filter((_, idx) => idx !== i));
    setPreviews((prev) => prev.filter((_, idx) => idx !== i));
  };

  const reset = () => {
    previews.forEach((u) => URL.revokeObjectURL(u));
    setFiles([]);
    setPreviews([]);
    setObservation('');
    setPhotoDate(format(new Date(), 'yyyy-MM-dd'));
  };

  const handleSave = async () => {
    if (files.length === 0) {
      toast({ title: 'Selecione ao menos uma foto', variant: 'destructive' });
      return;
    }
    try {
      for (const file of files) {
        await upload.mutateAsync({
          clientId,
          file,
          observation: observation || undefined,
          photoDate: new Date(`${photoDate}T12:00:00`),
          appointmentId,
          serviceName,
        });
      }
      toast({ title: `${files.length} foto(s) adicionada(s)` });
      reset();
      onOpenChange(false);
    } catch (e: any) {
      toast({ title: 'Erro ao enviar', description: e.message, variant: 'destructive' });
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) reset();
        onOpenChange(o);
      }}
    >
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Adicionar fotos</DialogTitle>
          <DialogDescription>
            {serviceName ? `Atendimento: ${serviceName}` : 'Registre a evolução da cliente'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Input source buttons */}
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" onClick={() => cameraRef.current?.click()} className="h-20 flex-col">
              <Camera className="w-5 h-5 mb-1" />
              <span className="text-xs">Câmera</span>
            </Button>
            <Button variant="outline" onClick={() => fileRef.current?.click()} className="h-20 flex-col">
              <ImagePlus className="w-5 h-5 mb-1" />
              <span className="text-xs">Galeria</span>
            </Button>
            <input
              ref={cameraRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => handlePicked(e.target.files)}
            />
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => handlePicked(e.target.files)}
            />
          </div>

          {/* Previews */}
          {previews.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {previews.map((u, i) => (
                <div key={i} className="relative aspect-square rounded-lg overflow-hidden border border-border">
                  <img src={u} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeAt(i)}
                    className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="photoDate">Data</Label>
            <Input
              id="photoDate"
              type="date"
              value={photoDate}
              onChange={(e) => setPhotoDate(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="obs">Observação</Label>
            <Textarea
              id="obs"
              value={observation}
              onChange={(e) => setObservation(e.target.value)}
              rows={2}
              placeholder="Ex.: primeira aplicação, volume brasileiro..."
              maxLength={300}
            />
            <div className="flex flex-wrap gap-1.5 pt-1">
              {SUGGESTIONS.map((s) => (
                <button
                  type="button"
                  key={s}
                  onClick={() => setObservation(s)}
                  className="text-xs px-2 py-1 rounded-full bg-muted hover:bg-primary/10 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={upload.isPending}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={upload.isPending || files.length === 0}>
            {upload.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Salvar {files.length > 0 && `(${files.length})`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
