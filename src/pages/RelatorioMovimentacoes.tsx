import { useState, useMemo } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useApp } from '@/contexts/AppContext';
import { format, startOfMonth, endOfMonth, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon, FileText, FileSpreadsheet, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

type ScopeFilter = 'todos' | 'empresa' | 'pessoal';
type TypeFilter = 'todos' | 'entrada' | 'saida';

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

const convertToCSV = (data: string[][], headers: string[]): string => {
  const csvRows = [];
  csvRows.push(headers.join(';'));
  
  for (const row of data) {
    const values = row.map(value => {
      if (typeof value === 'string') {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value ?? '';
    });
    csvRows.push(values.join(';'));
  }
  
  return csvRows.join('\n');
};

const downloadCSV = (content: string, filename: string) => {
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  
  URL.revokeObjectURL(url);
};

const getDateSuffix = () => format(new Date(), 'yyyy-MM-dd');

export default function RelatorioMovimentacoes() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { transactions, appointments, categories, accounts, clients } = useApp();

  // Filter states
  const [startDate, setStartDate] = useState<Date>(startOfMonth(new Date()));
  const [endDate, setEndDate] = useState<Date>(endOfMonth(new Date()));
  const [selectedCategory, setSelectedCategory] = useState<string>('todos');
  const [selectedClient, setSelectedClient] = useState<string>('todos');
  const [selectedAccount, setSelectedAccount] = useState<string>('todos');
  const [selectedType, setSelectedType] = useState<TypeFilter>('todos');
  const [selectedScope, setSelectedScope] = useState<ScopeFilter>('todos');

  // Enriched and filtered transactions
  const enrichedTransactions = useMemo(() => {
    return transactions
      .filter(t => {
        const tDate = new Date(t.date);
        // Date range filter
        if (tDate < startDate || tDate > endDate) return false;
        // Category filter
        if (selectedCategory !== 'todos' && t.category !== selectedCategory) return false;
        // Account filter
        if (selectedAccount !== 'todos' && t.account !== selectedAccount) return false;
        // Type filter
        if (selectedType !== 'todos' && t.type !== selectedType) return false;
        // Scope filter
        if (selectedScope !== 'todos' && t.scope !== selectedScope) return false;
        // Client filter - check if transaction is linked to an appointment of selected client
        if (selectedClient !== 'todos') {
          if (!t.appointmentId) return false;
          const apt = appointments.find(a => a.id === t.appointmentId);
          if (!apt || apt.clientId !== selectedClient) return false;
        }
        return true;
      })
      .map(t => {
        const appointment = t.appointmentId 
          ? appointments.find(a => a.id === t.appointmentId)
          : null;
        
        return {
          ...t,
          appointmentDate: appointment?.date || null,
          appointmentNotes: appointment?.notes || null,
          clientName: appointment?.clientName || null,
        };
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [transactions, appointments, startDate, endDate, selectedCategory, selectedClient, selectedAccount, selectedType, selectedScope]);

  // Calculate initial balance for a specific scope or account
  const calculateInitialBalance = (filterKey: 'scope' | 'account', filterValue: string): number => {
    return transactions
      .filter(t => {
        const tDate = new Date(t.date);
        // Only transactions BEFORE the start date
        if (tDate >= startDate) return false;
        // Filter by scope or account
        if (filterKey === 'scope') return t.scope === filterValue;
        if (filterKey === 'account') return t.account === filterValue;
        return false;
      })
      .reduce((acc, t) => {
        if (t.type === 'entrada') return acc + t.amount;
        if (t.type === 'saida') return acc - t.amount;
        return acc;
      }, 0);
  };

  // Summary by scope (origem)
  const scopeSummary = useMemo(() => {
    const scopes = ['empresa', 'pessoal'] as const;
    const summary = scopes.map(scope => {
      const scopeTransactions = enrichedTransactions.filter(t => t.scope === scope);
      const initialBalance = calculateInitialBalance('scope', scope);
      const entries = scopeTransactions.filter(t => t.type === 'entrada').reduce((acc, t) => acc + t.amount, 0);
      const exits = scopeTransactions.filter(t => t.type === 'saida').reduce((acc, t) => acc + t.amount, 0);
      const finalBalance = initialBalance + entries - exits;
      
      return {
        scope,
        label: scope === 'empresa' ? 'Empresa' : 'Pessoal',
        initialBalance,
        entries,
        exits,
        finalBalance,
      };
    });

    const total = {
      scope: 'total',
      label: 'Total',
      initialBalance: summary.reduce((acc, s) => acc + s.initialBalance, 0),
      entries: summary.reduce((acc, s) => acc + s.entries, 0),
      exits: summary.reduce((acc, s) => acc + s.exits, 0),
      finalBalance: summary.reduce((acc, s) => acc + s.finalBalance, 0),
    };

    return [...summary, total];
  }, [enrichedTransactions, startDate, transactions]);

  // Summary by account (banco)
  const accountSummary = useMemo(() => {
    const uniqueAccounts = [...new Set(enrichedTransactions.map(t => t.account))];
    
    const summary = uniqueAccounts.map(account => {
      const accountTransactions = enrichedTransactions.filter(t => t.account === account);
      const initialBalance = calculateInitialBalance('account', account);
      const entries = accountTransactions.filter(t => t.type === 'entrada').reduce((acc, t) => acc + t.amount, 0);
      const exits = accountTransactions.filter(t => t.type === 'saida').reduce((acc, t) => acc + t.amount, 0);
      const finalBalance = initialBalance + entries - exits;
      
      return {
        account,
        initialBalance,
        entries,
        exits,
        finalBalance,
      };
    });

    const total = {
      account: 'Total',
      initialBalance: summary.reduce((acc, s) => acc + s.initialBalance, 0),
      entries: summary.reduce((acc, s) => acc + s.entries, 0),
      exits: summary.reduce((acc, s) => acc + s.exits, 0),
      finalBalance: summary.reduce((acc, s) => acc + s.finalBalance, 0),
    };

    return [...summary, total];
  }, [enrichedTransactions, startDate, transactions]);

  // Export to CSV
  const exportToCSV = () => {
    if (enrichedTransactions.length === 0) {
      toast({ title: 'Sem dados', description: 'Não há movimentações para exportar.', variant: 'destructive' });
      return;
    }

    const headers = [
      'Data/Hora Agenda', 'Data Movimentação', 'Categoria', 
      'Tipo', 'Origem', 'Banco', 'Valor', 'Descrição', 'Obs. Agenda'
    ];
    
    const rows = enrichedTransactions.map(t => [
      t.appointmentDate ? format(new Date(t.appointmentDate), 'dd/MM/yyyy HH:mm') : '-',
      format(new Date(t.date), 'dd/MM/yyyy'),
      t.category,
      t.type === 'entrada' ? 'Entrada' : 'Saída',
      t.scope === 'empresa' ? 'Empresa' : 'Pessoal',
      t.account,
      t.amount.toFixed(2).replace('.', ','),
      t.description || '',
      t.appointmentNotes || ''
    ]);

    // Add empty row
    rows.push(['', '', '', '', '', '', '', '', '']);
    rows.push(['RESUMO POR ORIGEM', '', '', '', '', '', '', '', '']);
    rows.push(['Origem', 'Saldo Inicial', 'Entradas', 'Saídas', 'Saldo Final', '', '', '', '']);
    
    scopeSummary.forEach(s => {
      rows.push([
        s.label,
        s.initialBalance.toFixed(2).replace('.', ','),
        s.entries.toFixed(2).replace('.', ','),
        s.exits.toFixed(2).replace('.', ','),
        s.finalBalance.toFixed(2).replace('.', ','),
        '', '', '', ''
      ]);
    });

    rows.push(['', '', '', '', '', '', '', '', '']);
    rows.push(['RESUMO POR BANCO', '', '', '', '', '', '', '', '']);
    rows.push(['Banco', 'Saldo Inicial', 'Entradas', 'Saídas', 'Saldo Final', '', '', '', '']);
    
    accountSummary.forEach(s => {
      rows.push([
        s.account,
        s.initialBalance.toFixed(2).replace('.', ','),
        s.entries.toFixed(2).replace('.', ','),
        s.exits.toFixed(2).replace('.', ','),
        s.finalBalance.toFixed(2).replace('.', ','),
        '', '', '', ''
      ]);
    });

    const csv = convertToCSV(rows, headers);
    downloadCSV(csv, `relatorio_movimentacoes_${getDateSuffix()}.csv`);
    toast({ title: 'Exportação concluída', description: `${enrichedTransactions.length} movimentações exportadas.` });
  };

  // Export to PDF
  const exportToPDF = () => {
    if (enrichedTransactions.length === 0) {
      toast({ title: 'Sem dados', description: 'Não há movimentações para exportar.', variant: 'destructive' });
      return;
    }

    const doc = new jsPDF('landscape');
    
    // Header
    doc.setFontSize(16);
    doc.text('Relatório de Movimentações', 14, 15);
    
    doc.setFontSize(10);
    doc.text(`Período: ${format(startDate, 'dd/MM/yyyy')} a ${format(endDate, 'dd/MM/yyyy')}`, 14, 22);
    
    // Applied filters
    const filters: string[] = [];
    if (selectedCategory !== 'todos') filters.push(`Categoria: ${selectedCategory}`);
    if (selectedClient !== 'todos') {
      const client = clients.find(c => c.id === selectedClient);
      filters.push(`Cliente: ${client?.name || selectedClient}`);
    }
    if (selectedAccount !== 'todos') filters.push(`Banco: ${selectedAccount}`);
    if (selectedType !== 'todos') filters.push(`Tipo: ${selectedType === 'entrada' ? 'Entrada' : 'Saída'}`);
    if (selectedScope !== 'todos') filters.push(`Origem: ${selectedScope === 'empresa' ? 'Empresa' : 'Pessoal'}`);
    
    if (filters.length > 0) {
      doc.text(`Filtros: ${filters.join(' | ')}`, 14, 28);
    }

    // Main table
    const tableData = enrichedTransactions.map(t => [
      t.appointmentDate ? format(new Date(t.appointmentDate), 'dd/MM/yy HH:mm') : '-',
      format(new Date(t.date), 'dd/MM/yyyy'),
      t.category,
      t.type === 'entrada' ? 'Entrada' : 'Saída',
      t.scope === 'empresa' ? 'Empresa' : 'Pessoal',
      t.account,
      formatCurrency(t.amount),
      t.description || '-',
      t.appointmentNotes || '-'
    ]);

    autoTable(doc, {
      head: [['Data Agenda', 'Data Mov.', 'Categoria', 'Tipo', 'Origem', 'Banco', 'Valor', 'Descrição', 'Obs. Agenda']],
      body: tableData,
      startY: filters.length > 0 ? 34 : 28,
      styles: { fontSize: 7, cellPadding: 1 },
      headStyles: { fillColor: [59, 130, 246] },
      columnStyles: {
        0: { cellWidth: 25 },
        1: { cellWidth: 22 },
        2: { cellWidth: 25 },
        3: { cellWidth: 18 },
        4: { cellWidth: 20 },
        5: { cellWidth: 25 },
        6: { cellWidth: 22, halign: 'right' },
        7: { cellWidth: 40 },
        8: { cellWidth: 40 },
      },
    });

    // Scope summary
    const scopeTableData = scopeSummary.map(s => [
      s.label,
      formatCurrency(s.initialBalance),
      formatCurrency(s.entries),
      formatCurrency(s.exits),
      formatCurrency(s.finalBalance),
    ]);

    autoTable(doc, {
      head: [['Origem', 'Saldo Inicial', 'Entradas', 'Saídas', 'Saldo Final']],
      body: scopeTableData,
      startY: (doc as any).lastAutoTable.finalY + 10,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [34, 197, 94] },
      columnStyles: {
        1: { halign: 'right' },
        2: { halign: 'right' },
        3: { halign: 'right' },
        4: { halign: 'right' },
      },
    });

    // Account summary
    const accountTableData = accountSummary.map(s => [
      s.account,
      formatCurrency(s.initialBalance),
      formatCurrency(s.entries),
      formatCurrency(s.exits),
      formatCurrency(s.finalBalance),
    ]);

    autoTable(doc, {
      head: [['Banco', 'Saldo Inicial', 'Entradas', 'Saídas', 'Saldo Final']],
      body: accountTableData,
      startY: (doc as any).lastAutoTable.finalY + 10,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [168, 85, 247] },
      columnStyles: {
        1: { halign: 'right' },
        2: { halign: 'right' },
        3: { halign: 'right' },
        4: { halign: 'right' },
      },
    });

    doc.save(`relatorio_movimentacoes_${getDateSuffix()}.pdf`);
    toast({ title: 'Exportação concluída', description: 'PDF gerado com sucesso.' });
  };

  return (
    <MainLayout>
      <PageHeader 
        title="Relatório de Movimentações"
        subtitle="Relatório detalhado com dados de agendamentos"
        action={
          <Button variant="ghost" size="sm" onClick={() => navigate('/movimentacoes')}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            Voltar
          </Button>
        }
      />

      <div className="space-y-4">
        {/* Filters */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Filtros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {/* Start Date */}
              <div className="space-y-1">
                <Label className="text-xs">Data Início</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-3 w-3" />
                      {format(startDate, 'dd/MM/yyyy')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={(date) => date && setStartDate(date)}
                      locale={ptBR}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* End Date */}
              <div className="space-y-1">
                <Label className="text-xs">Data Fim</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-3 w-3" />
                      {format(endDate, 'dd/MM/yyyy')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={(date) => date && setEndDate(date)}
                      locale={ptBR}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Category */}
              <div className="space-y-1">
                <Label className="text-xs">Categoria</Label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todas</SelectItem>
                    {categories.map(cat => (
                      <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Client */}
              <div className="space-y-1">
                <Label className="text-xs">Cliente</Label>
                <Select value={selectedClient} onValueChange={setSelectedClient}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    {clients.map(client => (
                      <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Account */}
              <div className="space-y-1">
                <Label className="text-xs">Banco/Conta</Label>
                <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todas</SelectItem>
                    {accounts.map(acc => (
                      <SelectItem key={acc.id} value={acc.name}>{acc.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Type */}
              <div className="space-y-1">
                <Label className="text-xs">Tipo</Label>
                <Select value={selectedType} onValueChange={(v) => setSelectedType(v as TypeFilter)}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="entrada">Entrada</SelectItem>
                    <SelectItem value="saida">Saída</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Scope */}
              <div className="space-y-1">
                <Label className="text-xs">Origem</Label>
                <Select value={selectedScope} onValueChange={(v) => setSelectedScope(v as ScopeFilter)}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todas</SelectItem>
                    <SelectItem value="empresa">Empresa</SelectItem>
                    <SelectItem value="pessoal">Pessoal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Export buttons */}
            <div className="flex gap-2 mt-4 pt-4 border-t">
              <Button onClick={exportToPDF} size="sm" variant="outline">
                <FileText className="h-4 w-4 mr-2" />
                Exportar PDF
              </Button>
              <Button onClick={exportToCSV} size="sm" variant="outline">
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Exportar CSV
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results Table */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              Movimentações ({enrichedTransactions.length} registros)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs whitespace-nowrap">Data/Hora Agenda</TableHead>
                    <TableHead className="text-xs whitespace-nowrap">Data Mov.</TableHead>
                    <TableHead className="text-xs">Categoria</TableHead>
                    <TableHead className="text-xs">Tipo</TableHead>
                    <TableHead className="text-xs">Origem</TableHead>
                    <TableHead className="text-xs">Banco</TableHead>
                    <TableHead className="text-xs text-right">Valor</TableHead>
                    <TableHead className="text-xs">Descrição</TableHead>
                    <TableHead className="text-xs">Obs. Agenda</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {enrichedTransactions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                        Nenhuma movimentação encontrada para os filtros selecionados.
                      </TableCell>
                    </TableRow>
                  ) : (
                    enrichedTransactions.map(t => (
                      <TableRow key={t.id}>
                        <TableCell className="text-xs whitespace-nowrap">
                          {t.appointmentDate ? format(new Date(t.appointmentDate), 'dd/MM/yy HH:mm') : '-'}
                        </TableCell>
                        <TableCell className="text-xs whitespace-nowrap">
                          {format(new Date(t.date), 'dd/MM/yyyy')}
                        </TableCell>
                        <TableCell className="text-xs">{t.category}</TableCell>
                        <TableCell className="text-xs">
                          <span className={cn(
                            "px-1.5 py-0.5 rounded text-xs",
                            t.type === 'entrada' 
                              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                              : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                          )}>
                            {t.type === 'entrada' ? 'Entrada' : 'Saída'}
                          </span>
                        </TableCell>
                        <TableCell className="text-xs">
                          {t.scope === 'empresa' ? 'Empresa' : 'Pessoal'}
                        </TableCell>
                        <TableCell className="text-xs">{t.account}</TableCell>
                        <TableCell className="text-xs text-right font-medium">
                          {formatCurrency(t.amount)}
                        </TableCell>
                        <TableCell className="text-xs max-w-[150px] truncate">
                          {t.description || '-'}
                        </TableCell>
                        <TableCell className="text-xs max-w-[150px] truncate">
                          {t.appointmentNotes || '-'}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Summary by Scope */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Resumo por Origem</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Origem</TableHead>
                  <TableHead className="text-xs text-right">Saldo Inicial</TableHead>
                  <TableHead className="text-xs text-right">Entradas</TableHead>
                  <TableHead className="text-xs text-right">Saídas</TableHead>
                  <TableHead className="text-xs text-right">Saldo Final</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {scopeSummary.map(s => (
                  <TableRow key={s.scope} className={s.scope === 'total' ? 'font-bold bg-muted/50' : ''}>
                    <TableCell className="text-xs">{s.label}</TableCell>
                    <TableCell className="text-xs text-right">{formatCurrency(s.initialBalance)}</TableCell>
                    <TableCell className="text-xs text-right text-green-600">{formatCurrency(s.entries)}</TableCell>
                    <TableCell className="text-xs text-right text-red-600">{formatCurrency(s.exits)}</TableCell>
                    <TableCell className="text-xs text-right font-medium">{formatCurrency(s.finalBalance)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Summary by Account */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Resumo por Banco</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Banco</TableHead>
                  <TableHead className="text-xs text-right">Saldo Inicial</TableHead>
                  <TableHead className="text-xs text-right">Entradas</TableHead>
                  <TableHead className="text-xs text-right">Saídas</TableHead>
                  <TableHead className="text-xs text-right">Saldo Final</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {accountSummary.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-4">
                      Nenhuma movimentação no período.
                    </TableCell>
                  </TableRow>
                ) : (
                  accountSummary.map(s => (
                    <TableRow key={s.account} className={s.account === 'Total' ? 'font-bold bg-muted/50' : ''}>
                      <TableCell className="text-xs">{s.account}</TableCell>
                      <TableCell className="text-xs text-right">{formatCurrency(s.initialBalance)}</TableCell>
                      <TableCell className="text-xs text-right text-green-600">{formatCurrency(s.entries)}</TableCell>
                      <TableCell className="text-xs text-right text-red-600">{formatCurrency(s.exits)}</TableCell>
                      <TableCell className="text-xs text-right font-medium">{formatCurrency(s.finalBalance)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
