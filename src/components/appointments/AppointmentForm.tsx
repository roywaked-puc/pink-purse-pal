import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { Appointment, PaymentStatus } from '@/types';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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

interface AppointmentFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointment?: Appointment | null;
  onDelete?: () => void;
}

export function AppointmentForm({ open, onOpenChange, appointment, onDelete }: AppointmentFormProps) {
  const { addAppointment, updateAppointment } = useApp();
  const [date, setDate] = useState<Date>(new Date());
  const [time, setTime] = useState('10:00');
  const [clientName, setClientName] = useState('');
  const [service, setService] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('nao_pago');

  useEffect(() => {
    if (appointment) {
      const appointmentDate = new Date(appointment.date);
      setDate(appointmentDate);
      setTime(format(appointmentDate, 'HH:mm'));
      setClientName(appointment.clientName);
      setService(appointment.service);
      setAmount(appointment.amount.toString());
      setPaymentStatus(appointment.paymentStatus);
    } else {
      resetForm();
    }
  }, [appointment, open]);

  const resetForm = () => {
    setDate(new Date());
    setTime('10:00');
    setClientName('');
    setService('');
    setAmount('');
    setPaymentStatus('nao_pago');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const [hours, minutes] = time.split(':').map(Number);
    const fullDate = new Date(date);
    fullDate.setHours(hours, minutes, 0, 0);

    const data = {
      date: fullDate,
      clientName,
      service,
      amount: parseFloat(amount) || 0,
      paymentStatus,
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
            <Input
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="Ex: Maria Silva"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Serviço</Label>
            <Input
              value={service}
              onChange={(e) => setService(e.target.value)}
              placeholder="Ex: Manicure + Pedicure"
              required
            />
          </div>

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
            <Label>Status do Pagamento</Label>
            <Select value={paymentStatus} onValueChange={(v) => setPaymentStatus(v as PaymentStatus)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="nao_pago">Não pago</SelectItem>
                <SelectItem value="sinal">Sinal</SelectItem>
                <SelectItem value="pago">Pago</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2 pt-4">
            {appointment && onDelete && (
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
