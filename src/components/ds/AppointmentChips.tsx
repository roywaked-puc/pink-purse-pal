import { Appointment, Service } from '@/types';
import { cn } from '@/lib/utils';

interface AppointmentChipsProps {
  appointment: Pick<Appointment, 'service' | 'maintenanceNumber'>;
  service?: Service | null;
  className?: string;
  /** Versão reduzida para cards compactos (agenda semanal/mensal). */
  compact?: boolean;
}

/**
 * Exibe a descrição do atendimento como chips visuais:
 * técnica (texto normal) + chips de Tipo, Faixa de dias e Nº da manutenção.
 * Fallback: texto simples (appointment.service) para serviços avulsos/legados.
 */
export function AppointmentChips({ appointment, service, className, compact }: AppointmentChipsProps) {
  const textSize = compact ? 'text-[10px]' : 'text-sm';
  const chipSize = compact ? 'text-[9px] px-1.5 py-0' : 'text-[11px] px-2 py-0.5';

  if (!service?.techniqueName || !service.tierType || service.tierType === 'avulso') {
    return (
      <p className={cn(textSize, 'text-muted-foreground truncate w-full', className)}>
        {appointment.service}
      </p>
    );
  }

  let faixa: string | null = null;
  if (service.diasMin != null && service.diasMax != null) {
    faixa = `${service.diasMin}–${service.diasMax} dias`;
  } else if (service.diasMax != null) {
    faixa = `até ${service.diasMax} dias`;
  } else if (service.diasMin != null) {
    faixa = `a partir de ${service.diasMin} dias`;
  }

  const isManutencao = service.tierType === 'manutencao';
  const showMaintenanceChip = isManutencao && appointment.maintenanceNumber != null;

  return (
    <div className={cn('w-full', className)}>
      <p className={cn(textSize, 'font-medium truncate w-full')}>{service.techniqueName}</p>
      <div className={cn('flex flex-wrap', compact ? 'gap-0.5 mt-0.5' : 'gap-1 mt-1')}>
        <span className={cn('inline-flex items-center font-medium rounded-full bg-muted text-muted-foreground', chipSize)}>
          {isManutencao ? 'Manutenção' : 'Colocação'}
        </span>
        {faixa && (
          <span className={cn('inline-flex items-center font-medium rounded-full bg-muted text-muted-foreground', chipSize)}>
            {faixa}
          </span>
        )}
        {showMaintenanceChip && (
          <span className={cn('inline-flex items-center font-medium rounded-full bg-primary/15 text-primary', chipSize)}>
            {appointment.maintenanceNumber}ª manutenção
          </span>
        )}
      </div>
    </div>
  );
}
