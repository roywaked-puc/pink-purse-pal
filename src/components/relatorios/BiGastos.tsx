import { useMemo, useState } from 'react';
import { addMonths, endOfMonth, format, isWithinInterval, startOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, TrendingDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTransactions } from '@/hooks/useTransactions';
import { formatCurrency, cn } from '@/lib/utils';
import type { TransactionScope } from '@/types';

interface CategoryTotal {
  category: string;
  total: number;
  pct: number;
}

function useGastosByScope(month: Date) {
  const { data: transactions = [] } = useTransactions();

  return useMemo(() => {
    const start = startOfMonth(month);
    const end = endOfMonth(month);

    const build = (scope: TransactionScope) => {
      const items = transactions.filter(
        (t) =>
          t.type === 'saida' &&
          t.scope === scope &&
          isWithinInterval(new Date(t.date), { start, end }),
      );
      const total = items.reduce((s, t) => s + t.amount, 0);
      const byCat = new Map<string, number>();
      items.forEach((t) => {
        byCat.set(t.category, (byCat.get(t.category) ?? 0) + t.amount);
      });
      const cats: CategoryTotal[] = Array.from(byCat.entries())
        .filter(([, v]) => v > 0)
        .map(([category, value]) => ({
          category,
          total: value,
          pct: total > 0 ? (value / total) * 100 : 0,
        }))
        .sort((a, b) => b.total - a.total);
      return { total, cats };
    };

    return { empresa: build('empresa'), pessoal: build('pessoal') };
  }, [transactions, month]);
}

interface ScopeSectionProps {
  title: string;
  tone: 'empresa' | 'pessoal';
  total: number;
  cats: CategoryTotal[];
}

function ScopeSection({ title, tone, total, cats }: ScopeSectionProps) {
  const maxValue = cats[0]?.total ?? 0;
  const barColor = tone === 'empresa' ? 'bg-primary' : 'bg-secondary';

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Badge variant={tone === 'empresa' ? 'default' : 'secondary'}>{title}</Badge>
          </CardTitle>
          <div className="text-right">
            <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Total no mês</p>
            <p className="text-lg font-semibold text-destructive tabular-nums">
              {formatCurrency(total)}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {cats.length === 0 ? (
          <p className="text-sm text-muted-foreground py-2">
            Nenhuma despesa registrada neste mês.
          </p>
        ) : (
          <>
            {/* Gráfico de barras horizontais */}
            <div className="space-y-2">
              {cats.map((c) => {
                const width = maxValue > 0 ? (c.total / maxValue) * 100 : 0;
                return (
                  <div key={c.category} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="truncate pr-2">{c.category}</span>
                      <span className="text-muted-foreground tabular-nums">
                        {c.pct.toFixed(1)}%
                      </span>
                    </div>
                    <div className="h-2.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className={cn('h-full rounded-full transition-all', barColor)}
                        style={{ width: `${Math.max(width, 2)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Lista textual */}
            <div className="border-t pt-3 space-y-1.5">
              {cats.map((c) => (
                <div
                  key={`list-${c.category}`}
                  className="flex justify-between text-sm"
                >
                  <span className="text-muted-foreground truncate pr-2">• {c.category}</span>
                  <span className="font-medium tabular-nums">{formatCurrency(c.total)}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export function BiGastos() {
  const [month, setMonth] = useState<Date>(startOfMonth(new Date()));
  const { empresa, pessoal } = useGastosByScope(month);

  return (
    <div className="space-y-4">
      {/* Header com seletor de mês */}
      <Card>
        <CardContent className="py-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <TrendingDown className="w-4 h-4 text-destructive shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-semibold">BI de Gastos</p>
                <p className="text-xs text-muted-foreground">
                  Despesas por categoria — Empresa e Pessoal
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setMonth((m) => addMonths(m, -1))}
                aria-label="Mês anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm font-medium capitalize min-w-[130px] text-center">
                {format(month, "MMMM 'de' yyyy", { locale: ptBR })}
              </span>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setMonth((m) => addMonths(m, 1))}
                aria-label="Próximo mês"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <ScopeSection
        title="Gastos Empresa"
        tone="empresa"
        total={empresa.total}
        cats={empresa.cats}
      />
      <ScopeSection
        title="Gastos Pessoal"
        tone="pessoal"
        total={pessoal.total}
        cats={pessoal.cats}
      />
    </div>
  );
}
