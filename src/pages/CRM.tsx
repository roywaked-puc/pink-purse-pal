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

type ProductionFilter = {
  kind: 'previsto' | 'realizado';
  permuta: boolean;
};
type SheetType =
  | null
  | 'confirm'
  | 'returns'
  | 'inactive'
  | 'production'
  | 'vip'
  | 'birthday'
  | 'active'
  | 'balance'
  | 'productionFilter';

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
  const { getClientById, appointments } = useApp();
  const {
    stats,
    pendingConfirmations,
    pendingReturns,
    inactiveClients,
    pendingPayments,
    vipClients,
    birthdaysThisMonth,
    monthlyProduction,
    totals,
    settings,
  } = useCrm();
  const updateStatus = useUpdateConfirmationStatus();
  const [sheet, setSheet] = useState<SheetType>(null);
  const [productionFilter, setProductionFilter] = useState<ProductionFilter | null>(null);
  const [filter, setFilter] = useState<string>('todas');

  const activeClients = useMemo(() => stats.filter((s) => s.isActive), [stats]);

  const pendingBalanceAppointments = useMemo(() => {
    return appointments
      .filter((a) => a.confirmationStatus !== 'cancelado' && a.amount - a.paidAmount > 0.01)
      .map((a) => ({
        id: a.id,
        clientName: a.clientName,
        date: new Date(a.date),
        service: a.service,
        amount: a.amount,
        paidAmount: a.paidAmount,
        pending: a.amount - a.paidAmount,
      }))
      .sort((a, b) => b.pending - a.pending);
  }, [appointments]);

  const productionFilterList = useMemo(() => {
    if (!productionFilter) return [];
    const base =
      productionFilter.kind === 'previsto'
        ? monthlyProduction.upcomingAppointments
        : monthlyProduction.attendedAppointments;
    return base.filter((a) => !!a.isPermuta === productionFilter.permuta);
  }, [productionFilter, monthlyProduction]);


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
        <MiniStat label="Ativas" value={totals.activeCount} tone="success" onClick={() => setSheet('active')} />
        <MiniStat label="Inativas" value={totals.inactiveCount} tone="warning" onClick={() => setSheet('inactive')} />
        <MiniStat label="Confirmar" value={totals.pendingConfirmationsCount} tone="info" onClick={() => setSheet('confirm')} />
        <MiniStat label="Retornos" value={totals.pendingReturnsCount} tone="primary" onClick={() => setSheet('returns')} />
        <MiniStat
          label="Saldo"
          value={formatBRL(totals.pendingBalanceTotal)}
          tone="danger"
          isText
          onClick={() => setSheet('balance')}
        />
        <MiniStat label="VIPs" value={totals.vipCount} tone="muted" onClick={() => setSheet('vip')} />
      </div>

      {/* Produção do mês — destaque */}
      <ProducaoMesCard
        data={monthlyProduction}
        onClick={() => setSheet('production')}
      />

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

      {/* SHEET: Produção do mês */}
      <CrmListSheet
        open={sheet === 'production'}
        onOpenChange={(o) => !o && setSheet(null)}
        title="📅 Produção do Mês"
        description={format(new Date(), "MMMM 'de' yyyy", { locale: ptBR })}
      >
        <div className="space-y-4">
          <SplitBlock
            label="Previsto"
            receivable={monthlyProduction.upcomingSplit.receivable}
            permuta={monthlyProduction.upcomingSplit.permuta}
          />
          <SplitBlock
            label="Realizado"
            receivable={monthlyProduction.attendedSplit.receivable}
            permuta={monthlyProduction.attendedSplit.permuta}
          />
          <div className="grid grid-cols-2 gap-2 pt-2 border-t">
            <SummaryTile label="Projeção" value={formatBRL(monthlyProduction.projection)} isText highlight />
            <SummaryTile
              label="Meta"
              value={monthlyProduction.goal > 0 ? formatBRL(monthlyProduction.goal) : '—'}
              isText
            />
          </div>
          <p className="text-[11px] text-muted-foreground italic">
            Meta e Projeção consideram apenas valores a receber (sem permuta).
          </p>
        </div>

        <div className="pt-4">
          <h3 className="font-semibold text-sm mb-2">Produção futura</h3>
          {monthlyProduction.upcomingAppointments.length === 0 ? (
            <EmptyState icon={CalendarDays} title="Sem agendamentos" description="Nada previsto até o fim do mês." />
          ) : (
            <div className="space-y-2">
              {monthlyProduction.upcomingAppointments.map((a) => {
                const d = new Date(a.date);
                return (
                  <div key={a.id} className="p-3 border rounded-lg bg-card">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium text-sm truncate">{a.clientName}</p>
                      <span className="text-sm font-semibold tabular-nums">{formatBRL(a.amount)}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {format(d, "dd/MM 'às' HH:mm", { locale: ptBR })} · {a.service}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
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
  onClick,
}: {
  label: string;
  value: number | string;
  tone: 'success' | 'warning' | 'info' | 'primary' | 'danger' | 'muted';
  isText?: boolean;
  onClick?: () => void;
}) {
  const tones: Record<typeof tone, string> = {
    success: 'text-emerald-600',
    warning: 'text-amber-600',
    info: 'text-sky-600',
    primary: 'text-primary',
    danger: 'text-rose-600',
    muted: 'text-muted-foreground',
  };
  const content = (
    <>
      <p className={cn('font-bold tabular-nums', isText ? 'text-sm' : 'text-lg', tones[tone])}>
        {value}
      </p>
      <p className="text-[10px] text-muted-foreground uppercase tracking-wide mt-0.5">{label}</p>
    </>
  );
  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="p-2 rounded-lg bg-card border border-border text-center hover:border-primary/40 hover:shadow-sm transition-all"
      >
        {content}
      </button>
    );
  }
  return (
    <div className="p-2 rounded-lg bg-card border border-border text-center">{content}</div>
  );
}

function SummaryTile({
  label,
  value,
  isText,
  highlight,
}: {
  label: string;
  value: number | string;
  isText?: boolean;
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        'p-3 rounded-lg border text-center',
        highlight ? 'bg-primary/10 border-primary/30' : 'bg-card border-border',
      )}
    >
      <p className={cn('font-bold tabular-nums', isText ? 'text-sm' : 'text-xl', highlight && 'text-primary')}>
        {value}
      </p>
      <p className="text-[10px] text-muted-foreground uppercase tracking-wide mt-0.5">{label}</p>
    </div>
  );
}

function SplitBlock({
  label,
  receivable,
  permuta,
}: {
  label: string;
  receivable: { count: number; amount: number };
  permuta: { count: number; amount: number };
}) {
  return (
    <div className="p-3 rounded-lg border bg-card">
      <p className="text-[11px] text-muted-foreground uppercase tracking-wide mb-2 font-semibold">
        {label}
      </p>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-2 text-sm">
          <span className="text-muted-foreground">
            <span className="font-semibold text-foreground tabular-nums">{receivable.count}</span>{' '}
            agendamento{receivable.count === 1 ? '' : 's'}
          </span>
          <span className="font-semibold tabular-nums text-emerald-600">
            {formatBRL(receivable.amount)} <span className="text-[11px] font-normal text-muted-foreground">a receber</span>
          </span>
        </div>
        <div className="flex items-center justify-between gap-2 text-sm">
          <span className="text-muted-foreground">
            <span className="font-semibold text-foreground tabular-nums">{permuta.count}</span>{' '}
            agendamento{permuta.count === 1 ? '' : 's'}
          </span>
          <span className="font-semibold tabular-nums text-amber-600">
            {formatBRL(permuta.amount)} <span className="text-[11px] font-normal text-muted-foreground">em permuta</span>
          </span>
        </div>
      </div>
    </div>
  );
}

function ProducaoMesCard({
  data,
  onClick,
}: {
  data: {
    attendedSplit: { receivable: { count: number; amount: number }; permuta: { count: number; amount: number } };
    upcomingSplit: { receivable: { count: number; amount: number }; permuta: { count: number; amount: number } };
    realized: number;
    forecast: number;
    projection: number;
    goal: number;
    progress: number;
  };
  onClick: () => void;
}) {
  const { attendedSplit, upcomingSplit, realized, forecast, projection, goal, progress } = data;
  const clamped = Math.min(progress, 100);
  const barColor =
    progress >= 90 ? 'bg-emerald-500' : progress >= 61 ? 'bg-amber-500' : 'bg-rose-500';
  const monthName = format(new Date(), "MMMM 'de' yyyy", { locale: ptBR });

  return (
    <button
      type="button"
      onClick={onClick}
      className="group w-full text-left mb-6 p-5 rounded-2xl border bg-gradient-to-br from-primary/10 via-card to-card shadow-elevated hover:shadow-lg transition-all"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-lg bg-primary/15 text-primary flex items-center justify-center">
            <CalendarDays className="w-5 h-5" />
          </div>
          <div>
            <p className="font-bold text-base">📅 Produção do Mês</p>
            <p className="text-xs text-muted-foreground capitalize">{monthName}</p>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
      </div>

      <div className="space-y-3 mb-4">
        <div className="p-3 rounded-lg bg-background/60 border">
          <p className="text-[11px] text-muted-foreground uppercase tracking-wide mb-1.5 font-semibold">Previsto</p>
          <div className="space-y-1 text-sm">
            <div className="flex items-center justify-between gap-2">
              <span className="text-muted-foreground"><span className="font-semibold text-foreground tabular-nums">{upcomingSplit.receivable.count}</span> ag.</span>
              <span className="font-semibold tabular-nums text-emerald-600">{formatBRL(upcomingSplit.receivable.amount)} <span className="text-[10px] font-normal text-muted-foreground">a receber</span></span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-muted-foreground"><span className="font-semibold text-foreground tabular-nums">{upcomingSplit.permuta.count}</span> ag.</span>
              <span className="font-semibold tabular-nums text-amber-600">{formatBRL(upcomingSplit.permuta.amount)} <span className="text-[10px] font-normal text-muted-foreground">permuta</span></span>
            </div>
          </div>
        </div>
        <div className="p-3 rounded-lg bg-background/60 border">
          <p className="text-[11px] text-muted-foreground uppercase tracking-wide mb-1.5 font-semibold">Realizado</p>
          <div className="space-y-1 text-sm">
            <div className="flex items-center justify-between gap-2">
              <span className="text-muted-foreground"><span className="font-semibold text-foreground tabular-nums">{attendedSplit.receivable.count}</span> ag.</span>
              <span className="font-semibold tabular-nums text-emerald-600">{formatBRL(attendedSplit.receivable.amount)} <span className="text-[10px] font-normal text-muted-foreground">a receber</span></span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-muted-foreground"><span className="font-semibold text-foreground tabular-nums">{attendedSplit.permuta.count}</span> ag.</span>
              <span className="font-semibold tabular-nums text-amber-600">{formatBRL(attendedSplit.permuta.amount)} <span className="text-[10px] font-normal text-muted-foreground">permuta</span></span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <TrendingUp className="w-4 h-4 text-primary" />
          <span className="text-xs font-medium text-muted-foreground">Projeção final (a receber)</span>
        </div>
        <span className="text-lg font-bold tabular-nums text-primary">{formatBRL(projection)}</span>
      </div>

      {goal > 0 ? (
        <div className="space-y-1.5">
          <div className="h-2.5 w-full rounded-full bg-muted overflow-hidden">
            <div
              className={cn('h-full rounded-full transition-all', barColor)}
              style={{ width: `${clamped}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
            <span className="font-medium">{Math.round(progress)}% da meta</span>
            <span>Meta: {formatBRL(goal)}</span>
          </div>
        </div>
      ) : (
        <p className="text-[11px] text-muted-foreground italic">
          Defina uma meta mensal em Configurações → CRM para ver o progresso.
        </p>
      )}
    </button>
  );
}


