import { useState, useMemo } from 'react';
import { format, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon, Filter, Download, FileSpreadsheet, CalendarDays } from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useTransactions } from '@/hooks/useTransactions';
import { useAccounts } from '@/hooks/useAccounts';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

type ScopeFilter = 'todos' | 'empresa' | 'pessoal';

export default function Relatorios() {
  const navigate = useNavigate();
  const { data: transactions = [] } = useTransactions();
  const { data: accounts = [] } = useAccounts();
  const { toast } = useToast();

  const [selectedAccount, setSelectedAccount] = useState<string>('todos');
  const [selectedScope, setSelectedScope] = useState<ScopeFilter>('todos');
  const [startDate, setStartDate] = useState<Date>(startOfMonth(new Date()));
  const [endDate, setEndDate] = useState<Date>(endOfMonth(new Date()));

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    return transactions
      .filter(t => {
        const transactionDate = new Date(t.date);
        const inPeriod = isWithinInterval(transactionDate, { start: startDate, end: endDate });
        const matchAccount = selectedAccount === 'todos' || t.account === selectedAccount;
        const matchScope = selectedScope === 'todos' || t.scope === selectedScope;
        return inPeriod && matchAccount && matchScope;
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [transactions, selectedAccount, selectedScope, startDate, endDate]);

  // Calculate running balance
  const transactionsWithBalance = useMemo(() => {
    let balance = 0;
    return filteredTransactions.map(t => {
      balance += t.type === 'entrada' ? t.amount : -t.amount;
      return { ...t, runningBalance: balance };
    });
  }, [filteredTransactions]);

  // Category summary
  const categorySummary = useMemo(() => {
    const summary: Record<string, Record<string, { entradas: number; saidas: number }>> = {
      empresa: {},
      pessoal: {},
    };

    filteredTransactions.forEach(t => {
      if (!summary[t.scope][t.category]) {
        summary[t.scope][t.category] = { entradas: 0, saidas: 0 };
      }
      if (t.type === 'entrada') {
        summary[t.scope][t.category].entradas += t.amount;
      } else {
        summary[t.scope][t.category].saidas += t.amount;
      }
    });

    return summary;
  }, [filteredTransactions]);

  // Account summary
  const accountSummary = useMemo(() => {
    const summary: Record<string, { entradas: number; saidas: number }> = {};

    filteredTransactions.forEach(t => {
      if (!summary[t.account]) {
        summary[t.account] = { entradas: 0, saidas: 0 };
      }
      if (t.type === 'entrada') {
        summary[t.account].entradas += t.amount;
      } else {
        summary[t.account].saidas += t.amount;
      }
    });

    return summary;
  }, [filteredTransactions]);

  // Totals
  const totals = useMemo(() => {
    const result = {
      empresa: { entradas: 0, saidas: 0 },
      pessoal: { entradas: 0, saidas: 0 },
    };

    filteredTransactions.forEach(t => {
      if (t.type === 'entrada') {
        result[t.scope].entradas += t.amount;
      } else {
        result[t.scope].saidas += t.amount;
      }
    });

    return result;
  }, [filteredTransactions]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const getAccountName = (accountId: string): string => {
    const account = accounts.find(a => a.id === accountId || a.name === accountId);
    return account?.name || accountId;
  };

  const exportToPDF = () => {
    if (transactionsWithBalance.length === 0) {
      toast({
        title: "Sem dados",
        description: "Nenhuma transacao para exportar no periodo selecionado.",
        variant: "destructive",
      });
      return;
    }

    const doc = new jsPDF('landscape');
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Title
    doc.setFontSize(18);
    doc.text('Relatorio Financeiro', pageWidth / 2, 20, { align: 'center' });
    
    // Period info
    doc.setFontSize(10);
    const periodText = `Periodo: ${format(startDate, 'dd/MM/yyyy')} a ${format(endDate, 'dd/MM/yyyy')}`;
    const accountText = `Conta: ${selectedAccount === 'todos' ? 'Todas' : getAccountName(selectedAccount)}`;
    const scopeText = `Escopo: ${selectedScope === 'todos' ? 'Todos' : selectedScope === 'empresa' ? 'Empresa' : 'Pessoal'}`;
    
    doc.text(periodText, 14, 30);
    doc.text(accountText, 14, 36);
    doc.text(scopeText, 14, 42);

    // Statement table
    doc.setFontSize(12);
    doc.text('Extrato', 14, 52);

    const statementData = transactionsWithBalance.map(t => [
      format(new Date(t.date), 'dd/MM/yyyy'),
      t.scope === 'empresa' ? 'Emp' : 'Pes',
      t.description || t.category,
      t.category,
      t.type === 'entrada' ? formatCurrency(t.amount) : '',
      t.type === 'saida' ? formatCurrency(t.amount) : '',
      formatCurrency(t.runningBalance),
    ]);

    autoTable(doc, {
      startY: 56,
      head: [['Data', 'Tipo', 'Descricao', 'Categoria', 'Entrada', 'Saida', 'Saldo']],
      body: statementData,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [59, 130, 246] },
      columnStyles: {
        0: { cellWidth: 25 },
        1: { cellWidth: 15 },
        2: { cellWidth: 80 },
        3: { cellWidth: 35 },
        4: { cellWidth: 30, halign: 'right' },
        5: { cellWidth: 30, halign: 'right' },
        6: { cellWidth: 30, halign: 'right' },
      },
    });

    // Category Summary
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(12);
    doc.text('Resumo por Categoria', 14, finalY);

    const summaryData: string[][] = [];

    const addScopeSummary = (scope: 'empresa' | 'pessoal', label: string) => {
      const categories = categorySummary[scope];
      const scopeTotals = totals[scope];
      
      if (Object.keys(categories).length > 0) {
        summaryData.push([label, '', '', '']);
        
        Object.entries(categories).forEach(([category, values]) => {
          if (values.entradas > 0 || values.saidas > 0) {
            summaryData.push([
              '',
              category,
              values.entradas > 0 ? formatCurrency(values.entradas) : '-',
              values.saidas > 0 ? formatCurrency(values.saidas) : '-',
            ]);
          }
        });

        const balance = scopeTotals.entradas - scopeTotals.saidas;
        summaryData.push([
          '',
          'Subtotal',
          formatCurrency(scopeTotals.entradas),
          formatCurrency(scopeTotals.saidas),
        ]);
        summaryData.push(['', 'Saldo', '', (balance >= 0 ? '+' : '') + formatCurrency(balance)]);
      }
    };

    if (selectedScope === 'todos' || selectedScope === 'empresa') {
      addScopeSummary('empresa', 'EMPRESA');
    }
    if (selectedScope === 'todos' || selectedScope === 'pessoal') {
      addScopeSummary('pessoal', 'PESSOAL');
    }

    autoTable(doc, {
      startY: finalY + 4,
      head: [['Escopo', 'Categoria', 'Entradas', 'Saidas']],
      body: summaryData,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [59, 130, 246] },
    });

    // Account Summary
    const accountFinalY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(12);
    doc.text('Resumo por Conta', 14, accountFinalY);

    const accountData = Object.entries(accountSummary).map(([account, values]) => {
      const balance = values.entradas - values.saidas;
      return [
        getAccountName(account),
        formatCurrency(values.entradas),
        formatCurrency(values.saidas),
        (balance >= 0 ? '+' : '') + formatCurrency(balance),
      ];
    });

    autoTable(doc, {
      startY: accountFinalY + 4,
      head: [['Conta', 'Entradas', 'Saidas', 'Saldo']],
      body: accountData,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [59, 130, 246] },
    });

    // Totals
    const finalY2 = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(12);
    doc.text('Totais do Periodo', 14, finalY2);

    const totalsData: string[][] = [];
    
    if (selectedScope === 'todos' || selectedScope === 'empresa') {
      const empresaBalance = totals.empresa.entradas - totals.empresa.saidas;
      totalsData.push(['Empresa', (empresaBalance >= 0 ? '+' : '') + formatCurrency(empresaBalance)]);
    }
    if (selectedScope === 'todos' || selectedScope === 'pessoal') {
      const pessoalBalance = totals.pessoal.entradas - totals.pessoal.saidas;
      totalsData.push(['Pessoal', (pessoalBalance >= 0 ? '+' : '') + formatCurrency(pessoalBalance)]);
    }
    
    totalsData.push(['SALDO GERAL', (totalGeral >= 0 ? '+' : '') + formatCurrency(totalGeral)]);

    autoTable(doc, {
      startY: finalY2 + 4,
      body: totalsData,
      styles: { fontSize: 10 },
      columnStyles: {
        0: { fontStyle: 'bold' },
        1: { halign: 'right', fontStyle: 'bold' },
      },
    });

    // Save
    const fileName = `relatorio_${format(startDate, 'ddMMyyyy')}_${format(endDate, 'ddMMyyyy')}.pdf`;
    doc.save(fileName);

    toast({
      title: "PDF exportado",
      description: `Arquivo ${fileName} salvo com sucesso.`,
    });
  };

  const renderCategorySummary = (scope: 'empresa' | 'pessoal', title: string) => {
    const categories = categorySummary[scope];
    const scopeTotals = totals[scope];
    const balance = scopeTotals.entradas - scopeTotals.saidas;

    const hasData = Object.keys(categories).length > 0;

    if (!hasData && selectedScope !== 'todos' && selectedScope !== scope) {
      return null;
    }

    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Badge variant={scope === 'empresa' ? 'default' : 'secondary'}>
            {title}
          </Badge>
        </div>

        {hasData ? (
          <>
            {/* Entradas */}
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Entradas</p>
              <div className="space-y-1">
                {Object.entries(categories)
                  .filter(([_, values]) => values.entradas > 0)
                  .map(([category, values]) => (
                    <div key={`${scope}-entrada-${category}`} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">• {category}</span>
                      <span className="text-success font-medium">{formatCurrency(values.entradas)}</span>
                    </div>
                  ))}
                {Object.values(categories).every(v => v.entradas === 0) && (
                  <p className="text-sm text-muted-foreground">Nenhuma entrada</p>
                )}
              </div>
            </div>

            {/* Saídas */}
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Saídas</p>
              <div className="space-y-1">
                {Object.entries(categories)
                  .filter(([_, values]) => values.saidas > 0)
                  .map(([category, values]) => (
                    <div key={`${scope}-saida-${category}`} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">• {category}</span>
                      <span className="text-destructive font-medium">{formatCurrency(values.saidas)}</span>
                    </div>
                  ))}
                {Object.values(categories).every(v => v.saidas === 0) && (
                  <p className="text-sm text-muted-foreground">Nenhuma saída</p>
                )}
              </div>
            </div>

            <Separator />

            {/* Subtotal */}
            <div className="flex justify-between font-medium">
              <span>Subtotal</span>
              <span className={cn(balance >= 0 ? 'text-success' : 'text-destructive')}>
                {balance >= 0 ? '+' : ''}{formatCurrency(balance)}
              </span>
            </div>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">Nenhuma transação no período</p>
        )}
      </div>
    );
  };

  const totalGeral = (totals.empresa.entradas + totals.pessoal.entradas) - (totals.empresa.saidas + totals.pessoal.saidas);

  return (
    <MainLayout>
      <PageHeader
        title="Relatorios"
        subtitle="Extrato e resumo financeiro"
        action={
          <div className="flex gap-2">
            <Button onClick={() => navigate('/relatorio-agendamentos')} size="sm" variant="outline">
              <CalendarDays className="h-4 w-4 mr-1" />
              Agendas
            </Button>
            <Button onClick={() => navigate('/relatorio-movimentacoes')} size="sm" variant="outline">
              <FileSpreadsheet className="h-4 w-4 mr-1" />
              Movim.
            </Button>
            <Button onClick={exportToPDF} size="sm" variant="outline">
              <Download className="h-4 w-4 mr-1" />
              PDF
            </Button>
          </div>
        }
      />

      <div className="space-y-4">
        {/* Filters */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-3">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Filtros</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Account filter */}
              <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                <SelectTrigger>
                  <SelectValue placeholder="Conta" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todas as contas</SelectItem>
                  {accounts.map(account => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Scope filter */}
              <Select value={selectedScope} onValueChange={(v) => setSelectedScope(v as ScopeFilter)}>
                <SelectTrigger>
                  <SelectValue placeholder="Escopo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="empresa">Empresa</SelectItem>
                  <SelectItem value="pessoal">Pessoal</SelectItem>
                </SelectContent>
              </Select>

              {/* Start date */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(startDate, 'dd/MM/yy', { locale: ptBR })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={(date) => date && setStartDate(date)}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>

              {/* End date */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(endDate, 'dd/MM/yy', { locale: ptBR })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={(date) => date && setEndDate(date)}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </CardContent>
        </Card>

        {/* Statement */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Extrato</CardTitle>
          </CardHeader>
          <CardContent>
            {transactionsWithBalance.length > 0 ? (
              <ScrollArea className="h-[250px]">
                <div className="space-y-2">
                  {transactionsWithBalance.map((t) => (
                    <div
                      key={t.id}
                      className="flex items-center justify-between py-2 border-b border-border last:border-0"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(t.date), 'dd/MM', { locale: ptBR })}
                          </span>
                          <Badge variant={t.scope === 'empresa' ? 'default' : 'secondary'} className="text-[10px] px-1.5 py-0">
                            {t.scope === 'empresa' ? 'Emp' : 'Pes'}
                          </Badge>
                        </div>
                        <p className="text-sm truncate">{t.description || t.category}</p>
                        <p className="text-xs text-muted-foreground">{t.category}</p>
                      </div>
                      <div className="text-right">
                        <p className={cn(
                          'text-sm font-medium',
                          t.type === 'entrada' ? 'text-success' : 'text-destructive'
                        )}>
                          {t.type === 'entrada' ? '+' : '-'}{formatCurrency(t.amount)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Saldo: {formatCurrency(t.runningBalance)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                Nenhuma transação encontrada no período
              </p>
            )}
          </CardContent>
        </Card>

        {/* Category Summary */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Resumo por Categoria</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {(selectedScope === 'todos' || selectedScope === 'empresa') && (
              renderCategorySummary('empresa', 'Empresa')
            )}
            
            {selectedScope === 'todos' && <Separator />}
            
            {(selectedScope === 'todos' || selectedScope === 'pessoal') && (
              renderCategorySummary('pessoal', 'Pessoal')
            )}
          </CardContent>
        </Card>

        {/* Account Summary */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Resumo por Conta</CardTitle>
          </CardHeader>
          <CardContent>
            {Object.keys(accountSummary).length > 0 ? (
              <div className="space-y-3">
                {Object.entries(accountSummary).map(([account, values]) => {
                  const balance = values.entradas - values.saidas;
                  return (
                    <div key={account} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{account}</span>
                        <span className={cn(balance >= 0 ? 'text-success' : 'text-destructive', 'font-medium')}>
                          {balance >= 0 ? '+' : ''}{formatCurrency(balance)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>Entradas: {formatCurrency(values.entradas)}</span>
                        <span>Saídas: {formatCurrency(values.saidas)}</span>
                      </div>
                      <Separator />
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Nenhuma transação no período</p>
            )}
          </CardContent>
        </Card>

        {/* Period Totals */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Totais do Período</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(selectedScope === 'todos' || selectedScope === 'empresa') && (
              <div className="flex justify-between">
                <span className="text-sm">Empresa</span>
                <span className={cn(
                  'font-medium',
                  (totals.empresa.entradas - totals.empresa.saidas) >= 0 ? 'text-success' : 'text-destructive'
                )}>
                  {(totals.empresa.entradas - totals.empresa.saidas) >= 0 ? '+' : ''}
                  {formatCurrency(totals.empresa.entradas - totals.empresa.saidas)}
                </span>
              </div>
            )}

            {(selectedScope === 'todos' || selectedScope === 'pessoal') && (
              <div className="flex justify-between">
                <span className="text-sm">Pessoal</span>
                <span className={cn(
                  'font-medium',
                  (totals.pessoal.entradas - totals.pessoal.saidas) >= 0 ? 'text-success' : 'text-destructive'
                )}>
                  {(totals.pessoal.entradas - totals.pessoal.saidas) >= 0 ? '+' : ''}
                  {formatCurrency(totals.pessoal.entradas - totals.pessoal.saidas)}
                </span>
              </div>
            )}

            <Separator />

            <div className="flex justify-between">
              <span className="font-semibold">Saldo Geral</span>
              <span className={cn(
                'font-bold text-lg',
                totalGeral >= 0 ? 'text-success' : 'text-destructive'
              )}>
                {totalGeral >= 0 ? '+' : ''}{formatCurrency(totalGeral)}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
