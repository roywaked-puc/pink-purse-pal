import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, DollarSign, Repeat } from 'lucide-react';
import {
  Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Line, Legend, ComposedChart,
} from 'recharts';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useApp } from '@/contexts/AppContext';
import { calcularIndicadoresMensais, temAtendimentosNoAno, anoMesSaoPaulo } from '@/lib/indicadoresMensais';

const MONTH_LABELS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

const formatCurrency = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
const formatCurto = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v);
const compacto = (v: number) => (v >= 1000 ? `${Number((v / 1000).toFixed(1))}k` : `${v}`);

interface Props { embedded?: boolean }

type Linha = {
  label: string; faturamento: number; aReceber: number; permuta: number;
  pagos: number; permutaQtd: number; total: number; clientes: number;
  faturamentoPrev: number; totalPrev: number;
};

const tooltipBox = 'rounded-lg border border-border bg-background px-3 py-2 text-xs shadow-md max-w-[240px] leading-relaxed';

function TooltipAtendimentos({ active, payload, comparar, anoPrev }: any) {
  if (!active || !payload?.length) return null;
  const d: Linha = payload[0].payload;
  return (
    <div className={tooltipBox}>
      <p className="font-semibold">{d.label}</p>
      <p>{d.total} atendimentos · {d.permutaQtd} em permuta · {d.clientes} clientes</p>
      {comparar && <p className="text-muted-foreground">{anoPrev}: {d.totalPrev} atendimentos</p>}
    </div>
  );
}

function TooltipFaturamento({ active, payload, comparar, anoPrev }: any) {
  if (!active || !payload?.length) return null;
  const d: Linha = payload[0].payload;
  return (
    <div className={tooltipBox}>
      <p className="font-semibold">{d.label}</p>
      <p>Faturamento {formatCurto(d.faturamento)} ({formatCurto(d.aReceber)} a receber)</p>
      <p>Permuta {formatCurto(d.permuta)} <span className="text-muted-foreground">(não entra no faturamento)</span></p>
      {comparar && <p className="text-muted-foreground">{anoPrev}: {formatCurto(d.faturamentoPrev)}</p>}
    </div>
  );
}

export default function RelatorioIndicadores({ embedded = false }: Props = {}) {
  const navigate = useNavigate();
  const { appointments } = useApp();
  const [comparar, setComparar] = useState(false);

  const { ano: year, mes: currentMonth } = anoMesSaoPaulo(new Date());

  const atual = useMemo(() => calcularIndicadoresMensais(appointments, year), [appointments, year]);
  const anterior = useMemo(() => calcularIndicadoresMensais(appointments, year - 1), [appointments, year]);
  const temAnterior = useMemo(() => temAtendimentosNoAno(appointments, year - 1), [appointments, year]);
  const mostrarComparacao = comparar && temAnterior;

  const monthsData: Linha[] = useMemo(() => atual.slice(0, currentMonth + 1).map((m, i) => ({
    label: MONTH_LABELS[i],
    faturamento: m.faturamento,
    aReceber: m.aReceber,
    permuta: m.permuta,
    pagos: m.atendimentosPagos,
    permutaQtd: m.atendimentosPermuta,
    total: m.atendimentosPagos + m.atendimentosPermuta,
    clientes: m.clientesUnicas,
    faturamentoPrev: anterior[i].faturamento,
    totalPrev: anterior[i].atendimentosPagos + anterior[i].atendimentosPermuta,
  })), [atual, anterior, currentMonth]);

  const totals = useMemo(() => atual.reduce((t, m) => ({
    faturamento: t.faturamento + m.faturamento,
    aReceber: t.aReceber + m.aReceber,
    permuta: t.permuta + m.permuta,
  }), { faturamento: 0, aReceber: 0, permuta: 0 }), [atual]);

  const eixo = { fontSize: 11, fill: 'hsl(var(--muted-foreground))' };
  const margem = { top: 8, right: 4, left: -16, bottom: 0 };

  const body = (
    <>
      <div className="grid grid-cols-2 gap-3 mb-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm text-muted-foreground">Faturamento</p>
              <DollarSign className="w-5 h-5 text-primary opacity-70 shrink-0" />
            </div>
            <p className="text-xl md:text-2xl font-bold break-words">{formatCurrency(totals.faturamento)}</p>
            <p className="text-xs text-muted-foreground">{formatCurrency(totals.aReceber)} a receber</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm text-muted-foreground">Permuta</p>
              <Repeat className="w-5 h-5 text-primary opacity-70 shrink-0" />
            </div>
            <p className="text-xl md:text-2xl font-bold break-words">{formatCurrency(totals.permuta)}</p>
            <p className="text-xs text-muted-foreground">em {year}</p>
          </CardContent>
        </Card>
      </div>

      {temAnterior && (
        <div className="flex items-center gap-3 mb-4 min-h-[44px]">
          <Switch id="comparar-ano" checked={comparar} onCheckedChange={setComparar} />
          <Label htmlFor="comparar-ano" className="cursor-pointer">Comparar com {year - 1}</Label>
        </div>
      )}

      <div className="space-y-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Atendimentos por mês</CardTitle>
          </CardHeader>
          <CardContent className="px-2 sm:px-6">
            <div className="w-full h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={monthsData} margin={margem}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
                  <XAxis dataKey="label" tick={eixo} interval={0} tickLine={false} />
                  <YAxis allowDecimals={false} tick={eixo} tickLine={false} axisLine={false} />
                  <Tooltip content={<TooltipAtendimentos comparar={mostrarComparacao} anoPrev={year - 1} />} cursor={{ fill: 'hsl(var(--muted))', opacity: 0.4 }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="pagos" name="Pagos" stackId="a" fill="hsl(var(--primary))" />
                  <Bar dataKey="permutaQtd" name="Permuta" stackId="a" fill="hsl(var(--primary))" fillOpacity={0.35} radius={[4, 4, 0, 0]} />
                  {mostrarComparacao && (
                    <Line type="monotone" dataKey="totalPrev" name={`Total ${year - 1}`} stroke="hsl(var(--muted-foreground))" strokeWidth={2} strokeDasharray="4 4" dot={false} />
                  )}
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 space-y-1">
            <CardTitle className="text-base">Faturamento por mês</CardTitle>
            <p className="text-xs sm:text-[13px] text-muted-foreground">
              Valor dos atendimentos realizados no mês, sem permuta. A divisão empresa/pessoal fica em Movimentações.
            </p>
          </CardHeader>
          <CardContent className="px-2 sm:px-6">
            <div className="w-full h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={monthsData} margin={margem}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
                  <XAxis dataKey="label" tick={eixo} interval={0} tickLine={false} />
                  <YAxis tick={eixo} tickFormatter={compacto} tickLine={false} axisLine={false} />
                  <Tooltip content={<TooltipFaturamento comparar={mostrarComparacao} anoPrev={year - 1} />} cursor={{ fill: 'hsl(var(--muted))', opacity: 0.4 }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="faturamento" name="Faturamento" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  <Line type="monotone" dataKey="permuta" name="Permuta" stroke="hsl(var(--muted-foreground))" strokeWidth={1.5} dot={{ r: 2.5 }} />
                  {mostrarComparacao && (
                    <Line type="monotone" dataKey="faturamentoPrev" name={`Faturamento ${year - 1}`} stroke="hsl(var(--foreground))" strokeOpacity={0.5} strokeWidth={2} strokeDasharray="4 4" dot={false} />
                  )}
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
