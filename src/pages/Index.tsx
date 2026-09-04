import { useState, useRef } from 'react';
import { isToday } from 'date-fns';
import { Briefcase, User, TrendingDown, Plus, Calendar, AlertCircle, Search, Eye, EyeOff, Sun } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { BalanceCard } from '@/components/dashboard/BalanceCard';
import { AppointmentPreview } from '@/components/dashboard/AppointmentPreview';
import { ReturnsToConfirmCard } from '@/components/dashboard/ReturnsToConfirmCard';
import { TransactionForm } from '@/components/transactions/TransactionForm';
import { AppointmentForm, AppointmentPrefill } from '@/components/appointments/AppointmentForm';
import { PostAttendancePhotoPrompt } from '@/components/clients/PostAttendancePhotoPrompt';
import { PhotoUploadDialog } from '@/components/clients/PhotoUploadDialog';
import { DeleteConfirmDialog } from '@/components/shared/DeleteConfirmDialog';
import { EmptyState } from '@/components/ds/EmptyState';
import { Button } from '@/components/ui/button';
import { useApp } from '@/contexts/AppContext';
import { useServices } from '@/hooks/useServices';
import { Appointment } from '@/types';

const Index = () => {
  const {
    appointments,
    getBusinessBalance,
    getPersonalBalance,
    getMonthlyPersonalExpenses,
    deleteAppointment,
    getClientById,
  } = useApp();

  const { data: services } = useServices();

  const getClientPhone = (clientId: string) => getClientById(clientId)?.phone;
  const getServiceColor = (serviceId?: string) =>
    serviceId ? services?.find((s) => s.id === serviceId)?.color || undefined : undefined;

  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [showAppointmentForm, setShowAppointmentForm] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [deleteAppointmentId, setDeleteAppointmentId] = useState<string | null>(null);
  const [receivingAppointment, setReceivingAppointment] = useState<Appointment | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [photoPromptSource, setPhotoPromptSource] = useState<Appointment | null>(null);
  const [photoUploadSource, setPhotoUploadSource] = useState<Appointment | null>(null);
  const [returnPrefill, setReturnPrefill] = useState<AppointmentPrefill | null>(null);
  const didOpenUpload = useRef(false);
  const [balancesVisible, setBalancesVisible] = useState(
    () => localStorage.getItem('balancesVisible') === 'true',
  );

  const toggleBalances = () => {
    const newState = !balancesVisible;
    setBalancesVisible(newState);
    localStorage.setItem('balancesVisible', String(newState));
  };

  const matchesSearch = (a: Appointment) =>
    searchQuery === '' || a.clientName.toLowerCase().includes(searchQuery.toLowerCase());

  // Agendamentos de HOJE (todos, independente de status)
  const todayAppointments = appointments
    .filter((a) => isToday(new Date(a.date)) && a.confirmationStatus !== 'cancelado' && matchesSearch(a))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Futuros (depois de hoje) que ainda precisam de ação
  const upcomingAppointments = appointments
    .filter((a) => {
      const d = new Date(a.date);
      const isFuture = d >= new Date() && !isToday(d);
      const isCompleted = a.confirmationStatus === 'atendido' || a.confirmationStatus === 'cancelado';
      const isPaid = a.paidAmount >= a.amount;
      return matchesSearch(a) && isFuture && (!isCompleted || !isPaid);
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Passados pendentes
  const pendingCompletionAppointments = appointments
    .filter((a) => {
      const d = new Date(a.date);
      const isPast = d < new Date() && !isToday(d);
      const isNotCompleted = a.confirmationStatus === 'pendente' || a.confirmationStatus === 'confirmado';
      const isNotPaid = a.paidAmount < a.amount;
      return (
        matchesSearch(a) &&
        isPast &&
        a.confirmationStatus !== 'cancelado' &&
        (isNotCompleted || isNotPaid)
      );
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const handleEditAppointment = (appointment: Appointment) => {
    setEditingAppointment(appointment);
    setShowAppointmentForm(true);
  };
  const handleDeleteAppointment = (id: string) => setDeleteAppointmentId(id);
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

  const triggerPostAttendance = (apt: Appointment) => {
    if (apt.clientId) {
      setPhotoPromptSource(apt);
    }
  };

  const renderAppointmentList = (list: Appointment[]) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {list.map((appointment, index) => (
        <div
          key={appointment.id}
          style={{ animationDelay: `${index * 80}ms` }}
          className="animate-slide-up"
        >
          <AppointmentPreview
            appointment={appointment}
            serviceColor={getServiceColor(appointment.serviceId)}
            onEdit={handleEditAppointment}
            onDelete={handleDeleteAppointment}
            onReceive={handleReceiveAppointment}
            onAttendanceCompleted={triggerPostAttendance}
            getClientPhone={getClientPhone}
          />
        </div>
      ))}
    </div>
  );

  return (
    <MainLayout>
      <PageHeader
        title="Meu Dia ☀️"
        subtitle="Sua agenda e seus números"
        action={
          <button
            onClick={toggleBalances}
            className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            title={balancesVisible ? 'Ocultar saldos' : 'Exibir saldos'}
          >
            {balancesVisible ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        }
      />

      {/* Busca */}
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

      {/* Retornos para confirmar */}
      <ReturnsToConfirmCard />

      {/* Hoje — o foco do dia */}
      <section className="mb-6">
        <h2 className="font-semibold mb-3 flex items-center gap-2">
          <Sun className="w-5 h-5 text-primary" />
          Hoje
        </h2>
        {todayAppointments.length > 0 ? (
          renderAppointmentList(todayAppointments)
        ) : (
          <EmptyState
            icon={Sun}
            title="Nenhum atendimento para hoje"
            description="Aproveite para organizar a semana ou agendar um cliente."
            action={
              <Button
                size="sm"
                onClick={() => {
                  setEditingAppointment(null);
                  setShowAppointmentForm(true);
                }}
              >
                <Plus className="w-4 h-4 mr-1" />
                Novo agendamento
              </Button>
            }
          />
        )}
      </section>

      {/* Ações rápidas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Button onClick={() => setShowTransactionForm(true)} className="h-12">
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

      {/* Saldos */}
      {balancesVisible ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <BalanceCard
            title={caixaAtivo ? "Caixa Empresa" : "Saldo da Empresa"}
            value={getBusinessBalance()}
            icon={Briefcase}
            variant="primary"
          />
          <div className="grid grid-cols-2 md:contents gap-3">
            <BalanceCard
              title={caixaAtivo ? "Caixa Pessoal" : "Saldo Pessoal"}
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
      ) : (
        <button
          onClick={toggleBalances}
          className="w-full mb-6 p-4 rounded-xl border border-dashed border-border bg-muted/40 flex items-center justify-center gap-2 text-muted-foreground hover:bg-muted transition-colors"
        >
          <Eye className="w-4 h-4" />
          <span className="text-sm">Saldos ocultos — toque para exibir</span>
        </button>
      )}

      {/* Próximos */}
      {upcomingAppointments.length > 0 && (
        <section className="mb-6">
          <h2 className="font-semibold mb-3 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            Próximos Agendamentos
          </h2>
          {renderAppointmentList(upcomingAppointments)}
        </section>
      )}

      {/* Pendentes de conclusão */}
      {pendingCompletionAppointments.length > 0 && (
        <section>
          <h2 className="font-semibold mb-3 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-amber-500" />
            Pendentes de Conclusão
          </h2>
          {renderAppointmentList(pendingCompletionAppointments)}
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
          if (!open) {
            setEditingAppointment(null);
            setReturnPrefill(null);
          }
        }}
        appointment={editingAppointment}
        prefill={returnPrefill}
        onDelete={() => {
          if (editingAppointment) {
            setDeleteAppointmentId(editingAppointment.id);
            setShowAppointmentForm(false);
          }
        }}
        onAttendanceConfirmed={(apt) => {
          triggerPostAttendance(apt);
          setShowAppointmentForm(false);
        }}
      />

      <DeleteConfirmDialog
        open={!!deleteAppointmentId}
        onOpenChange={() => setDeleteAppointmentId(null)}
        onConfirm={confirmDeleteAppointment}
        title="Excluir agendamento"
        description="Tem certeza que deseja excluir este agendamento?"
      />

      {photoPromptSource && (
        <PostAttendancePhotoPrompt
          open={!!photoPromptSource}
          onOpenChange={(o) => {
            if (!o) {
              setPhotoPromptSource(null);
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
              setPhotoUploadSource(null);
              didOpenUpload.current = false;
            }
          }}
          clientId={photoUploadSource.clientId}
          appointmentId={photoUploadSource.id}
          serviceName={photoUploadSource.service}
          defaultDate={new Date(photoUploadSource.date)}
        />
      )}

    </MainLayout>
  );
};

export default Index;
