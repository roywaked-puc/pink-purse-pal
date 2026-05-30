import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Camera } from 'lucide-react';

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onConfirm: () => void;
  clientName?: string;
}

export function PostAttendancePhotoPrompt({ open, onOpenChange, onConfirm, clientName }: Props) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-[90%] sm:max-w-md rounded-xl">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-primary" />
            Registrar fotos do atendimento?
          </AlertDialogTitle>
          <AlertDialogDescription>
            {clientName
              ? `Adicione fotos para acompanhar a evolução de ${clientName}.`
              : 'Adicione fotos para acompanhar a evolução da cliente.'}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-row gap-2">
          <AlertDialogCancel className="flex-1 mt-0">Agora não</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} className="flex-1">
            Adicionar fotos
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
