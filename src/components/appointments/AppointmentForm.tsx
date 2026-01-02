import { useState, useEffect } from 'react';
import { format, addMinutes, areIntervalsOverlapping } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { Appointment, PaymentStatus, Client, Service } from '@/types';
import { useApp } from '@/contexts/AppContext';
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

interface AppointmentFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointment?: Appointment | null;
  onDelete?: () => void;
}

export function AppointmentForm({ open, onOpenChange, appointment, onDelete }: AppointmentFormProps) {
  const { appointments, addAppointment, updateAppointment, addClientAsync, updateClient, getClientById, addServiceAsync, getServiceById } = useApp();
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
  const [notes, setNotes] = useState('');

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
      setNotes(appointment.notes || '');
      
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
    } else {
      resetForm();
    }
  }, [appointment, open, getClientById, getServiceById]);

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
    setNotes('');
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

    let clientId = selectedClientId;

    // Se tem cliente selecionado, atualiza os dados se mudaram
    if (selectedClientId) {
      updateClient(selectedClientId, {
        name: clientName,
        phone: clientPhone,
        notes: clientNotes,
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
      duration: parseInt(duration) || 60,
      notes: notes.trim() || undefined,
    };

    if (appointment) {
      updateAppointment(appointment.id, data);
    } else {
      addAppointment(data);
    }

    onOpenChange(false);
    resetForm();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
                    {date ? format(date, "dd/MM") : "Selecione"}
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
            <Label>Observação da Cliente</Label>
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

          <div className="space-y-2">
            <Label>Observação do Atendimento</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Trazer foto de referência, usar produto X..."
              rows={2}
              className="resize-none"
            />
          </div>

          {appointment && (
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
            </div>
          )}

          <DialogFooter className="flex-col sm:flex-row gap-2 pt-4">
            {appointment && onDelete && appointment.paidAmount === 0 && (
              <Button
                type="button"
                variant="destructive"
                onClick={onDelete}
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
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button type="submit" className="flex-1">
                Salvar
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
