import { useState } from 'react';
import { Link } from 'react-router-dom';
import { format, isToday, addMinutes } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Clock, User, Pencil, Trash2, DollarSign, MessageCircle, CalendarPlus, Calendar, FileText, CheckCheck, Camera, MoreHorizontal } from 'lucide-react';
import { Appointment } from '@/types';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useUpdateConfirmationStatus } from '@/hooks/useAppointments';
import { ClientPhotosDialog } from '@/components/clients/ClientPhotosDialog';
import { useUserSettings } from '@/hooks/useUserSettings';
import { StatusBadge } from '@/components/ds/StatusBadge';
import { MoneyDisplay } from '@/components/ds/MoneyDisplay';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from '@/components/ui/drawer';
import { useApp } from '@/contexts/AppContext';
import { AppointmentChips } from '@/components/ds/AppointmentChips';
import { getCorServico } from '@/lib/corServico';


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
  const { getServiceById } = useApp();
  const { mutate: updateStatus } = useUpdateConfirmationStatus();
  const [historyOpen, setHistoryOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);

  const appointmentDate = new Date(appointment.date);
  const isAppointmentToday = isToday(appointmentDate);
  const paymentStatus = getPaymentStatus(appointment);
  const appointmentService = appointment.serviceId ? getServiceById(appointment.serviceId) : undefined;
  const resolvedServiceColor = getCorServico(appointmentService) ?? serviceColor;
  const { data: userSettings } = useUserSettings();
  const caixaAtivo = !!userSettings?.caixa_reserva_ativo;
  const reserva = appointment.caixaReservaValorAplicado ?? userSettings?.caixa_reserva_valor ?? 0;
  const showCaixaSplit =
    caixaAtivo && !appointment.isPermuta && appointment.paidAmount > 0 && reserva > 0;
  const caixaEmpresa = Math.min(appointment.paidAmount, reserva);
  const caixaPessoal = appointment.paidAmount - caixaEmpresa;

  // Permuta também usa o "$ Receber" — a baixa vai para uma conta de permuta.
  const hasBalance = appointment.paidAmount < appointment.amount;
  const canDelete = appointment.paidAmount === 0;
  const canComplete = appointment.confirmationStatus !== 'atendido' && appointment.confirmationStatus !== 'cancelado';

  const clientPhone = getClientPhone?.(appointment.clientId || '');
  const hasPhone = clientPhone && clientPhone.length > 0;
  const cleanPhone = clientPhone?.replace(/\D/g, '') || '';
  const whatsappLink = `https://wa.me/55${cleanPhone}?text=${formatWhatsAppMessage(appointment)}`;

  const handleQuickComplete = () => {
    updateStatus({ id: appointment.id, status: 'atendido' });
  };


  return (
    <div 
      style={{
        ...(resolvedServiceColor && {
          backgroundColor: `color-mix(in srgb, ${resolvedServiceColor} 20%, transparent)`,
          borderLeftColor: resolvedServiceColor,
          borderLeftWidth: '4px'
        })
      }}
      className={cn(
        "min-w-0 p-3 sm:p-4 rounded-xl bg-card border border-border shadow-soft animate-fade-in",
        isAppointmentToday && "ring-2 ring-primary/30"
      )}>
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <p className="flex items-center gap-1.5 text-sm font-semibold whitespace-nowrap">
          <Clock className="w-4 h-4 shrink-0 text-muted-foreground" />
          {format(appointmentDate, 'EEEE', { locale: ptBR }).slice(0, 3)}, {format(appointmentDate, 'dd/MM · HH:mm')}
        </p>
        <div className="flex flex-wrap items-center gap-1.5">
          <StatusBadge status={appointment.confirmationStatus} className="whitespace-nowrap" />
          <StatusBadge status={paymentStatus} className="whitespace-nowrap" />
        </div>
      </div>

      <div className="flex items-center gap-2 mb-2 min-w-0">
        <User className="w-4 h-4 shrink-0 text-muted-foreground" />
        {appointment.clientId ? (
          <Link to={`/cliente/${appointment.clientId}`} className="min-w-0 text-[17px] font-bold break-words hover:text-primary hover:underline transition-colors">
            {appointment.clientName}
          </Link>
        ) : (
          <span className="min-w-0 text-[17px] font-bold break-words">{appointment.clientName}</span>
        )}
        {appointment.parentAppointmentId && (
          <span className="shrink-0 text-[10px] font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground">🔄 Retorno</span>
        )}
      </div>

      <AppointmentChips appointment={appointment} service={appointmentService}
        className="mb-3 [&>p]:text-muted-foreground [&>p]:font-normal [&>div]:gap-1.5 [&_span]:whitespace-nowrap" />

      {appointment.notes && (
        <div className="flex items-start gap-2 mb-2">
          <FileText className="w-3 h-3 text-muted-foreground mt-0.5 flex-shrink-0" />
          <p className="text-xs text-muted-foreground italic line-clamp-2">
            {appointment.notes}
          </p>
        </div>
      )}

      <div className="border-t border-border pt-2 flex items-center justify-between gap-1">
        <MoneyDisplay value={appointment.amount} size="sm" className="text-primary shrink-0" />
        <div className="flex shrink-0">
          <Button variant="ghost" size="icon" className="h-11 w-11 text-success" aria-label="WhatsApp" title="WhatsApp"
            disabled={!hasPhone} onClick={() => window.open(whatsappLink, '_blank', 'noopener,noreferrer')}>
            <MessageCircle className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-11 w-11 text-success" aria-label="Marcar como atendido" title="Marcar como atendido"
            disabled={!canComplete} onClick={handleQuickComplete}>
            <CheckCheck className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-11 w-11 text-success" aria-label="Registrar pagamento" title="Registrar pagamento"
            disabled={!hasBalance || !onReceive} onClick={() => onReceive?.(appointment)}>
            <DollarSign className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-11 w-11" aria-label="Mais ações" title="Mais ações" onClick={() => setMoreOpen(true)}>
            <MoreHorizontal className="w-5 h-5" />
          </Button>
        </div>
      </div>
      {appointment.paidAmount > 0 && appointment.paidAmount < appointment.amount && (
        <p className="text-xs text-muted-foreground">Recebido: {formatCurrency(appointment.paidAmount)}</p>
      )}
      {showCaixaSplit && (
        <p className="text-xs text-muted-foreground break-words">
          Caixa empresa {formatCurrency(caixaEmpresa)} · Caixa pessoal {formatCurrency(caixaPessoal)}
        </p>
      )}

      <Drawer open={moreOpen} onOpenChange={setMoreOpen}>
        <DrawerContent className="max-h-[85dvh]">
          <div className="w-full max-w-lg mx-auto overflow-y-auto pb-6">
            <DrawerHeader className="text-left">
              <DrawerTitle className="break-words leading-snug">{appointment.clientName} · {appointmentService?.techniqueName || appointment.service}</DrawerTitle>
              <DrawerDescription>{format(appointmentDate, "EEE, dd/MM · HH:mm", { locale: ptBR })}</DrawerDescription>
            </DrawerHeader>
            <div className="px-4">
              <Button variant="ghost" className="h-[52px] w-full justify-start gap-3" onClick={() => { setMoreOpen(false); onEdit(appointment); }}>
                <Pencil className="w-5 h-5" /> Editar agendamento
              </Button>
              <Button variant="ghost" className="h-[52px] w-full justify-start gap-3" onClick={() => { setMoreOpen(false); onEdit(appointment); }}>
                <Calendar className="w-5 h-5" /> Reagendar
              </Button>
              <Button variant="ghost" className="h-[52px] w-full justify-start gap-3" disabled={!appointment.clientId} onClick={() => { setMoreOpen(false); setHistoryOpen(true); }}>
                <Camera className="w-5 h-5" /> Adicionar fotos
              </Button>
              <Button variant="ghost" asChild className="h-[52px] w-full justify-start gap-3">
                <a href={appointment.googleEventId ? 'https://calendar.google.com' : formatGoogleCalendarUrl(appointment, appointment.duration)} target="_blank" rel="noopener noreferrer">
                  <CalendarPlus className="w-5 h-5" /> Google Calendar
                </a>
              </Button>
              <div className="border-t border-border my-2" />
              <Button variant="ghost" className="h-[52px] w-full justify-start gap-3 text-destructive hover:text-destructive" disabled={!canDelete}
                onClick={() => { setMoreOpen(false); onDelete(appointment.id); }}>
                <Trash2 className="w-5 h-5" /> Excluir agendamento
              </Button>
            </div>
          </div>
        </DrawerContent>
      </Drawer>

      {appointment.clientId && (
        <ClientPhotosDialog
          open={historyOpen}
          onOpenChange={setHistoryOpen}
          clientId={appointment.clientId}
          clientName={appointment.clientName}
        />
      )}
    </div>
  );
}
