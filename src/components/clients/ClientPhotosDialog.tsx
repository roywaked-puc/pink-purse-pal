import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ClientPhotosTab } from './ClientPhotosTab';

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  clientId: string;
  clientName?: string;
}

/** Quick history viewer used outside of the client page (e.g. from the agenda). */
export function ClientPhotosDialog({ open, onOpenChange, clientId, clientName }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Histórico de fotos</DialogTitle>
          {clientName && <DialogDescription>{clientName}</DialogDescription>}
        </DialogHeader>
        <ClientPhotosTab clientId={clientId} />
      </DialogContent>
    </Dialog>
  );
}
