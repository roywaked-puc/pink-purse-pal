import { useState, useMemo } from 'react';
import { Plus, Calendar, DollarSign, MessageCircle } from 'lucide-react';
import { format, isToday, isFuture, isPast } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { AppointmentForm } from '@/components/appointments/AppointmentForm';
import { TransactionForm } from '@/components/transactions/TransactionForm';
import { DeleteConfirmDialog } from '@/components/shared/DeleteConfirmDialog';
import { Button } from '@/components/ui/button';
import { useApp } from '@/contexts/AppContext';
import { Appointment } from '@/types';
import { cn } from '@/lib/utils';
import { Clock, User, Pencil, Trash2 } from 'lucide-react';

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

const statusLabels = {
  pago: 'Pago',
  nao_pago: 'Não pago',
  sinal: 'Sinal',
};

const Agendamentos = () => {
  const { appointments, deleteAppointment, getClientById } = useApp();

  const getClientPhone = (clientId: string) => {
    const client = getClientById(clientId);
    return client?.phone;
  };
  
  const [showForm, setShowForm] = useState(false);
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [receivingAppointment, setReceivingAppointment] = useState<Appointment | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const sortedAppointments = useMemo(() => {
    return [...appointments].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  }, [appointments]);

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

  const renderAppointment = (appointment: Appointment, index: number) => {
    const appointmentDate = new Date(appointment.date);
    const isAppointmentToday = isToday(appointmentDate);
    const paymentStatus = getPaymentStatus(appointment);
    const hasBalance = appointment.paidAmount < appointment.amount;
    const canDelete = appointment.paidAmount === 0;

    return (
      <div
        key={appointment.id}
        style={{ animationDelay: `${index * 50}ms` }}
        className={cn(
          "p-4 rounded-xl bg-card border border-border shadow-soft animate-fade-in",
          isAppointmentToday && "ring-2 ring-primary/30"
        )}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
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
                {format(appointmentDate, "dd 'de' MMMM", { locale: ptBR })}
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
              onClick={() => handleEdit(appointment)}
              className="h-8 w-8"
            >
              <Pencil className="w-4 h-4" />
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
                onClick={() => handleReceive(appointment)}
                className="h-8 w-8 text-green-600 hover:text-green-700"
              >
                <DollarSign className="w-4 h-4" />
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

  return (
    <MainLayout>
      <PageHeader
        title="Agendamentos"
        subtitle="Gerencie sua agenda"
        action={
          <Button
            size="icon"
            onClick={() => {
              setEditingAppointment(null);
              setShowForm(true);
            }}
          >
            <Plus className="w-5 h-5" />
          </Button>
        }
      />

      {/* Today */}
      {todayAppointments.length > 0 && (
        <section className="mb-6">
          <h2 className="font-semibold mb-3 flex items-center gap-2 text-primary">
            <Calendar className="w-5 h-5" />
            Hoje
          </h2>
          <div className="space-y-3">
            {todayAppointments.map((a, i) => renderAppointment(a, i))}
          </div>
        </section>
      )}

      {/* Upcoming */}
      {upcomingAppointments.length > 0 && (
        <section className="mb-6">
          <h2 className="font-semibold mb-3 text-muted-foreground">Próximos</h2>
          <div className="space-y-3">
            {upcomingAppointments.map((a, i) => renderAppointment(a, i))}
          </div>
        </section>
      )}

      {/* Past */}
      {pastAppointments.length > 0 && (
        <section className="mb-6">
          <h2 className="font-semibold mb-3 text-muted-foreground">Anteriores</h2>
          <div className="space-y-3 opacity-70">
            {pastAppointments.slice(0, 5).map((a, i) => renderAppointment(a, i))}
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
    </MainLayout>
  );
};

export default Agendamentos;
