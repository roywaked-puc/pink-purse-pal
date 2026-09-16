import { cn } from '@/lib/utils';

interface MaintenanceBadgeProps {
  /** Número da manutenção (1 a 5) */
  number?: number | null;
  /** Versão curta, apenas "Xª" — usada em cards muito pequenos */
  compact?: boolean;
  className?: string;
}

/**
 * Indicador somente leitura do número da manutenção do atendimento.
 * Não calcula nada — apenas exibe o valor já salvo no agendamento.
 */
export function MaintenanceBadge({ number, compact, className }: MaintenanceBadgeProps) {
  if (!number) return null;

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full bg-primary/10 text-primary font-medium px-1.5 py-0.5 text-[10px] leading-none whitespace-nowrap',
        className,
      )}
    >
      {compact ? `${number}ª` : `Manut. ${number}ª`}
    </span>
  );
}
