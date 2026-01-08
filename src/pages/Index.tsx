import { useState } from 'react';
import { Briefcase, User, TrendingDown, Plus, Calendar, AlertCircle } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { BalanceCard } from '@/components/dashboard/BalanceCard';
import { AppointmentPreview } from '@/components/dashboard/AppointmentPreview';
import { TransactionForm } from '@/components/transactions/TransactionForm';
import { AppointmentForm } from '@/components/appointments/AppointmentForm';
import { DeleteConfirmDialog } from '@/components/shared/DeleteConfirmDialog';
import { Button } from '@/components/ui/button';
import { useApp } from '@/contexts/AppContext';
import { Appointment } from '@/types';

const Index = () => {
  const { 
    appointments, 
    getBusinessBalance, 
    getPersonalBalance, 
    getMonthlyPersonalExpenses,
    deleteAppointment,
    getClientById
  } = useApp();

  const getClientPhone = (clientId: string) => {
    const client = getClientById(clientId);
    return client?.phone;
  };

  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [showAppointmentForm, setShowAppointmentForm] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [deleteAppointmentId, setDeleteAppointmentId] = useState<string | null>(null);
  const [receivingAppointment, setReceivingAppointment] = useState<Appointment | null>(null);

  // Filtra agendamentos futuros que ainda têm saldo a receber
  const upcomingAppointments = appointments
    .filter(a => {
      const isFuture = new Date(a.date) >= new Date();
      const isPaid = a.paidAmount >= a.amount;
      return isFuture && !isPaid;
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 3);

  // Filtra agendamentos passados que ainda não foram concluídos nem cancelados
  const pendingCompletionAppointments = appointments
    .filter(a => {
      const isPast = new Date(a.date) < new Date();
      const isNotCompleted = a.confirmationStatus === 'pendente' || a.confirmationStatus === 'confirmado';
      return isPast && isNotCompleted;
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  const handleEditAppointment = (appointment: Appointment) => {
    setEditingAppointment(appointment);
    setShowAppointmentForm(true);
  };

  const handleDeleteAppointment = (id: string) => {
    setDeleteAppointmentId(id);
  };

  const handleReceiveAppointment = (appointment: Appointment) => {
    setReceivingAppointment(appointment);
    setShowTransactionForm(true);
  };

  const confirmDeleteAppointment = () => {
    if (deleteAppointmentId) {
      deleteAppointment(deleteAppointmentId);
      setDeleteAppointmentId(null);
    }
  };

  return (
    <MainLayout>
      <PageHeader 
        title="Olá! 👋"
        subtitle="Seu resumo financeiro"
      />

      {/* Balance Cards */}
      <div className="grid grid-cols-1 gap-4 mb-6">
        <BalanceCard
          title="Saldo da Empresa"
          value={getBusinessBalance()}
          icon={Briefcase}
          variant="primary"
        />
        <div className="grid grid-cols-2 gap-3">
          <BalanceCard
            title="Saldo Pessoal"
            value={getPersonalBalance()}
            icon={User}
            variant="secondary"
          />
          <BalanceCard
            title="Gastos do Mês"
            value={getMonthlyPersonalExpenses()}
            icon={TrendingDown}
            variant="accent"
          />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <Button
          onClick={() => setShowTransactionForm(true)}
          className="h-12"
        >
          <Plus className="w-5 h-5 mr-2" />
          Nova Movimentação
        </Button>
        <Button
          variant="secondary"
          onClick={() => {
            setEditingAppointment(null);
            setShowAppointmentForm(true);
          }}
          className="h-12"
        >
          <Calendar className="w-5 h-5 mr-2" />
          Novo Agendamento
        </Button>
      </div>

      {/* Upcoming Appointments */}
      <section className="mb-6">
        <h2 className="font-semibold mb-3 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary" />
          Próximos Agendamentos
        </h2>
        
        {upcomingAppointments.length > 0 ? (
          <div className="space-y-3">
            {upcomingAppointments.map((appointment, index) => (
              <div
                key={appointment.id}
                style={{ animationDelay: `${index * 100}ms` }}
                className="animate-slide-up"
              >
                <AppointmentPreview
                  appointment={appointment}
                  onEdit={handleEditAppointment}
                  onDelete={handleDeleteAppointment}
                  onReceive={handleReceiveAppointment}
                  getClientPhone={getClientPhone}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>Nenhum agendamento próximo</p>
          </div>
        )}
      </section>

      {/* Pending Completion Appointments */}
      {pendingCompletionAppointments.length > 0 && (
        <section>
          <h2 className="font-semibold mb-3 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-amber-500" />
            Pendentes de Conclusão
          </h2>
          
          <div className="space-y-3">
            {pendingCompletionAppointments.map((appointment, index) => (
              <div
                key={appointment.id}
                style={{ animationDelay: `${index * 100}ms` }}
                className="animate-slide-up"
              >
                <AppointmentPreview
                  appointment={appointment}
                  onEdit={handleEditAppointment}
                  onDelete={handleDeleteAppointment}
                  onReceive={handleReceiveAppointment}
                  getClientPhone={getClientPhone}
                />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Forms */}
      <TransactionForm
        open={showTransactionForm}
        onOpenChange={(open) => {
          setShowTransactionForm(open);
          if (!open) setReceivingAppointment(null);
        }}
        prefilledAppointment={receivingAppointment}
      />

      <AppointmentForm
        open={showAppointmentForm}
        onOpenChange={(open) => {
          setShowAppointmentForm(open);
          if (!open) setEditingAppointment(null);
        }}
        appointment={editingAppointment}
        onDelete={() => {
          if (editingAppointment) {
            setDeleteAppointmentId(editingAppointment.id);
            setShowAppointmentForm(false);
          }
        }}
      />

      <DeleteConfirmDialog
        open={!!deleteAppointmentId}
        onOpenChange={() => setDeleteAppointmentId(null)}
        onConfirm={confirmDeleteAppointment}
        title="Excluir agendamento"
        description="Tem certeza que deseja excluir este agendamento?"
      />
    </MainLayout>
  );
};

export default Index;
