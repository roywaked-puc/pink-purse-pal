import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { format, addDays, isAfter, differenceInCalendarDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  ArrowLeft,
  Phone,
  FileText,
  Repeat,
  Calendar,
  DollarSign,
  MessageCircle,
  CalendarPlus,
  User,
  TrendingUp,
  Hash,
  Images,
  ClipboardList,
  ChevronRight,
  Clock,
  Camera,
  Wallet,
} from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { EmptyState } from '@/components/ds/EmptyState';
import { StatusBadge } from '@/components/ds/StatusBadge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { ClientPhotosTab } from '@/components/clients/ClientPhotosTab';
import { PhotoLightbox } from '@/components/clients/PhotoLightbox';
import { ClienteCrmTab } from '@/components/crm/ClienteCrmTab';
import { ClienteAnamneseTab } from '@/components/anamnese/ClienteAnamneseTab';
import { useClientPhotos, type ClientPhotoWithUrls } from '@/hooks/useClientPhotos';
import { useUserSettings } from '@/hooks/useUserSettings';
import { useApp } from '@/contexts/AppContext';
import { cn } from '@/lib/utils';
import type { Appointment, Transaction } from '@/types';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);


export default function ClienteFicha() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { appointments, transactions, getClientById } = useApp();
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

  const client = id ? getClientById(id) : undefined;

  const clientAppointments = useMemo(
    () =>
      appointments
        .filter((a) => a.clientId === id)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [appointments, id],
  );

  const clientTransactions = useMemo(() => {
    const apptIds = new Set(clientAppointments.map((a) => a.id));
    return transactions.filter((t) => t.appointmentId && apptIds.has(t.appointmentId));
  }, [transactions, clientAppointments]);

  const stats = useMemo(() => {
    const totalReceived = clientTransactions
      .filter((t) => t.type === 'entrada')
      .reduce((sum, t) => sum + t.amount, 0);
    const totalAppointments = clientAppointments.length;
    const attended = clientAppointments.filter((a) => a.confirmationStatus === 'atendido').length;
    const lastAttended = clientAppointments.find((a) => a.confirmationStatus === 'atendido');
    const ticketMedio = attended > 0 ? totalReceived / attended : 0;
    return { totalReceived, totalAppointments, attended, lastAttended, ticketMedio };
  }, [clientAppointments, clientTransactions]);

  const nextSuggestedDate = useMemo(() => {
    if (!client?.recurrenceDays || !stats.lastAttended) return null;
    const next = addDays(new Date(stats.lastAttended.date), client.recurrenceDays);
    return next;
  }, [client, stats.lastAttended]);

  if (!client) {
    return (
      <MainLayout>
        <EmptyState
          icon={User}
          title="Cliente não encontrado"
          description="Esse cliente pode ter sido removido."
          action={
            <Button onClick={() => navigate('/configuracoes')} variant="outline" size="sm">
              Voltar para configurações
            </Button>
          }
        />
      </MainLayout>
    );
  }

  const cleanPhone = client.phone?.replace(/\D/g, '') || '';
  const hasPhone = cleanPhone.length > 0;
  const whatsappLink = hasPhone
    ? `https://wa.me/55${cleanPhone}?text=${encodeURIComponent(
        `Olá ${client.name}! Tudo bem? Passando para combinar seu próximo atendimento ✨`,
      )}`
    : null;

  const scheduleNextUrl = nextSuggestedDate
    ? `/agendamentos?clientId=${client.id}&date=${nextSuggestedDate.toISOString()}`
    : `/agendamentos?clientId=${client.id}`;

  return (
    <MainLayout>
      <PageHeader
        title={client.name}
        subtitle="Ficha do cliente"
        action={
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4 mr-1" />
            Voltar
          </Button>
        }
      />

      <Tabs defaultValue="dados" className="w-full">
        <TabsList className="grid grid-cols-4 w-full max-w-md mb-4">
          <TabsTrigger value="dados">Dados</TabsTrigger>
          <TabsTrigger value="crm">CRM</TabsTrigger>
          <TabsTrigger value="fotos">
            <Images className="w-4 h-4 mr-1" />
            Fotos
          </TabsTrigger>
          <TabsTrigger value="anamnese">
            <ClipboardList className="w-4 h-4 mr-1" />
            Anamneses
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dados" className="space-y-6">
          {/* Info */}
          <section className="p-4 rounded-xl bg-card border border-border shadow-soft space-y-2">
            {client.phone && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="w-4 h-4 text-muted-foreground" />
                <span>{client.phone}</span>
              </div>
            )}
            {client.recurrenceDays && (
              <div className="flex items-center gap-2 text-sm">
                <Repeat className="w-4 h-4 text-muted-foreground" />
                <span>Retorno sugerido a cada {client.recurrenceDays} dias</span>
              </div>
            )}
            {client.notes && (
              <div className="flex items-start gap-2 text-sm">
                <FileText className="w-4 h-4 text-muted-foreground mt-0.5" />
                <span className="italic text-muted-foreground">{client.notes}</span>
              </div>
            )}
            {!client.phone && !client.notes && !client.recurrenceDays && (
              <p className="text-sm text-muted-foreground">
                Nenhuma informação adicional cadastrada.
              </p>
            )}
          </section>

          {/* Próxima sugestão */}
          {nextSuggestedDate && (
            <section className="p-4 rounded-xl bg-primary/10 border border-primary/30">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <p className="text-xs text-primary font-medium uppercase tracking-wide">
                    Próximo retorno sugerido
                  </p>
                  <p className="text-lg font-semibold mt-1">
                    {format(nextSuggestedDate, "dd 'de' MMMM yyyy", { locale: ptBR })}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {isAfter(nextSuggestedDate, new Date())
                      ? 'Agende com antecedência'
                      : 'Já passou — convide para retornar'}
                  </p>
                </div>
                <div className="flex gap-2">
                  {whatsappLink && (
                    <Button asChild variant="outline" size="sm" className="text-green-600">
                      <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
                        <MessageCircle className="w-4 h-4 mr-1" />
                        WhatsApp
                      </a>
                    </Button>
                  )}
                  <Button asChild size="sm">
                    <Link to={scheduleNextUrl}>
                      <CalendarPlus className="w-4 h-4 mr-1" />
                      Agendar
                    </Link>
                  </Button>
                </div>
              </div>
            </section>
          )}

          {/* Métricas */}
          <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard icon={Calendar} label="Atendimentos" value={String(stats.attended)} />
            <StatCard icon={Hash} label="Total agendados" value={String(stats.totalAppointments)} />
            <StatCard
              icon={DollarSign}
              label="Total recebido"
              value={formatCurrency(stats.totalReceived)}
            />
            <StatCard
              icon={TrendingUp}
              label="Ticket médio"
              value={formatCurrency(stats.ticketMedio)}
            />
          </section>

          {/* Histórico */}
          <section>
            <h2 className="font-semibold mb-3">Histórico de atendimentos</h2>
            {clientAppointments.length === 0 ? (
              <EmptyState
                icon={Calendar}
                title="Nenhum agendamento ainda"
                description="Quando este cliente tiver um agendamento, aparecerá aqui."
              />
            ) : (
              <div className="space-y-2">
                {(() => {
                  const completedIds = clientAppointments
                    .filter((a) => a.confirmationStatus === 'atendido')
                    .map((a) => a.id);
                  const today = new Date();
                  return clientAppointments.map((a) => {
                    let daysLabel: string | null = null;
                    if (a.confirmationStatus === 'atendido') {
                      const idx = completedIds.indexOf(a.id);
                      const parts: string[] = [];
                      if (idx === 0) {
                        const diff = differenceInCalendarDays(new Date(a.date), today);
                        if (diff === 0) parts.push('Hoje');
                        else if (diff > 0) parts.push(`Em ${diff} ${diff === 1 ? 'dia' : 'dias'}`);
                        else parts.push(`Há ${Math.abs(diff)} ${Math.abs(diff) === 1 ? 'dia' : 'dias'}`);
                      }
                      if (idx >= 0 && idx < completedIds.length - 1) {
                        const prevId = completedIds[idx + 1];
                        const prev = clientAppointments.find((x) => x.id === prevId);
                        if (prev) {
                          const diff = differenceInCalendarDays(new Date(a.date), new Date(prev.date));
                          parts.push(`${diff} ${diff === 1 ? 'dia' : 'dias'} desde o anterior`);
                        }
                      }
                      if (parts.length) daysLabel = parts.join(' · ');
                    }

                    return (
                      <button
                        key={a.id}
                        type="button"
                        onClick={() => setSelectedAppointment(a)}
                        className="w-full text-left p-3 rounded-lg bg-card border border-border flex items-center justify-between gap-3 transition-colors hover:bg-muted/50 hover:border-primary/40 cursor-pointer"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium">
                            {format(new Date(a.date), "dd 'de' MMM yyyy 'às' HH:mm", { locale: ptBR })}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">{a.service}</p>
                          {daysLabel && (
                            <p className="text-[11px] text-muted-foreground mt-0.5">{daysLabel}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <StatusBadge status={a.confirmationStatus} />
                          <span className="text-sm font-semibold text-primary">
                            {formatCurrency(a.amount)}
                          </span>
                          <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        </div>
                      </button>
                    );
                  });
                })()}
              </div>

            )}
          </section>
        </TabsContent>

        <TabsContent value="crm">
          <ClienteCrmTab clientId={client.id} />
        </TabsContent>

        <TabsContent value="fotos">
          <ClientPhotosTab clientId={client.id} />
        </TabsContent>

        <TabsContent value="anamnese">
          <ClienteAnamneseTab clientId={client.id} />
        </TabsContent>
      </Tabs>

      <AppointmentDetailSheet
        appointment={selectedAppointment}
        onOpenChange={(open) => !open && setSelectedAppointment(null)}
        transactions={clientTransactions.filter(
          (t) => t.appointmentId === selectedAppointment?.id,
        )}
        clientId={client.id}
      />
    </MainLayout>
  );
}


function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="p-3 rounded-xl bg-card border border-border shadow-soft">
      <div className="flex items-center gap-1.5 text-muted-foreground text-xs mb-1">
        <Icon className="w-3.5 h-3.5" />
        {label}
      </div>
      <p className="font-semibold text-sm">{value}</p>
    </div>
  );
}

const paymentStatusLabels: Record<string, string> = {
  pago: 'Pago',
  nao_pago: 'Não pago',
  sinal: 'Sinal',
};

function AppointmentDetailSheet({
  appointment,
  onOpenChange,
  transactions,
  clientId,
}: {
  appointment: Appointment | null;
  onOpenChange: (open: boolean) => void;
  transactions: Transaction[];
  clientId: string;
}) {
  const { data: userSettings } = useUserSettings();
  const { data: photos } = useClientPhotos(clientId);
  const { accounts } = useApp();
  const accountName = (t: Transaction) =>
    accounts.find((a) => a.id === (t.accountId ?? t.account))?.name;
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const appointmentPhotos = useMemo(
    () => (photos ?? []).filter((p) => p.appointmentId === appointment?.id),
    [photos, appointment?.id],
  );

  if (!appointment) return null;

  const paymentStatus =
    appointment.paidAmount >= appointment.amount
      ? 'pago'
      : appointment.paidAmount > 0
        ? 'sinal'
        : 'nao_pago';
  const remaining = Math.max(appointment.amount - appointment.paidAmount, 0);

  const caixaAtivo = !!userSettings?.caixa_reserva_ativo;
  const reserva = appointment.caixaReservaValorAplicado ?? userSettings?.caixa_reserva_valor ?? 0;
  const showCaixaSplit =
    caixaAtivo && !appointment.isPermuta && appointment.paidAmount > 0 && reserva > 0;
  const caixaEmpresa = Math.min(appointment.paidAmount, reserva);
  const caixaPessoal = appointment.paidAmount - caixaEmpresa;

  const entradas = transactions
    .filter((t) => t.type === 'entrada')
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <Sheet open={!!appointment} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md flex flex-col gap-0 p-0">
        <AppointmentDetailContent
          appointment={appointment}
          paymentStatus={paymentStatus}
          remaining={remaining}
          showCaixaSplit={showCaixaSplit}
          caixaEmpresa={caixaEmpresa}
          caixaPessoal={caixaPessoal}
          entradas={entradas}
          photos={appointmentPhotos}
          onOpenPhoto={(i) => {
            setLightboxIndex(i);
            setLightboxOpen(true);
          }}
        />
      </SheetContent>

      <PhotoLightbox
        open={lightboxOpen}
        onOpenChange={setLightboxOpen}
        photos={appointmentPhotos}
        index={lightboxIndex}
        onIndexChange={setLightboxIndex}
      />
    </Sheet>
  );
}

function AppointmentDetailContent({
  appointment,
  paymentStatus,
  remaining,
  showCaixaSplit,
  caixaEmpresa,
  caixaPessoal,
  entradas,
  photos,
  onOpenPhoto,
}: {
  appointment: Appointment;
  paymentStatus: string;
  remaining: number;
  showCaixaSplit: boolean;
  caixaEmpresa: number;
  caixaPessoal: number;
  entradas: Transaction[];
  photos: ClientPhotoWithUrls[];
  onOpenPhoto: (index: number) => void;
}) {
  return (
    <>
      <SheetHeader className="px-5 pt-5 pb-3 border-b border-border">
        <SheetTitle className="text-lg">
          {format(new Date(appointment.date), "dd 'de' MMMM yyyy 'às' HH:mm", { locale: ptBR })}
        </SheetTitle>
        <SheetDescription>Detalhes do atendimento</SheetDescription>
      </SheetHeader>

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
        {/* Serviço */}
        <section className="space-y-1.5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Serviço
          </p>
          <p className="font-medium">{appointment.service}</p>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {appointment.duration} min
            </span>
            {appointment.parentAppointmentId && (
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">
                🔄 Retorno
              </span>
            )}
            {appointment.isPermuta && (
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">
                Permuta
              </span>
            )}
          </div>
        </section>

        {/* Status */}
        <section className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Situação
          </p>
          <div className="flex items-center gap-2 flex-wrap">
            <StatusBadge status={appointment.confirmationStatus} />
            <span
              className={cn(
                'text-xs font-medium px-2.5 py-1 rounded-full',
                paymentStatus === 'pago' && 'status-paid',
                paymentStatus === 'nao_pago' && 'status-pending',
                paymentStatus === 'sinal' && 'status-today',
              )}
            >
              {paymentStatusLabels[paymentStatus]}
            </span>
          </div>
          <div className="text-sm space-y-0.5">
            <p>
              Valor: <span className="font-semibold">{formatCurrency(appointment.amount)}</span>
            </p>
            {appointment.paidAmount > 0 && (
              <p className="text-muted-foreground">
                Recebido: {formatCurrency(appointment.paidAmount)}
                {remaining > 0 && ` · falta ${formatCurrency(remaining)}`}
              </p>
            )}
          </div>
          {showCaixaSplit && (
            <p className="text-xs text-muted-foreground">
              Caixa empresa {formatCurrency(caixaEmpresa)} · Caixa pessoal{' '}
              {formatCurrency(caixaPessoal)}
            </p>
          )}
        </section>

        {/* Observações */}
        {appointment.notes && (
          <section className="space-y-1.5">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Observações
            </p>
            <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50">
              <FileText className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
              <p className="text-sm italic text-muted-foreground whitespace-pre-line">
                {appointment.notes}
              </p>
            </div>
          </section>
        )}

        {/* Pagamentos */}
        {entradas.length > 0 && (
          <section className="space-y-1.5">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-1">
              <Wallet className="w-3.5 h-3.5" />
              Pagamentos recebidos
            </p>
            <div className="space-y-1.5">
              {entradas.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between gap-3 p-2.5 rounded-lg bg-card border border-border"
                >
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(t.date), 'dd/MM/yyyy', { locale: ptBR })}
                      {t.account ? ` · ${t.account}` : ''}
                    </p>
                    {t.description && (
                      <p className="text-sm truncate">{t.description}</p>
                    )}
                  </div>
                  <span className="text-sm font-semibold text-green-600 flex-shrink-0">
                    {formatCurrency(t.amount)}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Fotos */}
        {photos.length > 0 && (
          <section className="space-y-1.5">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-1">
              <Camera className="w-3.5 h-3.5" />
              Fotos deste atendimento ({photos.length})
            </p>
            <div className="grid grid-cols-3 gap-2">
              {photos.map((p, i) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => onOpenPhoto(i)}
                  className="aspect-square rounded-lg overflow-hidden border border-border"
                >
                  <img
                    src={p.thumbUrl}
                    alt={p.observation || 'Foto do atendimento'}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </button>
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
}
