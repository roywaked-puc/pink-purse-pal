import { cn } from '@/lib/utils';
import { ConfirmationStatus, PaymentStatus } from '@/types';

type Status = ConfirmationStatus | PaymentStatus;

interface StatusBadgeProps {
  status: Status;
  className?: string;
}

const LABELS: Record<Status, string> = {
  pendente: 'Pendente',
  confirmado: 'Confirmado',
  atendido: 'Atendido',
  cancelado: 'Cancelado',
  pago: 'Pago',
  nao_pago: 'Não pago',
  sinal: 'Sinal',
};

const STYLES: Record<Status, string> = {
  pendente: 'bg-amber-100 text-amber-800 border-amber-200',
  confirmado: 'bg-blue-100 text-blue-800 border-blue-200',
  atendido: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  cancelado: 'bg-muted text-muted-foreground border-border',
  pago: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  nao_pago: 'bg-rose-100 text-rose-800 border-rose-200',
  sinal: 'bg-amber-100 text-amber-800 border-amber-200',
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium',
        STYLES[status],
        className,
      )}
    >
      {LABELS[status]}
    </span>
  );
}
