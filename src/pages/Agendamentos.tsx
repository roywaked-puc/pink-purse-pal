import { useState, useMemo, useRef } from 'react';
import { Plus, Calendar, DollarSign, MessageCircle, List, CalendarDays, FileText, Clock, User, Pencil, Trash2, Check, CheckCheck, X, CalendarPlus, Search, Grid3X3 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { format, isToday, isFuture, isPast, addMinutes } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { AppointmentForm } from '@/components/appointments/AppointmentForm';
import { TransactionForm } from '@/components/transactions/TransactionForm';
import { DeleteConfirmDialog } from '@/components/shared/DeleteConfirmDialog';
import { WeeklyCalendar } from '@/components/appointments/WeeklyCalendar';
import { MonthlyCalendar } from '@/components/appointments/MonthlyCalendar';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useApp } from '@/contexts/AppContext';
import { Appointment, ConfirmationStatus } from '@/types';
import { cn } from '@/lib/utils';
import { useUpdateConfirmationStatus } from '@/hooks/useAppointments';
import { PostAttendancePhotoPrompt } from '@/components/clients/PostAttendancePhotoPrompt';
import { PhotoUploadDialog } from '@/components/clients/PhotoUploadDialog';
import { ScheduleReturnDialog } from '@/components/appointments/ScheduleReturnDialog';


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

const formatGoogleCalendarUrl = (appointment: Appointment, durationMinutes: number = 60) => {
  const startDate = new Date(appointment.date);
  const endDate = addMinutes(startDate, durationMinutes);
  
  const formatDateForGoogle = (date: Date) => {
    return format(date, "yyyyMMdd'T'HHmmss");
  };
  
  const title = encodeURIComponent(`${appointment.service} - ${appointment.clientName}`);
  const details = encodeURIComponent(`Cliente: ${appointment.clientName}\nServiço: ${appointment.service}\nValor: ${formatCurrency(appointment.amount)}${appointment.notes ? `\nObservações: ${appointment.notes}` : ''}`);
  const dates = `${formatDateForGoogle(startDate)}/${formatDateForGoogle(endDate)}`;
  
  return `https://www.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dates}&details=${details}`;
};

const confirmationStatusConfig = {
  pendente: { icon: Clock, color: 'text-muted-foreground', bgColor: 'bg-muted', label: 'Pendente' },
  confirmado: { icon: Check, color: 'text-emerald-600', bgColor: 'bg-emerald-100 dark:bg-emerald-900/30', label: 'Confirmado' },
  atendido: { icon: CheckCheck, color: 'text-blue-600', bgColor: 'bg-blue-100 dark:bg-blue-900/30', label: 'Atendido' },
  cancelado: { icon: X, color: 'text-destructive', bgColor: 'bg-destructive/10', label: 'Cancelado' },
};

const Agendamentos = () => {
  const { appointments, deleteAppointment, getClientById, getServiceById } = useApp();
  const { mutate: updateConfirmationStatus } = useUpdateConfirmationStatus();

  const getClientPhone = (clientId: string) => {
    const client = getClientById(clientId);
    return client?.phone;
  };
  
  const [showForm, setShowForm] = useState(false);
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [receivingAppointment, setReceivingAppointment] = useState<Appointment | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'week' | 'month'>('month');
  const [searchQuery, setSearchQuery] = useState('');
  const [photoPromptSource, setPhotoPromptSource] = useState<Appointment | null>(null);
  const [photoUploadSource, setPhotoUploadSource] = useState<Appointment | null>(null);
  const [returnSource, setReturnSource] = useState<Appointment | null>(null);
  const didOpenUpload = useRef(false);



  const sortedAppointments = useMemo(() => {
    return [...appointments]
      .filter(a => searchQuery === '' || 
        a.clientName.toLowerCase().includes(searchQuery.toLowerCase()))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [appointments, searchQuery]);

  const todayAppointments = sortedAppointments.filter(a => isToday(new Date(a.date)));
  const upcomingAppointments = sortedAppointments.filter(a => 
    isFuture(new Date(a.date)) && !isToday(new Date(a.date))
  );
  const pastAppointments = sortedAppointments.filter(a => 
    isPast(new Date(a.date)) && !isToday(new Date(a.date))
  ).reverse();

  const handleEdit = (appointment: Appointment) => {
    setEditingAppointment(appointment);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    setDeleteId(id);
  };

  const handleReceive = (appointment: Appointment) => {
    setReceivingAppointment(appointment);
    setShowTransactionForm(true);
  };

  const confirmDelete = () => {
    if (deleteId) {
      deleteAppointment(deleteId);
      setDeleteId(null);
    }
  };
  const handleConfirmationStatusChange = (appointmentId: string, status: ConfirmationStatus) => {
    if (status === 'atendido') {
      const apt = appointments.find(a => a.id === appointmentId);
      if (apt) {
        handleMarkAttended(apt);
        return;
      }
    }
    updateConfirmationStatus({ id: appointmentId, status });
  };

  const triggerPostAttendance = (apt: Appointment) => {
    if (apt.clientId) {
      setPhotoPromptSource(apt);
    } else {
      setReturnSource(apt);
    }
  };

  const handleMarkAttended = (apt: Appointment) => {
    if (apt.confirmationStatus !== 'atendido') {
      updateConfirmationStatus({ id: apt.id, status: 'atendido' });
    }
    const stillHasBalance = apt.paidAmount < apt.amount;
    if (stillHasBalance) {
      handleReceive(apt);
    }
    triggerPostAttendance(apt);
  };

  // Disparado pelo formulário: status já salvo, apenas abrir a sequência fotos/retorno
  const handleAttendanceFromForm = (apt: Appointment) => {
    triggerPostAttendance(apt);
  };



  const renderAppointment = (appointment: Appointment, index: number) => {
    const appointmentDate = new Date(appointment.date);
    const isAppointmentToday = isToday(appointmentDate);
    const paymentStatus = getPaymentStatus(appointment);
    const hasBalance = appointment.paidAmount < appointment.amount;
    const canDelete = appointment.paidAmount === 0;
    const service = appointment.serviceId ? getServiceById(appointment.serviceId) : undefined;
    const serviceColor = service?.color;
    const confirmationConfig = confirmationStatusConfig[appointment.confirmationStatus] || confirmationStatusConfig.pendente;
    const ConfirmationIcon = confirmationConfig.icon;

      return (
        <div
          key={appointment.id}
          style={{ 
            animationDelay: `${index * 50}ms`,
            ...(serviceColor && {
              backgroundColor: `${serviceColor}20`,
              borderLeftColor: serviceColor,
              borderLeftWidth: '4px'
            })
          }}
          className={cn(
            "p-4 rounded-xl bg-card border border-border shadow-soft animate-fade-in",
            isAppointmentToday && "ring-2 ring-primary/30"
          )}
        >
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            {/* Confirmation Status Icon */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className={cn(
                    "p-2 rounded-lg transition-colors",
                    confirmationConfig.bgColor
                  )}
                >
                  <ConfirmationIcon className={cn("w-4 h-4", confirmationConfig.color)} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem onClick={() => handleConfirmationStatusChange(appointment.id, 'pendente')}>
                  <Clock className="w-4 h-4 mr-2 text-muted-foreground" />
                  Pendente
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleConfirmationStatusChange(appointment.id, 'confirmado')}>
                  <Check className="w-4 h-4 mr-2 text-emerald-600" />
                  Confirmado
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleConfirmationStatusChange(appointment.id, 'atendido')}>
                  <CheckCheck className="w-4 h-4 mr-2 text-blue-600" />
                  Atendido
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleConfirmationStatusChange(appointment.id, 'cancelado')}>
                  <X className="w-4 h-4 mr-2 text-destructive" />
                  Cancelado
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <div>
              <p className="text-sm font-medium">
                {format(appointmentDate, "dd 'de' MMMM", { locale: ptBR })}
              </p>
              <p className="text-xs text-muted-foreground">
                {format(appointmentDate, "HH:mm")}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={cn(
              "text-xs px-2 py-0.5 rounded-full",
              confirmationConfig.bgColor,
              confirmationConfig.color
            )}>
              {confirmationConfig.label}
            </span>
            <span className={cn(
              "text-xs font-medium px-2.5 py-1 rounded-full",
              paymentStatus === 'pago' && "status-paid",
              paymentStatus === 'nao_pago' && "status-pending",
              paymentStatus === 'sinal' && "status-today"
            )}>
              {paymentStatus === 'pago' ? 'Pago' : paymentStatus === 'sinal' ? 'Sinal' : 'Não pago'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-2">
          <User className="w-4 h-4 text-muted-foreground" />
          <span className="font-medium">{appointment.clientName}</span>
        </div>

        {appointment.notes && (
          <div className="flex items-start gap-2 mb-3">
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
              onClick={() => handleEdit(appointment)}
              className="h-8 w-8"
            >
              <Pencil className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              asChild
              className="h-8 w-8 text-blue-600 hover:text-blue-700"
            >
              <a href={formatGoogleCalendarUrl(appointment, appointment.duration)} target="_blank" rel="noopener noreferrer">
                <CalendarPlus className="w-4 h-4" />
              </a>
            </Button>
            {(() => {
              const clientPhone = getClientPhone(appointment.clientId || '');
              const hasPhone = clientPhone && clientPhone.length > 0;
              const cleanPhone = clientPhone?.replace(/\D/g, '') || '';
              const whatsappLink = `https://wa.me/55${cleanPhone}?text=${formatWhatsAppMessage(appointment)}`;
              
              return hasPhone ? (
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
              ) : null;
            })()}
            {hasBalance && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleMarkAttended(appointment)}
                className="h-8 w-8 text-emerald-600 hover:text-emerald-700"
                title="Concluir e receber"
              >
                <DollarSign className="w-4 h-4" />
              </Button>
            )}
            {!hasBalance && appointment.confirmationStatus !== 'atendido' && appointment.confirmationStatus !== 'cancelado' && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleMarkAttended(appointment)}
                className="h-8 w-8 text-emerald-600 hover:text-emerald-700"
                title="Marcar como atendido"
              >
                <CheckCheck className="w-4 h-4" />
              </Button>
            )}

            {canDelete && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDelete(appointment.id)}
                className="h-8 w-8 text-destructive hover:text-destructive"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  };

  const handleAppointmentClick = (appointment: Appointment) => {
    setEditingAppointment(appointment);
    setShowForm(true);
  };

  return (
    <MainLayout>
      <PageHeader
        title="Agendamentos"
        subtitle="Gerencie sua agenda"
        action={
          <div className="flex items-center gap-2">
            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'list' | 'week' | 'month')}>
              <TabsList className="h-9">
                <TabsTrigger value="list" className="px-2">
                  <List className="w-4 h-4" />
                </TabsTrigger>
                <TabsTrigger value="week" className="px-2">
                  <CalendarDays className="w-4 h-4" />
                </TabsTrigger>
                <TabsTrigger value="month" className="px-2">
                  <Grid3X3 className="w-4 h-4" />
                </TabsTrigger>
              </TabsList>
            </Tabs>
            <Button
              size="icon"
              onClick={() => {
                setEditingAppointment(null);
                setShowForm(true);
              }}
            >
              <Plus className="w-5 h-5" />
            </Button>
          </div>
        }
      />

      {/* Search */}
      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome do cliente..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {viewMode === 'month' ? (
        <MonthlyCalendar 
          appointments={sortedAppointments} 
          onAppointmentClick={handleAppointmentClick} 
        />
      ) : viewMode === 'week' ? (
        <WeeklyCalendar 
          appointments={sortedAppointments} 
          onAppointmentClick={handleAppointmentClick} 
        />
      ) : (
        <>
          {/* Today */}
          {todayAppointments.length > 0 && (
            <section className="mb-6">
              <h2 className="font-semibold mb-3 flex items-center gap-2 text-primary">
                <Calendar className="w-5 h-5" />
                Hoje
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {todayAppointments.map((a, i) => renderAppointment(a, i))}
              </div>
            </section>
          )}

          {/* Upcoming */}
          {upcomingAppointments.length > 0 && (
            <section className="mb-6">
              <h2 className="font-semibold mb-3 text-muted-foreground">Próximos</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {upcomingAppointments.map((a, i) => renderAppointment(a, i))}
              </div>
            </section>
          )}

          {/* Past */}
          {pastAppointments.length > 0 && (
            <section className="mb-6">
              <h2 className="font-semibold mb-3 text-muted-foreground">Anteriores</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 opacity-70">
                {pastAppointments.map((a, i) => renderAppointment(a, i))}
              </div>
            </section>
          )}

          {appointments.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Nenhum agendamento</p>
              <Button
                variant="link"
                onClick={() => {
                  setEditingAppointment(null);
                  setShowForm(true);
                }}
                className="mt-2"
              >
                Adicionar primeiro agendamento
              </Button>
            </div>
          )}
        </>
      )}

      <AppointmentForm
        open={showForm}
        onOpenChange={(open) => {
          setShowForm(open);
          if (!open) setEditingAppointment(null);
        }}
        appointment={editingAppointment}
        onDelete={() => {
          if (editingAppointment) {
            setDeleteId(editingAppointment.id);
            setShowForm(false);
          }
        }}
        onAttendanceConfirmed={(apt) => {
          handleMarkAttended(apt);
          setShowForm(false);
        }}
      />

      <TransactionForm
        open={showTransactionForm}
        onOpenChange={(open) => {
          setShowTransactionForm(open);
          if (!open) setReceivingAppointment(null);
        }}
        prefilledAppointment={receivingAppointment}
      />

      <DeleteConfirmDialog
        open={!!deleteId}
        onOpenChange={() => setDeleteId(null)}
        onConfirm={confirmDelete}
        title="Excluir agendamento"
        description="Tem certeza que deseja excluir este agendamento?"
      />

      {photoPromptSource && (
        <PostAttendancePhotoPrompt
          open={!!photoPromptSource}
          onOpenChange={(o) => {
            if (!o) {
              const src = photoPromptSource;
              setPhotoPromptSource(null);
              // se no escolheu adicionar foto (didOpenUpload.current  false), segue direto pro retorno
              if (src && !didOpenUpload.current) setReturnSource(src);
              didOpenUpload.current = false;
            }
          }}
          clientName={photoPromptSource.clientName}
          onConfirm={() => {
            didOpenUpload.current = true;
            setPhotoUploadSource(photoPromptSource);
            setPhotoPromptSource(null);
          }}
        />
      )}

      {photoUploadSource && photoUploadSource.clientId && (
        <PhotoUploadDialog
          open={!!photoUploadSource}
          onOpenChange={(o) => {
            if (!o) {
              const src = photoUploadSource;
              setPhotoUploadSource(null);
              didOpenUpload.current = false;
              if (src) setReturnSource(src);
            }
          }}
          clientId={photoUploadSource.clientId}
          appointmentId={photoUploadSource.id}
          serviceName={photoUploadSource.service}
          defaultDate={new Date(photoUploadSource.date)}
        />
      )}

      {returnSource && (
        <ScheduleReturnDialog
          open={!!returnSource}
          onOpenChange={(o) => {
            if (!o) setReturnSource(null);
          }}
          sourceAppointment={returnSource}
        />
      )}
    </MainLayout>
  );
};


export default Agendamentos;
