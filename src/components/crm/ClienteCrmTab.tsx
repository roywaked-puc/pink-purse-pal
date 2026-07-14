import { useMemo } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Calendar,
  DollarSign,
  Image as ImageIcon,
  RotateCcw,
  Sparkles,
  FileText,
  TrendingUp,
  CircleDot,
} from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { useClientPhotos } from '@/hooks/useClientPhotos';
import { useCrm, getClientStats } from '@/hooks/useCrm';
import { EmptyState } from '@/components/ds/EmptyState';
import { Badge } from '@/components/ui/badge';

const formatBRL = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

interface Props {
  clientId: string;
}

interface TimelineItem {
  id: string;
  sortDate: Date;
  displayDate: Date;
  type: 'attended' | 'scheduled' | 'payment' | 'photo' | 'return';
  title: string;
  detail?: string;
  coveredDates?: Date[];
}

export function ClienteCrmTab({ clientId }: Props) {
  const { appointments, transactions } = useApp();
  const { data: photos = [] } = useClientPhotos(clientId);
  const { stats } = useCrm();
  const s = getClientStats(stats, clientId);

  const { pendingFromAttended, openScheduledTotal } = useMemo(() => {
    const cAppts = appointments.filter((a) => a.clientId === clientId);
    const attended = cAppts.filter((a) => a.confirmationStatus === 'atendido');
    const open = cAppts.filter((a) =>
      ['pendente', 'confirmado', 'retorno_previsto'].includes(a.confirmationStatus),
    );
    const attendedTotal = attended.reduce((sum, a) => sum + (a.amount || 0), 0);
    const attendedPaid = attended.reduce((sum, a) => sum + (a.paidAmount || 0), 0);
    return {
      pendingFromAttended: Math.max(0, attendedTotal - attendedPaid),
      openScheduledTotal: open.reduce((sum, a) => sum + (a.amount || 0), 0),
    };
  }, [appointments, clientId]);


  const timeline = useMemo<TimelineItem[]>(() => {
    const items: TimelineItem[] = [];
    const cAppts = appointments.filter((a) => a.clientId === clientId);
    const apptById = new Map(cAppts.map((a) => [a.id, a]));
    const apptIds = new Set(cAppts.map((a) => a.id));

    // Tipo 1 — Atendimento / agendamento
    cAppts.forEach((a) => {
      if (a.confirmationStatus === 'cancelado') return;
      if (a.confirmationStatus === 'atendido') {
        const paidRatio = a.amount > 0 ? (a.paidAmount || 0) / a.amount : 0;
        const payStatus =
          (a.paidAmount || 0) <= 0
            ? 'Não pago'
            : paidRatio >= 0.999
              ? 'Pago'
              : 'Parcialmente pago';
        items.push({
          id: `a-${a.id}`,
          sortDate: new Date(a.date),
          displayDate: new Date(a.date),
          type: 'attended',
          title: 'Atendimento realizado',
          detail: `${a.service} · ${formatBRL(a.amount)} · ${payStatus}`,
        });
      } else {
        items.push({
          id: `s-${a.id}`,
          sortDate: new Date(a.date),
          displayDate: new Date(a.date),
          type: a.confirmationStatus === 'retorno_previsto' ? 'return' : 'scheduled',
          title:
            a.confirmationStatus === 'retorno_previsto'
              ? 'Retorno previsto'
              : a.confirmationStatus === 'confirmado'
                ? 'Agendamento confirmado'
                : 'Agendamento',
          detail: `${a.service} · ${formatBRL(a.amount)}`,
        });
      }
    });

    // Tipo 2 — Pagamentos agrupados por janela de ±2 min (mesmo cliente)
    const clientTxs = transactions
      .filter(
        (t) =>
          t.type === 'entrada' &&
          t.appointmentId &&
          apptIds.has(t.appointmentId) &&
          t.createdAt,
      )
      .sort((a, b) => (a.createdAt!.getTime() - b.createdAt!.getTime()));

    const WINDOW_MS = 2 * 60 * 1000;
    const groups: (typeof clientTxs)[] = [];
    clientTxs.forEach((t) => {
      const last = groups[groups.length - 1];
      const lastTx = last?.[last.length - 1];
      if (lastTx && t.createdAt!.getTime() - lastTx.createdAt!.getTime() <= WINDOW_MS) {
        last.push(t);
      } else {
        groups.push([t]);
      }
    });

    groups.forEach((g, idx) => {
      const total = g.reduce((sum, t) => sum + t.amount, 0);
      const groupDate = g[0].createdAt!;
      const uniqueApptIds = Array.from(new Set(g.map((t) => t.appointmentId!)));
      const coveredDates = uniqueApptIds
        .map((id) => apptById.get(id)?.date)
        .filter((d): d is Date => !!d)
        .map((d) => new Date(d))
        .sort((a, b) => a.getTime() - b.getTime());

      const coveredLabel =
        coveredDates.length > 0
          ? `Cobriu ${coveredDates.length === 1 ? 'atendimento de' : 'atendimentos de'} ${coveredDates
              .map((d) => format(d, 'dd/MMM', { locale: ptBR }))
              .join(', ')}`
          : undefined;

      items.push({
        id: `pg-${idx}-${groupDate.getTime()}`,
        sortDate: groupDate,
        displayDate: groupDate,
        type: 'payment',
        title: `Pagamento recebido ${formatBRL(total)}`,
        detail: coveredLabel,
        coveredDates,
      });
    });

    // Fotos (mantidas)
    photos.forEach((p) => {
      items.push({
        id: `p-${p.id}`,
        sortDate: new Date(p.photoDate),
        displayDate: new Date(p.photoDate),
        type: 'photo',
        title: 'Foto adicionada',
        detail: p.serviceName || p.observation,
      });
    });

    return items.sort((a, b) => b.sortDate.getTime() - a.sortDate.getTime());
  }, [appointments, transactions, photos, clientId]);


  if (!s) {
    return <EmptyState icon={CircleDot} title="Sem dados" description="Cliente sem informações ainda." />;
  }

  return (
    <div className="space-y-6">
      {/* Resumo */}
      <section className="p-4 rounded-xl bg-card border border-border space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-semibold text-sm">Resumo</h3>
          {s.isInactive ? (
            <Badge variant="outline" className="text-amber-600 border-amber-300">Inativa</Badge>
          ) : s.isActive ? (
            <Badge className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/10 border-emerald-300">
              Ativa
            </Badge>
          ) : (
            <Badge variant="outline">Sem histórico</Badge>
          )}
        </div>
        <ResumeRow
          label="Primeiro atendimento"
          value={
            s.firstAppointment
              ? format(new Date(s.firstAppointment.date), "dd/MM/yyyy", { locale: ptBR })
              : '—'
          }
        />
        <ResumeRow
          label="Último atendimento"
          value={
            s.lastAttended
              ? `${format(new Date(s.lastAttended.date), "dd/MM/yyyy", { locale: ptBR })}${s.daysSinceLastAttended !== undefined ? ` · ${s.daysSinceLastAttended} dias atrás` : ''}`
              : '—'
          }
        />
        <ResumeRow
          label="Próxima manutenção"
          value={
            s.nextScheduled
              ? format(new Date(s.nextScheduled.date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
              : 'Sem agendamento'
          }
        />
      </section>

      {/* Financeiro */}
      <section className="p-4 rounded-xl bg-card border border-border space-y-3">
        <h3 className="font-semibold text-sm flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-primary" /> Financeiro
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <Metric label="Total gasto" value={formatBRL(s.totalSpent)} />
          <Metric label="Total pago" value={formatBRL(s.totalPaid)} />
          <Metric
            label="Saldo pendente"
            value={formatBRL(pendingFromAttended)}
            tone={pendingFromAttended > 0 ? 'danger' : 'muted'}
          />
          <Metric
            label="Saldo de agendas abertas"
            value={formatBRL(openScheduledTotal)}
            tone="info"
          />

        </div>
        <div className="text-xs text-muted-foreground pt-2 border-t">
          Último pagamento:{' '}
          {s.lastPaymentDate
            ? `${formatBRL(s.lastPaymentAmount || 0)} em ${format(s.lastPaymentDate, 'dd/MM/yyyy', { locale: ptBR })}`
            : '—'}
        </div>
      </section>

      {/* Timeline */}
      <section className="space-y-3">
        <h3 className="font-semibold text-sm flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-primary" /> Histórico completo
        </h3>
        {timeline.length === 0 ? (
          <EmptyState icon={Calendar} title="Sem histórico" description="Nada registrado ainda." />
        ) : (
          <div className="relative pl-6 space-y-3 border-l-2 border-border ml-2">
            {timeline.map((item) => (
              <TimelineEntry key={item.id} item={item} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function ResumeRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-right">{value}</span>
    </div>
  );
}

function Metric({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: 'danger' | 'muted' | 'info';
}) {
  const valueClass =
    tone === 'danger'
      ? 'text-rose-600'
      : tone === 'info'
        ? 'text-sky-600'
        : tone === 'muted'
          ? 'text-muted-foreground'
          : 'text-foreground';
  return (
    <div className="p-2 rounded-lg bg-muted/40">
      <p className="text-[11px] text-muted-foreground uppercase tracking-wide">{label}</p>
      <p className={`font-semibold text-sm ${valueClass}`}>{value}</p>
    </div>
  );
}


function TimelineEntry({ item }: { item: TimelineItem }) {
  const map = {
    attended: { icon: Sparkles, color: 'bg-emerald-500 text-white' },
    scheduled: { icon: Calendar, color: 'bg-sky-500 text-white' },
    payment: { icon: DollarSign, color: 'bg-primary text-primary-foreground' },
    photo: { icon: ImageIcon, color: 'bg-violet-500 text-white' },
    return: { icon: RotateCcw, color: 'bg-amber-500 text-white' },
  } as const;
  const { icon: Icon, color } = map[item.type];
  return (
    <div className="relative">
      <div
        className={`absolute -left-[34px] top-0.5 w-6 h-6 rounded-full flex items-center justify-center shadow ${color}`}
      >
        <Icon className="w-3.5 h-3.5" />
      </div>
      <div className="p-3 rounded-lg bg-card border border-border">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground">
            {format(item.date, "dd 'de' MMM yyyy", { locale: ptBR })}
          </p>
        </div>
        <p className="font-medium text-sm">{item.title}</p>
        {item.detail && <p className="text-xs text-muted-foreground mt-0.5">{item.detail}</p>}
      </div>
    </div>
  );
}
