import { useMemo } from 'react';
import { addDays } from 'date-fns';
import { Repeat } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useApp } from '@/contexts/AppContext';
import { useUserSettings } from '@/hooks/useUserSettings';
import { Appointment, Service } from '@/types';
import { findMaintenanceServices, extractDaysFromName, getServiceBase } from '@/lib/maintenance';
import { AppointmentPrefill } from './AppointmentForm';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sourceAppointment: Appointment | null;
  onAgendarAgora?: (prefill: AppointmentPrefill) => void;
}

export function ScheduleReturnDialog({ open, onOpenChange, sourceAppointment, onAgendarAgora }: Props) {
  const { services, getClientById } = useApp();
  const { data: settings } = useUserSettings();

  const detectedServices = useMemo<Service[]>(() => {
    if (!sourceAppointment) return [];
    const direct = findMaintenanceServices(sourceAppointment.service, services);
    if (direct.length > 0) return direct;
    const base = getServiceBase(sourceAppointment.service).toLowerCase();
    return services.filter(
      (s) =>
        s.description.toLowerCase() !== sourceAppointment.service.toLowerCase() &&
        getServiceBase(s.description).toLowerCase() === base,
    );
  }, [sourceAppointment, services]);

  const fallbackInterval = settings?.retention_intervals?.[0] ?? 15;

  const handleAgendarAgora = () => {
    if (!sourceAppointment) return;
    const suggestedService = detectedServices[0];
    const days = suggestedService
      ? extractDaysFromName(suggestedService.description) ?? fallbackInterval
      : fallbackInterval;
    const source = new Date(sourceAppointment.date);
    const suggestedDate = addDays(source, days);
    suggestedDate.setHours(source.getHours(), source.getMinutes(), 0, 0);

    const client = sourceAppointment.clientId
      ? getClientById(sourceAppointment.clientId)
      : null;

    const prefill: AppointmentPrefill = {
      date: suggestedDate,
      clientId: sourceAppointment.clientId,
      clientName: sourceAppointment.clientName,
      clientPhone: client?.phone,
      clientNotes: client?.notes,
      serviceId: suggestedService?.id,
      service: suggestedService?.description ?? sourceAppointment.service,
      amount: suggestedService?.amount ?? sourceAppointment.amount,
      duration: suggestedService?.duration ?? sourceAppointment.duration,
      notes: sourceAppointment.notes,
    };

    onOpenChange(false);
    onAgendarAgora?.(prefill);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95%] sm:max-w-md rounded-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Repeat className="w-5 h-5 text-primary" />
            Próxima Manutenção
          </DialogTitle>
          <DialogDescription>
            Deseja agendar agora o próximo retorno desta cliente?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-row gap-2">
          <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
            Depois
          </Button>
          <Button className="flex-1" onClick={handleAgendarAgora}>
            Agendar Agora
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
