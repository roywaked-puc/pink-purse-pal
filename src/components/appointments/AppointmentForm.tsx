import { useState, useEffect } from 'react';
import { format, addMinutes, areIntervalsOverlapping } from 'date-fns';
import { CalendarIcon, HelpCircle, Receipt, Loader2 } from 'lucide-react';
import { AppointmentTransactionsDialog } from './AppointmentTransactionsDialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Appointment, PaymentStatus, ConfirmationStatus, Client, Service } from '@/types';
import { useApp } from '@/contexts/AppContext';
import { useUpdateAppointment, useAddAppointment } from '@/hooks/useAppointments';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { ClientAutocomplete } from './ClientAutocomplete';
import { ServiceAutocomplete } from './ServiceAutocomplete';
import { toast } from 'sonner';

export interface AppointmentPrefill {
  date?: Date;
  clientId?: string;
  clientName?: string;
  clientPhone?: string;
  clientNotes?: string;
  serviceId?: string;
  service?: string;
  amount?: number;
  duration?: number;
  notes?: string;
}

interface AppointmentFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointment?: Appointment | null;
  onDelete?: () => void;
  onAttendanceConfirmed?: (appointment: Appointment) => void;
  prefill?: AppointmentPrefill | null;
}

export function AppointmentForm({ open, onOpenChange, appointment, onDelete, onAttendanceConfirmed, prefill }: AppointmentFormProps) {
  const { appointments, addClientAsync, updateClient, getClientById, addServiceAsync, getServiceById } = useApp();
  const { mutateAsync: updateAppointmentAsync } = useUpdateAppointment();
  const { mutateAsync: addAppointmentAsync } = useAddAppointment();
  const [date, setDate] = useState<Date>(new Date());
  const [time, setTime] = useState('10:00');
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientNotes, setClientNotes] = useState('');
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [service, setService] = useState('');
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [serviceNotes, setServiceNotes] = useState('');
  const [amount, setAmount] = useState('');
  const [duration, setDuration] = useState('60');
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('nao_pago');
  const [confirmationStatus, setConfirmationStatus] = useState<ConfirmationStatus>('pendente');
  const [notes, setNotes] = useState('');
  const [isPermuta, setIsPermuta] = useState(false);
  const [showTransactions, setShowTransactions] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (appointment) {
      const appointmentDate = new Date(appointment.date);
      setDate(appointmentDate);
      setTime(format(appointmentDate, 'HH:mm'));
      setClientName(appointment.clientName);
      setService(appointment.service);
      setAmount(appointment.amount.toString());
      setDuration(appointment.duration.toString());
      setPaymentStatus(appointment.paymentStatus);
      setConfirmationStatus(appointment.confirmationStatus);
      setNotes(appointment.notes || '');
      setIsPermuta(Boolean(appointment.isPermuta));
      
      if (appointment.clientId) {
        setSelectedClientId(appointment.clientId);
        const client = getClientById(appointment.clientId);
        if (client) {
          setClientPhone(client.phone);
          setClientNotes(client.notes || '');
        }
      } else {
        setSelectedClientId(null);
        setClientPhone('');
        setClientNotes('');
      }

      if (appointment.serviceId) {
        setSelectedServiceId(appointment.serviceId);
        const svc = getServiceById(appointment.serviceId);
        if (svc) {
          setServiceNotes(svc.notes || '');
        }
      } else {
        setSelectedServiceId(null);
        setServiceNotes('');
      }
    } else if (prefill) {
      resetForm();
      if (prefill.date) {
        setDate(prefill.date);
        setTime(format(prefill.date, 'HH:mm'));
      }
      if (prefill.clientId) setSelectedClientId(prefill.clientId);
      if (prefill.clientName) setClientName(prefill.clientName);
      if (prefill.clientPhone) setClientPhone(prefill.clientPhone);
      if (prefill.clientNotes) setClientNotes(prefill.clientNotes);
      if (prefill.serviceId) setSelectedServiceId(prefill.serviceId);
      if (prefill.service) setService(prefill.service);
      if (prefill.amount != null) setAmount(prefill.amount.toString());
      if (prefill.duration != null) setDuration(prefill.duration.toString());
      if (prefill.notes) setNotes(prefill.notes);
    } else {
      resetForm();
    }
  }, [appointment, open, getClientById, getServiceById, prefill]);

  const resetForm = () => {
    setDate(new Date());
    setTime('10:00');
    setClientName('');
    setClientPhone('');
    setClientNotes('');
    setSelectedClientId(null);
    setService('');
    setSelectedServiceId(null);
    setServiceNotes('');
    setAmount('');
    setDuration('60');
    setPaymentStatus('nao_pago');
    setConfirmationStatus('pendente');
    setNotes('');
    setIsPermuta(false);
  };

  const handleClientSelect = (client: Client | null) => {
    if (client) {
      setSelectedClientId(client.id);
      setClientPhone(client.phone);
      setClientNotes(client.notes || '');
    } else {
      setSelectedClientId(null);
      setClientPhone('');
      setClientNotes('');
    }
  };

  const handleServiceSelect = (svc: Service | null) => {
    if (svc) {
      setSelectedServiceId(svc.id);
      setAmount(svc.amount.toString());
      setDuration(svc.duration.toString());
      setServiceNotes(svc.notes || '');
    } else {
      setSelectedServiceId(null);
      setServiceNotes('');
    }
  };

  // Verifica se há conflito de horário com outros agendamentos
  const checkTimeConflict = (newStart: Date, newDuration: number): Appointment | null => {
    const newEnd = addMinutes(newStart, newDuration);
    
    for (const existing of appointments) {
      // Ignora o agendamento atual se estiver editando
      if (appointment && existing.id === appointment.id) continue;
      
      const existingStart = new Date(existing.date);
      const existingEnd = addMinutes(existingStart, existing.duration);
      
      // Verifica sobreposição de intervalos
      const hasOverlap = areIntervalsOverlapping(
        { start: newStart, end: newEnd },
        { start: existingStart, end: existingEnd }
      );
      
      if (hasOverlap) {
        return existing;
      }
    }
    
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    
    const [hours, minutes] = time.split(':').map(Number);
    const fullDate = new Date(date);
    fullDate.setHours(hours, minutes, 0, 0);

    // Verifica conflito de horário
    const durationMinutes = parseInt(duration) || 60;
    const conflictingAppointment = checkTimeConflict(fullDate, durationMinutes);
    
    if (conflictingAppointment) {
      const conflictTime = format(new Date(conflictingAppointment.date), 'HH:mm');
      const conflictEnd = format(addMinutes(new Date(conflictingAppointment.date), conflictingAppointment.duration), 'HH:mm');
      toast.error('Conflito de horário', {
        description: `Já existe um agendamento de ${conflictingAppointment.clientName} das ${conflictTime} às ${conflictEnd}.`,
      });
      return;
    }

    setIsSubmitting(true);
    try {
      let clientId = selectedClientId;

      // Se tem cliente selecionado, atualiza os dados se mudaram
      if (selectedClientId) {
        const existingClient = getClientById(selectedClientId);
        updateClient(selectedClientId, {
          name: clientName,
          phone: clientPhone,
          notes: clientNotes,
          recurrenceDays: existingClient?.recurrenceDays,
          birthDate: existingClient?.birthDate,
        });
      } else if (clientName.trim()) {
        // Cria novo cliente e aguarda o ID real do banco
        clientId = await addClientAsync({
          name: clientName.trim(),
          phone: clientPhone,
          notes: clientNotes,
        });
      }

      let serviceId = selectedServiceId;

      // Se digitou serviço novo, cria automaticamente e aguarda o ID real
      if (!selectedServiceId && service.trim() && parseFloat(amount) > 0) {
        serviceId = await addServiceAsync({
          description: service.trim(),
          amount: parseFloat(amount),
          duration: 60, // Duração padrão de 1 hora para novos serviços
        });
      }

      const data = {
        date: fullDate,
        clientId: clientId || undefined,
        clientName: clientName.trim(),
        serviceId: serviceId || undefined,
        service,
        amount: parseFloat(amount) || 0,
        paidAmount: appointment?.paidAmount || 0,
        paymentStatus,
        confirmationStatus,
        duration: parseInt(duration) || 60,
        notes: notes.trim() || undefined,
        isPermuta,
      };

      if (appointment) {
        const wasAtendido = appointment.confirmationStatus === 'atendido';
        const becameAtendido = confirmationStatus === 'atendido' && !wasAtendido;

        await updateAppointmentAsync({ id: appointment.id, appointment: data });

        if (becameAtendido && onAttendanceConfirmed) {
          const updated = { ...appointment, ...data, id: appointment.id };
          onOpenChange(false);
          resetForm();
          // Pequeno delay para garantir que o Dialog feche antes de abrir o próximo
          setTimeout(() => onAttendanceConfirmed(updated), 150);
          return;
        }
      } else {
        await addAppointmentAsync(data);
      }

      onOpenChange(false);
      resetForm();
    } catch (err: any) {
      console.error('[AppointmentForm] save error:', err);
      toast.error('Erro ao salvar agendamento', {
        description: err?.message || 'Tente novamente.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!isSubmitting) onOpenChange(o); }}>
      <DialogContent className="max-w-[95%] sm:max-w-md rounded-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {appointment ? 'Editar Agendamento' : 'Novo Agendamento'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Data</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "EEE, dd/MM", { locale: ptBR }) : "Selecione"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(d) => d && setDate(d)}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
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
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Nome da Cliente</Label>
            <ClientAutocomplete
              value={clientName}
              onChange={setClientName}
              onClientSelect={handleClientSelect}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Telefone</Label>
            <Input
              value={clientPhone}
              onChange={(e) => setClientPhone(e.target.value)}
              placeholder="(11) 99999-9999"
              type="tel"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label>Observação da Cliente</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="w-4 h-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">Este campo é apenas informativo para você. Não será exibido em nenhuma outra tela nem enviado ao cliente.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Textarea
              value={clientNotes}
              onChange={(e) => setClientNotes(e.target.value)}
              placeholder="Ex: Prefere horário da manhã, alergia a esmalte..."
              rows={2}
              className="resize-none"
            />
          </div>

          <div className="space-y-2">
            <Label>Serviço</Label>
            <ServiceAutocomplete
              value={service}
              onChange={setService}
              onServiceSelect={handleServiceSelect}
            />
            {serviceNotes && (
              <p className="text-xs text-muted-foreground">{serviceNotes}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Valor (R$)</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0,00"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Duração (min)</Label>
              <Input
                type="number"
                min="15"
                step="15"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="60"
                required
              />
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer select-none p-2 rounded-md border border-border bg-muted/30 hover:bg-muted/50 transition-colors">
            <input
              type="checkbox"
              checked={isPermuta}
              onChange={(e) => setIsPermuta(e.target.checked)}
              className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
            />
            <span className="text-sm">Este atendimento é permuta (troca de serviço)</span>
          </label>


          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label>Observação do Atendimento</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="w-4 h-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">Esta observação será exibida em todas as consultas de agendamentos e também incluída na mensagem do WhatsApp.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Trazer foto de referência, usar produto X..."
              rows={2}
              className="resize-none"
            />
          </div>

          {appointment && (
            <>
              <div className="space-y-2">
                <Label>Status de Confirmação</Label>
                <Select value={confirmationStatus} onValueChange={(v) => setConfirmationStatus(v as ConfirmationStatus)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pendente">⏳ Pendente</SelectItem>
                    <SelectItem value="confirmado">✓ Confirmado</SelectItem>
                    <SelectItem value="atendido">✓✓ Atendido</SelectItem>
                    <SelectItem value="cancelado">✗ Cancelado</SelectItem>
                    <SelectItem value="retorno_previsto">🔁 Retorno Previsto</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Status do Pagamento</Label>
                <Input 
                  value={
                    appointment.paidAmount >= appointment.amount ? 'Pago' :
                    appointment.paidAmount > 0 ? 'Sinal' : 'Não pago'
                  }
                  disabled 
                  className="bg-muted"
                />
                {appointment.paidAmount > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Recebido: R$ {appointment.paidAmount.toFixed(2).replace('.', ',')} de R$ {appointment.amount.toFixed(2).replace('.', ',')}
                  </p>
                )}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowTransactions(true)}
                  className="w-full"
                >
                  <Receipt className="w-4 h-4" />
                  Ver Movimentos
                </Button>
              </div>
            </>
          )}

          <DialogFooter className="flex-col sm:flex-row gap-2 pt-4">
            {appointment && onDelete && appointment.paidAmount === 0 && (
              <Button
                type="button"
                variant="destructive"
                onClick={onDelete}
                disabled={isSubmitting}
                className="w-full sm:w-auto"
              >
                Excluir
              </Button>
            )}
            <div className="flex gap-2 w-full sm:w-auto">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting} className="flex-1">
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  'Salvar'
                )}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
      {appointment && (
        <AppointmentTransactionsDialog
          appointmentId={appointment.id}
          open={showTransactions}
          onOpenChange={setShowTransactions}
        />
      )}
    </Dialog>
  );
}
