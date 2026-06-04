import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Phone,
  RotateCcw,
  AlertTriangle,
  DollarSign,
  Star,
  Cake,
  CheckCircle2,
  CalendarPlus,
  Users,
  ChevronRight,
  TrendingUp,
  CalendarDays,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ActionCard } from '@/components/crm/ActionCard';
import { CrmListSheet } from '@/components/crm/CrmListSheet';
import { WhatsAppButton } from '@/components/crm/WhatsAppButton';
import { EmptyState } from '@/components/ds/EmptyState';
import { useCrm } from '@/hooks/useCrm';
import { useApp } from '@/contexts/AppContext';
import { useUpdateConfirmationStatus } from '@/hooks/useAppointments';
import { waMessages } from '@/lib/whatsapp';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

type SheetType = null | 'confirm' | 'returns' | 'inactive' | 'pending' | 'vip' | 'birthday';

const formatBRL = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

const filterChips: { value: string; label: string }[] = [
  { value: 'todas', label: 'Todas' },
  { value: 'ativas', label: 'Ativas' },
  { value: 'inativas', label: 'Inativas' },
  { value: 'saldo', label: 'Com saldo' },
  { value: 'retorno', label: 'Sem retorno' },
  { value: 'vip', label: 'VIP' },
];

export default function CRM() {
  const navigate = useNavigate();
  const { getClientById } = useApp();
  const {
    stats,
    pendingConfirmations,
    pendingReturns,
    inactiveClients,
    pendingPayments,
    vipClients,
    birthdaysThisMonth,
    totals,
    settings,
  } = useCrm();
  const updateStatus = useUpdateConfirmationStatus();
  const [sheet, setSheet] = useState<SheetType>(null);
  const [filter, setFilter] = useState<string>('todas');

  const vipIds = useMemo(() => new Set(vipClients.map((v) => v.client.id)), [vipClients]);

  const filteredList = useMemo(() => {
    switch (filter) {
      case 'ativas':
        return stats.filter((s) => s.isActive);
      case 'inativas':
        return stats.filter((s) => s.isInactive);
      case 'saldo':
        return stats.filter((s) => s.pendingBalance > 0.01);
      case 'retorno':
        return stats.filter((s) => s.lastAttended && !s.nextScheduled && !s.isInactive);
      case 'vip':
        return stats.filter((s) => vipIds.has(s.client.id));
      default:
        return stats;
    }
  }, [stats, filter, vipIds]);

  const handleConfirm = async (apptId: string) => {
    try {
      await updateStatus.mutateAsync({ id: apptId, status: 'confirmado' });
      toast.success('Agendamento confirmado');
    } catch (e: any) {
      toast.error('Erro ao confirmar', { description: e?.message });
    }
  };

  return (
    <MainLayout>
      <PageHeader title="CRM" subtitle="Quem precisa de você hoje?" />

      {/* Mini dashboard */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mb-6">
        <MiniStat label="Ativas" value={totals.activeCount} tone="success" />
        <MiniStat label="Inativas" value={totals.inactiveCount} tone="warning" />
        <MiniStat label="Confirmar" value={totals.pendingConfirmationsCount} tone="info" />
        <MiniStat label="Retornos" value={totals.pendingReturnsCount} tone="primary" />
        <MiniStat
          label="Saldo"
          value={formatBRL(totals.pendingBalanceTotal)}
          tone="danger"
          isText
        />
        <MiniStat label="VIPs" value={totals.vipCount} tone="muted" />
      </div>

      {/* Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-8">
        <ActionCard
          icon={Phone}
          emoji="📞"
          title="Confirmar Agenda"
          count={totals.pendingConfirmationsCount}
          description={`Agendamentos pendentes nos próximos ${settings.confirmDays} dias`}
          onClick={() => setSheet('confirm')}
          tone="info"
        />
        <ActionCard
          icon={RotateCcw}
          emoji="🔄"
          title="Retornos Pendentes"
          count={totals.pendingReturnsCount}
          description="Atendidas sem próxima manutenção agendada"
          onClick={() => setSheet('returns')}
          tone="primary"
        />
        <ActionCard
          icon={AlertTriangle}
          emoji="⚠"
          title="Clientes Inativas"
          count={totals.inactiveCount}
          description={`Sem atendimento há mais de ${settings.inactiveDays} dias`}
          onClick={() => setSheet('inactive')}
          tone="warning"
        />
        <ActionCard
          icon={DollarSign}
          emoji="💰"
          title="Saldo Pendente"
          count={pendingPayments.length}
          description={`Total ${formatBRL(totals.pendingBalanceTotal)} a receber`}
          onClick={() => setSheet('pending')}
          tone="danger"
        />
        <ActionCard
          icon={Star}
          emoji="⭐"
          title="Clientes VIP"
          count={totals.vipCount}
          description="Suas melhores clientes por faturamento e frequência"
          onClick={() => setSheet('vip')}
          tone="success"
        />
        <ActionCard
          icon={Cake}
          emoji="🎂"
          title="Aniversariantes"
          count={totals.birthdayCount}
          description="Clientes que fazem aniversário neste mês"
          onClick={() => setSheet('birthday')}
          tone="muted"
        />
      </div>

      {/* Filtros e lista */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Clientes</h2>
          <span className="text-xs text-muted-foreground">{filteredList.length} resultado(s)</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {filterChips.map((c) => (
            <button
              key={c.value}
              onClick={() => setFilter(c.value)}
              className={cn(
                'px-3 py-1 rounded-full text-xs font-medium border transition-colors',
                filter === c.value
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-card text-muted-foreground border-border hover:text-foreground',
              )}
            >
              {c.label}
            </button>
          ))}
        </div>

        {filteredList.length === 0 ? (
          <EmptyState
            icon={Users}
            title="Nenhuma cliente neste filtro"
            description="Tente outro filtro ou cadastre clientes em Configurações."
          />
        ) : (
          <div className="space-y-2">
            {filteredList.map((s) => (
              <Link
                key={s.client.id}
                to={`/cliente/${s.client.id}`}
                className="flex items-center justify-between gap-3 p-3 bg-card border border-border rounded-lg hover:border-primary/40 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium truncate">{s.client.name}</p>
                    {vipIds.has(s.client.id) && (
                      <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                    )}
                    {s.isInactive && (
                      <Badge variant="outline" className="text-amber-600 border-amber-300">
                        Inativa
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {s.attendedCount} atend. · {formatBRL(s.totalPaid)}
                    {s.pendingBalance > 0 && (
                      <span className="text-rose-600"> · {formatBRL(s.pendingBalance)} pendente</span>
                    )}
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* SHEET: Confirmações */}
      <CrmListSheet
        open={sheet === 'confirm'}
        onOpenChange={(o) => !o && setSheet(null)}
        title="📞 Confirmar Agenda"
        description={`${pendingConfirmations.length} agendamento(s) pendente(s)`}
      >
        {pendingConfirmations.length === 0 && (
          <EmptyState icon={CheckCircle2} title="Tudo confirmado!" description="Nenhuma pendência." />
        )}
        {pendingConfirmations.map((a) => {
          const client = a.clientId ? getClientById(a.clientId) : undefined;
          const dateStr = format(new Date(a.date), "dd 'de' MMM 'às' HH:mm", { locale: ptBR });
          return (
            <div key={a.id} className="p-3 border rounded-lg bg-card space-y-2">
              <div>
                <p className="font-medium text-sm">{a.clientName}</p>
                <p className="text-xs text-muted-foreground">
                  {dateStr} · {a.service}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <WhatsAppButton
                  phone={client?.phone}
                  message={waMessages.confirm(a.clientName, dateStr)}
                />
                <Button size="sm" variant="outline" onClick={() => handleConfirm(a.id)}>
                  <CheckCircle2 className="w-4 h-4 mr-1" />
                  Confirmar
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => navigate(`/agendamentos?edit=${a.id}`)}
                >
                  Remarcar
                </Button>
              </div>
            </div>
          );
        })}
      </CrmListSheet>

      {/* SHEET: Retornos */}
      <CrmListSheet
        open={sheet === 'returns'}
        onOpenChange={(o) => !o && setSheet(null)}
        title="🔄 Retornos Pendentes"
        description="Clientes atendidas sem próxima manutenção"
      >
        {pendingReturns.length === 0 && (
          <EmptyState icon={CheckCircle2} title="Tudo em dia!" description="Todas têm próximo retorno." />
        )}
        {pendingReturns.map((s) => (
          <div key={s.client.id} className="p-3 border rounded-lg bg-card space-y-2">
            <div>
              <p className="font-medium text-sm">{s.client.name}</p>
              <p className="text-xs text-muted-foreground">
                Último: {format(new Date(s.lastAttended!.date), "dd/MM/yyyy", { locale: ptBR })} ·{' '}
                {s.lastAttended!.service}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <WhatsAppButton phone={s.client.phone} message={waMessages.return(s.client.name)} />
              <Button
                size="sm"
                onClick={() => navigate(`/agendamentos?clientId=${s.client.id}`)}
              >
                <CalendarPlus className="w-4 h-4 mr-1" />
                Agendar retorno
              </Button>
            </div>
          </div>
        ))}
      </CrmListSheet>

      {/* SHEET: Inativas */}
      <CrmListSheet
        open={sheet === 'inactive'}
        onOpenChange={(o) => !o && setSheet(null)}
        title="⚠ Clientes Inativas"
        description={`Sem atendimento há mais de ${settings.inactiveDays} dias`}
      >
        {inactiveClients.length === 0 && (
          <EmptyState icon={CheckCircle2} title="Nenhuma inativa" description="Todas suas clientes estão ativas." />
        )}
        {inactiveClients.map((s) => (
          <div key={s.client.id} className="p-3 border rounded-lg bg-card space-y-2">
            <div>
              <p className="font-medium text-sm">{s.client.name}</p>
              <p className="text-xs text-muted-foreground">
                Último: {format(new Date(s.lastAttended!.date), "dd/MM/yyyy", { locale: ptBR })} ·{' '}
                <span className="text-amber-600 font-medium">
                  {s.daysSinceLastAttended} dias ausente
                </span>
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <WhatsAppButton phone={s.client.phone} message={waMessages.inactive(s.client.name)} />
              <Button
                size="sm"
                onClick={() => navigate(`/agendamentos?clientId=${s.client.id}`)}
              >
                <CalendarPlus className="w-4 h-4 mr-1" />
                Agendar retorno
              </Button>
            </div>
          </div>
        ))}
      </CrmListSheet>

      {/* SHEET: Saldo */}
      <CrmListSheet
        open={sheet === 'pending'}
        onOpenChange={(o) => !o && setSheet(null)}
        title="💰 Saldo Pendente"
        description={`Total ${formatBRL(totals.pendingBalanceTotal)} a receber`}
      >
        {pendingPayments.length === 0 && (
          <EmptyState icon={CheckCircle2} title="Sem pendências!" description="Nenhum saldo em aberto." />
        )}
        {pendingPayments.map((s) => (
          <div key={s.client.id} className="p-3 border rounded-lg bg-card space-y-2">
            <div>
              <p className="font-medium text-sm">{s.client.name}</p>
              <p className="text-xs text-muted-foreground">
                Total {formatBRL(s.totalSpent)} · Pago {formatBRL(s.totalPaid)}
              </p>
              <p className="text-sm font-semibold text-rose-600 mt-1">
                Saldo {formatBRL(s.pendingBalance)}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <WhatsAppButton
                phone={s.client.phone}
                message={waMessages.pendingPayment(s.client.name, formatBRL(s.pendingBalance))}
              />
              <Button
                size="sm"
                onClick={() => navigate(`/movimentacoes?clientId=${s.client.id}&type=entrada`)}
              >
                <DollarSign className="w-4 h-4 mr-1" />
                Registrar pagamento
              </Button>
            </div>
          </div>
        ))}
      </CrmListSheet>

      {/* SHEET: VIP */}
      <CrmListSheet
        open={sheet === 'vip'}
        onOpenChange={(o) => !o && setSheet(null)}
        title="⭐ Clientes VIP"
        description={`Top ${settings.vipCount} por faturamento e frequência`}
      >
        {vipClients.length === 0 && (
          <EmptyState icon={Star} title="Sem dados ainda" description="Registre atendimentos para ver suas VIPs." />
        )}
        {vipClients.map((s, idx) => (
          <Link
            key={s.client.id}
            to={`/cliente/${s.client.id}`}
            className="flex items-center justify-between gap-3 p-3 border rounded-lg bg-card hover:border-primary/40"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-full bg-amber-500/10 text-amber-600 font-semibold flex items-center justify-center text-sm">
                {idx + 1}
              </div>
              <div className="min-w-0">
                <p className="font-medium text-sm truncate">{s.client.name}</p>
                <p className="text-xs text-muted-foreground">
                  {s.attendedCount} atend. · {formatBRL(s.totalPaid)}
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </Link>
        ))}
      </CrmListSheet>

      {/* SHEET: Aniversariantes */}
      <CrmListSheet
        open={sheet === 'birthday'}
        onOpenChange={(o) => !o && setSheet(null)}
        title="🎂 Aniversariantes do mês"
        description="Não esqueça de parabenizar"
      >
        {birthdaysThisMonth.length === 0 && (
          <EmptyState
            icon={Cake}
            title="Ninguém este mês"
            description="Cadastre a data de nascimento das clientes em Configurações."
          />
        )}
        {birthdaysThisMonth.map((s) => {
          const d = parseISO(s.client.birthDate!);
          return (
            <div key={s.client.id} className="p-3 border rounded-lg bg-card space-y-2">
              <div>
                <p className="font-medium text-sm">{s.client.name}</p>
                <p className="text-xs text-muted-foreground">
                  🎂 {format(d, "dd 'de' MMMM", { locale: ptBR })}
                </p>
              </div>
              <WhatsAppButton phone={s.client.phone} message={waMessages.birthday(s.client.name)} />
            </div>
          );
        })}
      </CrmListSheet>
    </MainLayout>
  );
}

function MiniStat({
  label,
  value,
  tone,
  isText,
}: {
  label: string;
  value: number | string;
  tone: 'success' | 'warning' | 'info' | 'primary' | 'danger' | 'muted';
  isText?: boolean;
}) {
  const tones: Record<typeof tone, string> = {
    success: 'text-emerald-600',
    warning: 'text-amber-600',
    info: 'text-sky-600',
    primary: 'text-primary',
    danger: 'text-rose-600',
    muted: 'text-muted-foreground',
  };
  return (
    <div className="p-2 rounded-lg bg-card border border-border text-center">
      <p className={cn('font-bold tabular-nums', isText ? 'text-sm' : 'text-lg', tones[tone])}>
        {value}
      </p>
      <p className="text-[10px] text-muted-foreground uppercase tracking-wide mt-0.5">{label}</p>
    </div>
  );
}
