import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ConfirmationStatus, PaymentStatus } from '@/types';

type Status = ConfirmationStatus | PaymentStatus;

interface StatusBadgeProps {
  status: Status;
  className?: string;
  /** Mostra uma setinha indicando que o selo pode ser tocado. */
  withChevron?: boolean;
}

export const STATUS_LABELS: Record<Status, string> = {
  pendente: 'Pendente',
  confirmado: 'Confirmado',
  atendido: 'Atendido',
  cancelado: 'Cancelado',
  retorno_previsto: 'Retorno previsto',
  pago: 'Pago',
  nao_pago: 'Não pago',
  sinal: 'Sinal',
};

const STYLES: Record<Status, string> = {
  pendente: 'bg-amber-100 text-amber-800 border-amber-200',
  confirmado: 'bg-blue-100 text-blue-800 border-blue-200',
  atendido: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  cancelado: 'bg-muted text-muted-foreground border-border',
  retorno_previsto: 'bg-orange-100 text-orange-800 border-orange-200',
  pago: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  nao_pago: 'bg-rose-100 text-rose-800 border-rose-200',
  sinal: 'bg-amber-100 text-amber-800 border-amber-200',
};

export function StatusBadge({ status, className, withChevron }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium',
        STYLES[status],
        className,
      )}
    >
      {STATUS_LABELS[status]}
      {withChevron && <ChevronDown className="w-3 h-3 ml-0.5 -mr-0.5" aria-hidden="true" />}
    </span>
  );
}
