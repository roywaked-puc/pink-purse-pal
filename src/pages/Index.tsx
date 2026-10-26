import { useState } from 'react';
import { format, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import { TrendingDown, Plus, Calendar, AlertCircle, Search, Eye, EyeOff, Sun } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { MainLayout } from '@/components/layout/MainLayout';
import { BalanceCard } from '@/components/dashboard/BalanceCard';
import { CaixaSaldoResumo } from '@/components/ds/CaixaSaldoResumo';
import { CaixaDetalheDrawer, CaixaDetalheTipo } from '@/components/dashboard/CaixaDetalheDrawer';
import { AppointmentPreview } from '@/components/dashboard/AppointmentPreview';
import { ReturnsToConfirmCard } from '@/components/dashboard/ReturnsToConfirmCard';
import { TransactionForm } from '@/components/transactions/TransactionForm';
import { AppointmentForm, AppointmentPrefill } from '@/components/appointments/AppointmentForm';
import { DeleteConfirmDialog } from '@/components/shared/DeleteConfirmDialog';
import { ClientPhotosDialog } from '@/components/clients/ClientPhotosDialog';
import { EmptyState } from '@/components/ds/EmptyState';
import { Button } from '@/components/ui/button';
import { useApp } from '@/contexts/AppContext';
import { useUserSettings } from '@/hooks/useUserSettings';
import { useServices } from '@/hooks/useServices';
import { useCaixaSummary } from '@/hooks/useCaixaSummary';
import { Appointment } from '@/types';
import { getCorServico } from '@/lib/corServico';

const Index = () => {
  const {
    appointments,
    getMonthlyPersonalExpenses,
    deleteAppointment,
    getClientById,
  } = useApp();

  const { data: services } = useServices();
  const { data: userSettings } = useUserSettings();
  const caixaAtivo = !!userSettings?.caixa_reserva_ativo;
  const resumoCaixa = useCaixaSummary();

  const getClientPhone = (clientId: string) => getClientById(clientId)?.phone;
  const getServiceColor = (serviceId?: string) =>
    serviceId ? getCorServico(services?.find((s) => s.id === serviceId)) : undefined;

  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [showAppointmentForm, setShowAppointmentForm] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [deleteAppointmentId, setDeleteAppointmentId] = useState<string | null>(null);
  const [receivingAppointment, setReceivingAppointment] = useState<Appointment | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [returnPrefill, setReturnPrefill] = useState<AppointmentPrefill | null>(null);
  const [detalheCaixa, setDetalheCaixa] = useState<CaixaDetalheTipo | null>(null);
  // Fotos pós-atendimento: estado na página para não morrer se o card sair da lista.
  const [fotosAtendimento, setFotosAtendimento] = useState<Appointment | null>(null);
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
            getClientPhone={getClientPhone}
            onAtendido={(a) => { if (a.clientId) setFotosAtendimento(a); }}
          />
        </div>
      ))}
    </div>
  );

  return (
    <MainLayout>
      <header className="flex items-center justify-between mb-6 gap-3">
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">{format(new Date(), "EEEE, dd 'de' MMM", { locale: ptBR })}</p>
          <h1 className="text-2xl font-bold mt-1">Meu Dia</h1>
        </div>
        <Button variant="ghost" size="icon" onClick={toggleBalances} className="h-11 w-11 shrink-0 text-muted-foreground"
          aria-label={balancesVisible ? 'Ocultar saldos' : 'Exibir saldos'} title={balancesVisible ? 'Ocultar saldos' : 'Exibir saldos'}>
          {balancesVisible ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
        </Button>
      </header>

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

          />
        )}
      </section>

      {/* Ações rápidas */}
      <div className="grid grid-cols-2 gap-2.5 mb-6">
        <Button onClick={() => setShowTransactionForm(true)} className="h-[52px] min-w-0 px-2 gap-2 whitespace-nowrap">
          <Plus className="w-5 h-5 shrink-0" />
          Movimentação
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            setEditingAppointment(null);
            setShowAppointmentForm(true);
          }}
          className="h-[52px] min-w-0 px-2 gap-2 whitespace-nowrap bg-card border-primary/30"
        >
          <Calendar className="w-5 h-5 shrink-0" />
          Agendamento
        </Button>
      </div>

      {/* Saldos */}
      {!balancesVisible ? (
        <Button variant="ghost" onClick={toggleBalances} className="w-full h-14 mb-6 rounded-xl border border-dashed border-border bg-muted/40 gap-2 text-muted-foreground whitespace-nowrap px-2">
          <Eye className="w-4 h-4 shrink-0" />
          Saldos ocultos · toque para exibir
        </Button>
      ) : (
      <CaixaSaldoResumo
        saldoEmpresa={resumoCaixa.saldoEmpresa}
        saldoPessoal={resumoCaixa.saldoPessoal}
        entrouNoMes={resumoCaixa.entrouNoMes}
        mesReferencia={new Date()}
        hidden={!balancesVisible}
        onToggle={toggleBalances}
        caixaAtivo={caixaAtivo}
        inicioEm={resumoCaixa.inicioEm}
        onAbrirEmpresa={() => setDetalheCaixa('empresa')}
        onAbrirPessoal={() => setDetalheCaixa('pessoal')}
        onAbrirEntrouNoMes={() => setDetalheCaixa('entrouNoMes')}
        extraCard={
          <BalanceCard
            title="Gastos do Mês"
            value={getMonthlyPersonalExpenses()}
            icon={TrendingDown}
            variant="accent"
            onClick={() => setDetalheCaixa('gastosDoMes')}
          />
        }
      />

      )}

      <CaixaDetalheDrawer
        tipo={detalheCaixa}
        mesReferencia={new Date()}
        onOpenChange={(open) => {
          if (!open) setDetalheCaixa(null);
        }}
      />

      {/* Próximos */}
      {upcomingAppointments.length > 0 && (
        <section className="mb-6">
          <div className="flex items-center justify-between gap-2 mb-3">
            <h2 className="font-semibold min-w-0">Próximos Agendamentos</h2>
            <Button variant="link" asChild className="shrink-0 h-11 px-0">
              <Link to="/agendamentos">Ver agenda</Link>
            </Button>
          </div>
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
      />

      <DeleteConfirmDialog
        open={!!deleteAppointmentId}
        onOpenChange={() => setDeleteAppointmentId(null)}
        onConfirm={confirmDeleteAppointment}
        title="Excluir agendamento"
        description="Tem certeza que deseja excluir este agendamento?"
      />

      {fotosAtendimento?.clientId && (
        <ClientPhotosDialog
          open={!!fotosAtendimento}
          onOpenChange={(open) => { if (!open) setFotosAtendimento(null); }}
          clientId={fotosAtendimento.clientId}
          clientName={fotosAtendimento.clientName}
        />
      )}
    </MainLayout>
  );
};

export default Index;
