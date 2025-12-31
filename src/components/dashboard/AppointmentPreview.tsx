import { format, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Clock, User, Pencil, Trash2, DollarSign } from 'lucide-react';
import { Appointment } from '@/types';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface AppointmentPreviewProps {
  appointment: Appointment;
  onEdit: (appointment: Appointment) => void;
  onDelete: (id: string) => void;
  onReceive?: (appointment: Appointment) => void;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

const getPaymentStatus = (appointment: Appointment) => {
  if (appointment.paidAmount >= appointment.amount) return 'pago';
  if (appointment.paidAmount > 0) return 'sinal';
  return 'nao_pago';
};

const statusLabels = {
  pago: 'Pago',
  nao_pago: 'Não pago',
  sinal: 'Sinal',
};

export function AppointmentPreview({ appointment, onEdit, onDelete, onReceive }: AppointmentPreviewProps) {
  const appointmentDate = new Date(appointment.date);
  const isAppointmentToday = isToday(appointmentDate);
  const paymentStatus = getPaymentStatus(appointment);
  const hasBalance = appointment.paidAmount < appointment.amount;
  const canDelete = appointment.paidAmount === 0;

  return (
    <div className={cn(
      "p-4 rounded-xl bg-card border border-border shadow-soft animate-fade-in",
      isAppointmentToday && "ring-2 ring-primary/30"
    )}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={cn(
            "p-2 rounded-lg",
            isAppointmentToday ? "bg-primary/15" : "bg-muted"
          )}>
            <Clock className={cn(
              "w-4 h-4",
              isAppointmentToday ? "text-primary" : "text-muted-foreground"
            )} />
          </div>
          <div>
            <p className="text-sm font-medium">
              {format(appointmentDate, "dd 'de' MMM", { locale: ptBR })}
            </p>
            <p className="text-xs text-muted-foreground">
              {format(appointmentDate, "HH:mm")}
            </p>
          </div>
        </div>
        <span className={cn(
          "text-xs font-medium px-2.5 py-1 rounded-full",
          paymentStatus === 'pago' && "status-paid",
          paymentStatus === 'nao_pago' && "status-pending",
          paymentStatus === 'sinal' && "status-today"
        )}>
          {statusLabels[paymentStatus]}
        </span>
      </div>

      <div className="flex items-center gap-2 mb-2">
        <User className="w-4 h-4 text-muted-foreground" />
        <span className="font-medium">{appointment.clientName}</span>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{appointment.service}</p>
          <p className="font-semibold text-primary">{formatCurrency(appointment.amount)}</p>
          {appointment.paidAmount > 0 && appointment.paidAmount < appointment.amount && (
            <p className="text-xs text-muted-foreground">
              Recebido: {formatCurrency(appointment.paidAmount)}
            </p>
          )}
        </div>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onEdit(appointment)}
            className="h-8 w-8"
          >
            <Pencil className="w-4 h-4" />
          </Button>
          {hasBalance && onReceive && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onReceive(appointment)}
              className="h-8 w-8 text-green-600 hover:text-green-700"
            >
              <DollarSign className="w-4 h-4" />
            </Button>
          )}
          {canDelete && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(appointment.id)}
              className="h-8 w-8 text-destructive hover:text-destructive"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}