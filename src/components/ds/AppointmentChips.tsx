import { Appointment, Service } from '@/types';
import { cn } from '@/lib/utils';
import { AlertTriangle } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { diasDesdeUltimoAtendimento, situacaoIntervalo } from '@/lib/diasDesdeUltimoAtendimento';

interface AppointmentChipsProps {
  appointment: Pick<Appointment, 'service' | 'maintenanceNumber'> & Partial<Pick<Appointment, 'id' | 'clientId' | 'date' | 'confirmationStatus'>>;
  service?: Service | null;
  className?: string;
  /** Versão reduzida para cards compactos (agenda semanal/mensal). */
  compact?: boolean;
  /** Cards da Home/Agenda: chip do tipo + chip de dias desde o último atendimento. */
  comIntervalo?: boolean;
}

function IntervaloChip({ appointment, service, chipSize }: { appointment: AppointmentChipsProps['appointment']; service?: Service | null; chipSize: string }) {
  const { appointments } = useApp();
  if (!appointment.id || !appointment.date || !appointment.confirmationStatus) return null;
  const dias = diasDesdeUltimoAtendimento(appointment as Appointment, appointments);
  const sit = situacaoIntervalo(dias, service);
  const base = cn('inline-flex items-center gap-1 font-medium rounded-full border whitespace-nowrap', chipSize);
  if (sit === 'primeira') return <span className={cn(base, 'bg-background/75 border-border text-foreground/80')}>Primeira visita</span>;
  const diasTxt = `${dias} ${dias === 1 ? 'dia' : 'dias'}`;
  if (sit === 'neutro') return (
    <span className={cn(base, 'bg-background/75 border-border text-foreground/80')}>
      <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />{diasTxt} desde o último
    </span>
  );
  const faixa = `faixa ${service!.diasMin}–${service!.diasMax}`;
  if (sit === 'dentro') return (
    <span className={cn(base, 'bg-background/75 border-success text-success')}>
      <span className="w-1.5 h-1.5 rounded-full bg-success" />{diasTxt} · {faixa}
    </span>
  );
  return (
    <span className={cn(base, 'bg-destructive/15 border-destructive/40 text-destructive')} title="Fora da faixa de manutenção">
      <AlertTriangle className="w-3 h-3 shrink-0" aria-label="Fora da faixa" />{diasTxt} · {faixa}
    </span>
  );
}

/**
 * Exibe a descrição do atendimento como chips visuais:
 * técnica (texto normal) + chips de Tipo, Faixa de dias e Nº da manutenção.
 * Fallback: texto simples (appointment.service) para serviços avulsos/legados.
 */
export function AppointmentChips({ appointment, service, className, compact, comIntervalo }: AppointmentChipsProps) {
  const textSize = compact ? 'text-[10px]' : 'text-sm';
  const chipSize = compact ? 'text-[9px] px-1.5 py-0' : 'text-[11px] px-2 py-0.5';

  if (comIntervalo) {
    const isAvulso = !service?.techniqueName || !service.tierType || service.tierType === 'avulso';
    const tipo = isAvulso ? null
      : service!.tierType === 'manutencao'
        ? (appointment.maintenanceNumber != null ? `${appointment.maintenanceNumber}ª manutenção` : 'Manutenção')
        : 'Colocação';
    return (
      <div className={cn('w-full', className)}>
        <p className={cn(textSize, 'font-medium truncate w-full')}>{isAvulso ? appointment.service : service!.techniqueName}</p>
        <div className={cn('flex flex-wrap', compact ? 'gap-0.5 mt-0.5' : 'gap-1 mt-1')}>
          {tipo && (
            <span className={cn('inline-flex items-center font-medium rounded-full bg-background/75 text-foreground/85 whitespace-nowrap', chipSize)}>{tipo}</span>
          )}
          <IntervaloChip appointment={appointment} service={service} chipSize={chipSize} />
        </div>
      </div>
    );
  }

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
