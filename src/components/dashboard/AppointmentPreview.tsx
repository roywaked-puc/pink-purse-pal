import { useState } from 'react';
import { Link } from 'react-router-dom';
import { format, isToday, addMinutes } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Clock, User, Pencil, Trash2, DollarSign, MessageCircle, CalendarPlus, Calendar, FileText, Check, CheckCheck, X, Camera } from 'lucide-react';
import { Appointment, ConfirmationStatus } from '@/types';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useUpdateConfirmationStatus } from '@/hooks/useAppointments';
import { ClientPhotosDialog } from '@/components/clients/ClientPhotosDialog';
import { PostAttendancePhotoPrompt } from '@/components/clients/PostAttendancePhotoPrompt';
import { PhotoUploadDialog } from '@/components/clients/PhotoUploadDialog';


const confirmationStatusConfig: Record<ConfirmationStatus, { icon: React.ElementType; color: string; bg: string; label: string }> = {
  pendente: { icon: Clock, color: 'text-amber-600', bg: 'bg-amber-100', label: 'Pendente' },
  confirmado: { icon: Check, color: 'text-blue-600', bg: 'bg-blue-100', label: 'Confirmado' },
  atendido: { icon: CheckCheck, color: 'text-green-600', bg: 'bg-green-100', label: 'Atendido' },
  cancelado: { icon: X, color: 'text-red-600', bg: 'bg-red-100', label: 'Cancelado' },
};

interface AppointmentPreviewProps {
  appointment: Appointment;
  serviceColor?: string;
  onEdit: (appointment: Appointment) => void;
  onDelete: (id: string) => void;
  onReceive?: (appointment: Appointment) => void;
  getClientPhone?: (clientId: string) => string | undefined;
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

const formatWhatsAppMessage = (appointment: Appointment) => {
  const date = format(new Date(appointment.date), "dd/MM/yyyy", { locale: ptBR });
  const time = format(new Date(appointment.date), "HH:mm");

  const message = `Olá ${appointment.clientName}! 

Passando para lembrar do seu agendamento:

📅 Data: ${date}
⏰ Horário: ${time}
💅 Serviço: ${appointment.service}
💰 Valor: ${formatCurrency(appointment.amount)}

Em caso de imprevistos ou necessidade de cancelamento, por favor entre em contato por este WhatsApp o mais breve possível.

Aguardamos você! ✨`;

  return encodeURIComponent(message);
};

const formatGoogleCalendarUrl = (appointment: Appointment, durationMinutes: number = 60) => {
  const startDate = new Date(appointment.date);
  const endDate = addMinutes(startDate, durationMinutes);
  
  // Formato: YYYYMMDDTHHmmss (sem timezone para horário local)
  const formatDateForGoogle = (date: Date) => {
    return format(date, "yyyyMMdd'T'HHmmss");
  };
  
  const title = encodeURIComponent(`${appointment.clientName} - ${appointment.service}`);
  const details = encodeURIComponent(`Cliente: ${appointment.clientName}\nServiço: ${appointment.service}\nValor: ${formatCurrency(appointment.amount)}`);
  const dates = `${formatDateForGoogle(startDate)}/${formatDateForGoogle(endDate)}`;
  
  return `https://www.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dates}&details=${details}`;
};

export function AppointmentPreview({ appointment, serviceColor, onEdit, onDelete, onReceive, getClientPhone }: AppointmentPreviewProps) {
  const { mutate: updateStatus } = useUpdateConfirmationStatus();
  const [historyOpen, setHistoryOpen] = useState(false);
  const [photoPromptOpen, setPhotoPromptOpen] = useState(false);
  const [photoUploadOpen, setPhotoUploadOpen] = useState(false);
  const appointmentDate = new Date(appointment.date);
  const isAppointmentToday = isToday(appointmentDate);
  const paymentStatus = getPaymentStatus(appointment);
  const hasBalance = appointment.paidAmount < appointment.amount;
  const canDelete = appointment.paidAmount === 0;
  const canComplete = appointment.confirmationStatus !== 'atendido' && appointment.confirmationStatus !== 'cancelado';
  const confirmationConfig = confirmationStatusConfig[appointment.confirmationStatus];
  const ConfirmationIcon = confirmationConfig.icon;

  const clientPhone = getClientPhone?.(appointment.clientId || '');
  const hasPhone = clientPhone && clientPhone.length > 0;
  const cleanPhone = clientPhone?.replace(/\D/g, '') || '';
  const whatsappLink = `https://wa.me/55${cleanPhone}?text=${formatWhatsAppMessage(appointment)}`;

  const handleQuickComplete = () => {
    updateStatus({ id: appointment.id, status: 'atendido' });
    if (hasBalance && onReceive) {
      // abre o form de recebimento já pré-preenchido
      onReceive(appointment);
    }
    if (appointment.clientId) {
      setPhotoPromptOpen(true);
    }
  };


  return (
    <div 
      style={{
        ...(serviceColor && {
          backgroundColor: `${serviceColor}20`,
          borderLeftColor: serviceColor,
          borderLeftWidth: '4px'
        })
      }}
      className={cn(
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
        <div className="flex items-center gap-1.5">
          <span className={cn(
            "flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full",
            confirmationConfig.bg, confirmationConfig.color
          )}>
            <ConfirmationIcon className="w-3 h-3" />
            {confirmationConfig.label}
          </span>
          <span className={cn(
            "text-xs font-medium px-2.5 py-1 rounded-full",
            paymentStatus === 'pago' && "status-paid",
            paymentStatus === 'nao_pago' && "status-pending",
            paymentStatus === 'sinal' && "status-today"
          )}>
            {statusLabels[paymentStatus]}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-2">
        <User className="w-4 h-4 text-muted-foreground" />
        {appointment.clientId ? (
          <Link
            to={`/cliente/${appointment.clientId}`}
            className="font-medium hover:text-primary hover:underline transition-colors"
          >
            {appointment.clientName}
          </Link>
        ) : (
          <span className="font-medium">{appointment.clientName}</span>
        )}
      </div>

      {appointment.notes && (
        <div className="flex items-start gap-2 mb-2">
          <FileText className="w-3 h-3 text-muted-foreground mt-0.5 flex-shrink-0" />
          <p className="text-xs text-muted-foreground italic line-clamp-2">
            {appointment.notes}
          </p>
        </div>
      )}

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
          <Button
            variant="ghost"
            size="icon"
            asChild
            className={cn(
              "h-8 w-8",
              appointment.googleEventId 
                ? "text-green-600 hover:text-green-700"
                : "text-blue-600 hover:text-blue-700"
            )}
          >
            <a 
              href={appointment.googleEventId 
                ? 'https://calendar.google.com' 
                : formatGoogleCalendarUrl(appointment, appointment.duration)
              } 
              target="_blank" 
              rel="noopener noreferrer"
            >
              {appointment.googleEventId 
                ? <Calendar className="w-4 h-4" />
                : <CalendarPlus className="w-4 h-4" />
              }
            </a>
          </Button>
          {hasPhone && (
            <Button
              variant="ghost"
              size="icon"
              asChild
              className="h-8 w-8 text-green-600 hover:text-green-700"
            >
              <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="w-4 h-4" />
              </a>
            </Button>
          )}
          {canComplete && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleQuickComplete}
              className="h-8 w-8 text-emerald-600 hover:text-emerald-700"
              title={hasBalance ? 'Concluir e receber' : 'Marcar como atendido'}
            >
              <CheckCheck className="w-4 h-4" />
            </Button>
          )}
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