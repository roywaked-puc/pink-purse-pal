import { Appointment, Service } from '@/types';
import { cn } from '@/lib/utils';

interface AppointmentChipsProps {
  appointment: Pick<Appointment, 'service' | 'maintenanceNumber'>;
  service?: Service | null;
  className?: string;
}

/**
 * Exibe a descrição do atendimento como chips visuais:
 * técnica (texto normal) + chips de Tipo, Faixa de dias e Nº da manutenção.
 * Fallback: texto simples (appointment.service) para serviços avulsos/legados.
 */
export function AppointmentChips({ appointment, service, className }: AppointmentChipsProps) {
  if (!service?.techniqueName || !service.tierType || service.tierType === 'avulso') {
    return (
      <p className={cn('text-sm text-muted-foreground truncate w-full', className)}>
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
      <p className="text-sm font-medium truncate w-full">{service.techniqueName}</p>
      <div className="flex flex-wrap gap-1 mt-1">
        <span className="inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
          {isManutencao ? 'Manutenção' : 'Colocação'}
        </span>
        {faixa && (
          <span className="inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
            {faixa}
          </span>
        )}
        {showMaintenanceChip && (
          <span className="inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded-full bg-primary/15 text-primary">
            {appointment.maintenanceNumber}ª manutenção
          </span>
        )}
      </div>
    </div>
  );
}
