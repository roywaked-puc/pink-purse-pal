import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import {
  Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Line, Legend, ComposedChart,
} from 'recharts';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useTransactions } from '@/hooks/useTransactions';

const MONTH_LABELS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

const formatCurrency = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

interface Props { embedded?: boolean }

export default function RelatorioIndicadores({ embedded = false }: Props = {}) {
  const navigate = useNavigate();
  const { data: transactions = [] } = useTransactions();

  const now = new Date();
  const year = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-based

  // Filter: business income transactions for a given year up to current month index
  const filterIncome = (yr: number) =>
    transactions.filter(t => {
      const d = new Date(t.date);
      return (
        t.type === 'entrada' &&
        t.scope === 'empresa' &&
        d.getFullYear() === yr &&
        d.getMonth() <= currentMonth
      );
    });

  const incomeTx = useMemo(() => filterIncome(year), [transactions, year, currentMonth]);
  const incomeTxPrev = useMemo(() => filterIncome(year - 1), [transactions, year, currentMonth]);

  const aggregateByMonth = (txs: typeof transactions) => {
    const arr = Array.from({ length: currentMonth + 1 }, (_, i) => ({
      revenue: 0,
      clientsSet: new Set<string>(),
    }));
    txs.forEach(t => {
      const m = new Date(t.date).getMonth();
      if (!arr[m]) return;
      arr[m].revenue += t.amount;
      const key = t.clientName?.trim().toLowerCase() || t.appointmentId || t.id;
      arr[m].clientsSet.add(key);
    });
    return arr;
  };

  // Per-month aggregates (current + previous year combined)
  const monthsData = useMemo(() => {
    const cur = aggregateByMonth(incomeTx);
    const prev = aggregateByMonth(incomeTxPrev);
    return cur.map((x, i) => ({
      monthIdx: i,
      label: MONTH_LABELS[i],
      revenue: Number(x.revenue.toFixed(2)),
      clients: x.clientsSet.size,
      revenuePrev: Number(prev[i].revenue.toFixed(2)),
      clientsPrev: prev[i].clientsSet.size,
    }));
  }, [incomeTx, incomeTxPrev, currentMonth]);


  // Summary KPIs
  const totals = useMemo(() => {
    const totalRevenue = monthsData.reduce((s, m) => s + m.revenue, 0);
    const allClients = new Set<string>();
    incomeTx.forEach(t => {
      const key = t.clientName?.trim().toLowerCase() || t.appointmentId || t.id;
      allClients.add(key);
    });
    const last = monthsData[monthsData.length - 1];
    const prev = monthsData[monthsData.length - 2];
    const revenueChange = prev && prev.revenue > 0
      ? ((last.revenue - prev.revenue) / prev.revenue) * 100
      : null;
    const clientsChange = prev && prev.clients > 0
      ? ((last.clients - prev.clients) / prev.clients) * 100
      : null;
    return {
      totalRevenue,
      totalClients: allClients.size,
      revenueChange,
      clientsChange,
    };
  }, [monthsData, incomeTx]);

  const renderChange = (val: number | null) => {
    if (val === null) return <span className="text-xs text-muted-foreground">—</span>;
    const positive = val >= 0;
    const Icon = positive ? TrendingUp : TrendingDown;
    return (
      <span className={`text-xs font-medium inline-flex items-center gap-1 ${positive ? 'text-success' : 'text-destructive'}`}>
        <Icon className="w-3 h-3" />
        {positive ? '+' : ''}{val.toFixed(1)}% vs. mês anterior
      </span>
    );
  };

  const body = (
    <>
      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="text-sm text-muted-foreground">Clientes únicos no ano</p>
                <p className="text-2xl font-bold">{totals.totalClients}</p>
              </div>
              <Users className="w-8 h-8 text-primary opacity-70" />
            </div>
            {renderChange(totals.clientsChange)}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="text-sm text-muted-foreground">Faturamento no ano</p>
                <p className="text-2xl font-bold">{formatCurrency(totals.totalRevenue)}</p>
              </div>
              <DollarSign className="w-8 h-8 text-primary opacity-70" />
            </div>
            {renderChange(totals.revenueChange)}
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        {/* Clients per month */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Clientes atendidos por mês</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="w-full h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={monthsData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="label" className="text-xs" />
                  <YAxis allowDecimals={false} className="text-xs" />
                  <Tooltip
                    contentStyle={{ background: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: 8 }}
                    formatter={(v: number, name: string) => [`${v} cliente(s)`, name]}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="clients" name={`${year}`} fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  <Line type="monotone" dataKey="clientsPrev" name={`${year - 1}`} stroke="hsl(var(--muted-foreground))" strokeWidth={2} strokeDasharray="4 4" dot={{ r: 3 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Revenue per month */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Faturamento mês a mês</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="w-full h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={monthsData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="label" className="text-xs" />
                  <YAxis
                    className="text-xs"
                    tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : `${v}`}
                  />
                  <Tooltip
                    contentStyle={{ background: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: 8 }}
                    formatter={(v: number, name: string) => [formatCurrency(v), name]}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="revenue" name={`${year}`} fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  <Line type="monotone" dataKey="revenuePrev" name={`${year - 1}`} stroke="hsl(var(--muted-foreground))" strokeWidth={2} strokeDasharray="4 4" dot={{ r: 3 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );

  if (embedded) return body;

  return (
    <MainLayout>
      <PageHeader
        title="Indicadores"
        subtitle={`Evolução de ${year}`}
        action={
          <Button variant="outline" size="sm" onClick={() => navigate('/relatorios')}>
            <ArrowLeft className="w-4 h-4 mr-1" />
            Voltar
          </Button>
        }
      />
      {body}
    </MainLayout>
  );
}
