import { useState, useEffect, useMemo } from 'react';
import { addDays, addMinutes, areIntervalsOverlapping, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon, Repeat, Sparkles } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { useApp } from '@/contexts/AppContext';
import { useUserSettings } from '@/hooks/useUserSettings';
import { Appointment, Service } from '@/types';
import { findMaintenanceServices, extractDaysFromName, getServiceBase } from '@/lib/maintenance';
import { toast } from 'sonner';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sourceAppointment: Appointment | null;
}

export function ScheduleReturnDialog({ open, onOpenChange, sourceAppointment }: Props) {
  const { services, appointments, addAppointment } = useApp();
  const { data: settings } = useUserSettings();

  const [step, setStep] = useState<'ask' | 'choose' | 'schedule'>('ask');
  const [selectedServiceId, setSelectedServiceId] = useState<string>('');
  const [date, setDate] = useState<Date>(new Date());
  const [time, setTime] = useState('10:00');

  const detectedServices = useMemo<Service[]>(() => {
    if (!sourceAppointment) return [];
    const direct = findMaintenanceServices(sourceAppointment.service, services);
    if (direct.length > 0) return direct;
    // Fallback: any service from the same base
    const base = getServiceBase(sourceAppointment.service).toLowerCase();
    return services.filter(
      (s) =>
        s.description.toLowerCase() !== sourceAppointment.service.toLowerCase() &&
        getServiceBase(s.description).toLowerCase() === base,
    );
  }, [sourceAppointment, services]);

  const fallbackInterval = settings?.retention_intervals?.[0] ?? 15;

  const selectedService = useMemo(
    () => services.find((s) => s.id === selectedServiceId),
    [services, selectedServiceId],
  );

  const suggestedDays = useMemo(() => {
    if (!selectedService) return fallbackInterval;
    return extractDaysFromName(selectedService.description) ?? fallbackInterval;
  }, [selectedService, fallbackInterval]);

  // Reset on open
  useEffect(() => {
    if (open && sourceAppointment) {
      setStep('ask');
      setSelectedServiceId('');
      setTime(format(new Date(sourceAppointment.date), 'HH:mm'));
    }
  }, [open, sourceAppointment]);

  // When choosing a service, suggest a date
  useEffect(() => {
    if (selectedService && sourceAppointment) {
      const suggested = addDays(new Date(sourceAppointment.date), suggestedDays);
      setDate(suggested);
    }
  }, [selectedService, sourceAppointment, suggestedDays]);

  if (!sourceAppointment) return null;

  const checkConflict = (start: Date, duration: number): Appointment | null => {
    const end = addMinutes(start, duration);
    for (const a of appointments) {
      if (a.confirmationStatus === 'cancelado') continue;
      const aStart = new Date(a.date);
      const aEnd = addMinutes(aStart, a.duration);
      if (areIntervalsOverlapping({ start, end }, { start: aStart, end: aEnd })) {
        return a;
      }
    }
    return null;
  };

  const handleConfirm = () => {
    if (!selectedService) return;
    const [h, m] = time.split(':').map(Number);
    const full = new Date(date);
    full.setHours(h, m, 0, 0);

    const conflict = checkConflict(full, selectedService.duration);
    if (conflict) {
      toast.error('Conflito de horário', {
        description: `Já existe ${conflict.clientName} às ${format(new Date(conflict.date), 'HH:mm')}.`,
      });
      return;
    }

    addAppointment({
      date: full,
      clientId: sourceAppointment.clientId,
      clientName: sourceAppointment.clientName,
      serviceId: selectedService.id,
      service: selectedService.description,
      amount: selectedService.amount,
      paidAmount: 0,
      paymentStatus: 'nao_pago',
      confirmationStatus: 'retorno_previsto',
      duration: selectedService.duration,
      notes: sourceAppointment.notes,
      parentAppointmentId: sourceAppointment.id,
    });

    toast.success('Retorno agendado!', {
      description: `${format(full, "dd 'de' MMM 'às' HH:mm", { locale: ptBR })}`,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95%] sm:max-w-md rounded-xl max-h-[90vh] overflow-y-auto">
        {step === 'ask' && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Repeat className="w-5 h-5 text-primary" />
                Agendar Próxima Manutenção
              </DialogTitle>
              <DialogDescription>
                Deseja agendar agora o próximo retorno desta cliente?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex-row gap-2">
              <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
                Agora Não
              </Button>
              <Button
                className="flex-1"
                onClick={() => {
                  if (detectedServices.length === 1) {
                    setSelectedServiceId(detectedServices[0].id);
                    setStep('schedule');
                  } else {
                    setStep('choose');
                  }
                }}
              >
                Agendar Retorno
              </Button>
            </DialogFooter>
          </>
        )}

        {step === 'choose' && (
          <>
            <DialogHeader>
              <DialogTitle>Escolha a próxima manutenção</DialogTitle>
              <DialogDescription>
                {detectedServices.length === 0
                  ? 'Não encontramos manutenções cadastradas para este serviço. Escolha um dos serviços abaixo.'
                  : 'Sugestões com base no serviço realizado.'}
              </DialogDescription>
            </DialogHeader>
            {detectedServices.length === 0 ? (
              <div className="space-y-2 max-h-[40vh] overflow-y-auto">
                {services.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => {
                      setSelectedServiceId(s.id);
                      setStep('schedule');
                    }}
                    className="w-full text-left p-3 rounded-lg border border-border hover:border-primary hover:bg-primary/5 transition"
                  >
                    <p className="font-medium text-sm">{s.description}</p>
                    <p className="text-xs text-muted-foreground">
                      R$ {s.amount.toFixed(2).replace('.', ',')} • {s.duration} min
                    </p>
                  </button>
                ))}
              </div>
            ) : (
              <RadioGroup value={selectedServiceId} onValueChange={setSelectedServiceId}>
                <div className="space-y-2">
                  {detectedServices.map((s) => {
                    const days = extractDaysFromName(s.description);
                    return (
                      <Label
                        key={s.id}
                        htmlFor={s.id}
                        className="flex items-start gap-3 p-3 rounded-lg border border-border hover:border-primary cursor-pointer"
                      >
                        <RadioGroupItem id={s.id} value={s.id} className="mt-1" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">{s.description}</p>
                          <p className="text-xs text-muted-foreground">
                            R$ {s.amount.toFixed(2).replace('.', ',')}
                            {days != null && ` • sugere ${days} dias`}
                          </p>
                        </div>
                      </Label>
                    );
                  })}
                </div>
              </RadioGroup>
            )}
            <DialogFooter className="flex-row gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setStep('ask')}>
                Voltar
              </Button>
              <Button
                className="flex-1"
                disabled={!selectedServiceId}
                onClick={() => setStep('schedule')}
              >
                Continuar
              </Button>
            </DialogFooter>
          </>
        )}

        {step === 'schedule' && selectedService && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                Confirmar retorno
              </DialogTitle>
              <DialogDescription>
                {selectedService.description} — sugerido em{' '}
                <strong>{suggestedDays} dias</strong>.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Data</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {format(date, 'dd/MM/yyyy')}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={date}
                        onSelect={(d) => d && setDate(d)}
                        initialFocus
                        className={cn('p-3 pointer-events-auto')}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label>Horário</Label>
                  <Input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                  />
                </div>
              </div>
              <div className="p-3 rounded-lg bg-muted/50 text-sm">
                <p>
                  <strong>{sourceAppointment.clientName}</strong>
                </p>
                <p className="text-muted-foreground text-xs mt-1">
                  {selectedService.description} • R${' '}
                  {selectedService.amount.toFixed(2).replace('.', ',')} •{' '}
                  {selectedService.duration} min
                </p>
              </div>
            </div>
            <DialogFooter className="flex-row gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setStep(detectedServices.length > 1 || detectedServices.length === 0 ? 'choose' : 'ask')}
              >
                Voltar
              </Button>
              <Button className="flex-1" onClick={handleConfirm}>
                Confirmar retorno
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
