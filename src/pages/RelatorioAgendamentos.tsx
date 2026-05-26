import { useState, useMemo } from 'react';
import { format, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon, Filter, Download, FileText, ArrowLeft } from 'lucide-react';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useAppointments } from '@/hooks/useAppointments';
import { useClients } from '@/hooks/useClients';
import { useServices } from '@/hooks/useServices';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { ConfirmationStatus, PaymentStatus } from '@/types';

interface Props { embedded?: boolean }

export default function RelatorioAgendamentos({ embedded = false }: Props = {}) {
  const navigate = useNavigate();
  const { data: appointments = [] } = useAppointments();
  const { data: clients = [] } = useClients();
  const { data: services = [] } = useServices();
  const { toast } = useToast();

  // Filter states
  const [startDate, setStartDate] = useState<Date>(startOfMonth(new Date()));
  const [endDate, setEndDate] = useState<Date>(endOfMonth(new Date()));
  const [selectedClient, setSelectedClient] = useState<string>('todos');
  const [selectedService, setSelectedService] = useState<string>('todos');
  const [selectedConfirmation, setSelectedConfirmation] = useState<string>('todos');
  const [selectedPayment, setSelectedPayment] = useState<string>('todos');

  // Filter appointments
  const filteredAppointments = useMemo(() => {
    return appointments
      .filter(a => {
        const appointmentDate = new Date(a.date);
        const inPeriod = isWithinInterval(appointmentDate, { start: startDate, end: endDate });
        const matchClient = selectedClient === 'todos' || a.clientId === selectedClient || a.clientName === selectedClient;
        const matchService = selectedService === 'todos' || a.serviceId === selectedService || a.service === selectedService;
        const matchConfirmation = selectedConfirmation === 'todos' || a.confirmationStatus === selectedConfirmation;
        const matchPayment = selectedPayment === 'todos' || a.paymentStatus === selectedPayment;
        return inPeriod && matchClient && matchService && matchConfirmation && matchPayment;
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [appointments, startDate, endDate, selectedClient, selectedService, selectedConfirmation, selectedPayment]);

  // Calculate summary
  const summary = useMemo(() => {
    const result = {
      total: filteredAppointments.length,
      valorTotal: 0,
      valorRecebido: 0,
      valorPendente: 0,
      byConfirmation: {
        pendente: 0,
        confirmado: 0,
        atendido: 0,
        cancelado: 0,
      } as Record<string, number>,
    };

    filteredAppointments.forEach(a => {
      result.valorTotal += a.amount;
      result.valorRecebido += a.paidAmount;
      result.valorPendente += (a.amount - a.paidAmount);
      result.byConfirmation[a.confirmationStatus] = (result.byConfirmation[a.confirmationStatus] || 0) + 1;
    });

    return result;
  }, [filteredAppointments]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const getConfirmationLabel = (status: ConfirmationStatus) => {
    const labels: Record<ConfirmationStatus, string> = {
      pendente: 'Pendente',
      confirmado: 'Confirmado',
      atendido: 'Atendido',
      cancelado: 'Cancelado',
    };
    return labels[status] || status;
  };

  const getPaymentLabel = (status: PaymentStatus) => {
    const labels: Record<PaymentStatus, string> = {
      pago: 'Pago',
      sinal: 'Sinal',
      nao_pago: 'Não Pago',
    };
    return labels[status] || status;
  };

  const getActiveFiltersText = () => {
    const filters: string[] = [];
    if (selectedClient !== 'todos') {
      const client = clients.find(c => c.id === selectedClient);
      filters.push(`Cliente: ${client?.name || selectedClient}`);
    }
    if (selectedService !== 'todos') {
      const service = services.find(s => s.id === selectedService);
      filters.push(`Serviço: ${service?.description || selectedService}`);
    }
    if (selectedConfirmation !== 'todos') {
      filters.push(`Status: ${getConfirmationLabel(selectedConfirmation as ConfirmationStatus)}`);
    }
    if (selectedPayment !== 'todos') {
      filters.push(`Pagamento: ${getPaymentLabel(selectedPayment as PaymentStatus)}`);
    }
    return filters.length > 0 ? filters.join(' | ') : 'Todos';
  };

  const exportToPDF = () => {
    if (filteredAppointments.length === 0) {
      toast({
        title: "Sem dados",
        description: "Nenhum agendamento para exportar no período selecionado.",
        variant: "destructive",
      });
      return;
    }

    const doc = new jsPDF('landscape');
    const pageWidth = doc.internal.pageSize.getWidth();

    // Title
    doc.setFontSize(18);
    doc.text('Relatório de Agendamentos', pageWidth / 2, 20, { align: 'center' });

    // Period and filters info
    doc.setFontSize(10);
    const periodText = `Período: ${format(startDate, 'dd/MM/yyyy')} a ${format(endDate, 'dd/MM/yyyy')}`;
    doc.text(periodText, 14, 30);
    doc.text(`Filtros: ${getActiveFiltersText()}`, 14, 36);

    // Appointments table
    const tableData = filteredAppointments.map(a => [
      format(new Date(a.date), 'dd/MM/yyyy HH:mm'),
      a.clientName,
      a.service,
      `${a.duration} min`,
      getConfirmationLabel(a.confirmationStatus),
      formatCurrency(a.amount),
      formatCurrency(a.paidAmount),
      formatCurrency(a.amount - a.paidAmount),
      getPaymentLabel(a.paymentStatus),
      a.notes || '',
    ]);

    autoTable(doc, {
      startY: 42,
      head: [['Data/Hora', 'Cliente', 'Serviço', 'Duração', 'Confirmação', 'Total', 'Recebido', 'Pendente', 'Pagamento', 'Observações']],
      body: tableData,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [59, 130, 246] },
      columnStyles: {
        0: { cellWidth: 28 },
        1: { cellWidth: 35 },
        2: { cellWidth: 35 },
        3: { cellWidth: 15 },
        4: { cellWidth: 22 },
        5: { cellWidth: 25, halign: 'right' },
        6: { cellWidth: 25, halign: 'right' },
        7: { cellWidth: 25, halign: 'right' },
        8: { cellWidth: 18 },
        9: { cellWidth: 45 },
      },
    });

    // Summary
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(12);
    doc.text('Resumo do Período', 14, finalY);

    const summaryData = [
      ['Total de Agendamentos', String(summary.total)],
      ['Valor Total Esperado', formatCurrency(summary.valorTotal)],
      ['Valor Recebido', formatCurrency(summary.valorRecebido)],
      ['Valor Pendente', formatCurrency(summary.valorPendente)],
      ['', ''],
      ['Pendentes', String(summary.byConfirmation.pendente)],
      ['Confirmados', String(summary.byConfirmation.confirmado)],
      ['Atendidos', String(summary.byConfirmation.atendido)],
      ['Cancelados', String(summary.byConfirmation.cancelado)],
    ];

    autoTable(doc, {
      startY: finalY + 4,
      body: summaryData,
      styles: { fontSize: 10 },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 60 },
        1: { halign: 'right', cellWidth: 40 },
      },
    });

    // Save
    const fileName = `agendamentos_${format(startDate, 'ddMMyyyy')}_${format(endDate, 'ddMMyyyy')}.pdf`;
    doc.save(fileName);

    toast({
      title: "PDF exportado",
      description: `Arquivo ${fileName} salvo com sucesso.`,
    });
  };

  const exportToCSV = () => {
    if (filteredAppointments.length === 0) {
      toast({
        title: "Sem dados",
        description: "Nenhum agendamento para exportar no período selecionado.",
        variant: "destructive",
      });
      return;
    }

    // Header
    const header = 'Data/Hora;Cliente;Serviço;Duração (min);Status Confirmação;Valor Total;Valor Recebido;Valor Pendente;Status Pagamento;Observações';
    
    // Data rows
    const rows = filteredAppointments.map(a => {
      return [
        format(new Date(a.date), 'dd/MM/yyyy HH:mm'),
        a.clientName,
        a.service,
        a.duration,
        getConfirmationLabel(a.confirmationStatus),
        a.amount.toFixed(2).replace('.', ','),
        a.paidAmount.toFixed(2).replace('.', ','),
        (a.amount - a.paidAmount).toFixed(2).replace('.', ','),
        getPaymentLabel(a.paymentStatus),
        (a.notes || '').replace(/;/g, ','),
      ].join(';');
    });

    // Summary rows
    const summaryRows = [
      '',
      'RESUMO DO PERÍODO',
      `Total de Agendamentos;${summary.total}`,
      `Valor Total Esperado;${summary.valorTotal.toFixed(2).replace('.', ',')}`,
      `Valor Recebido;${summary.valorRecebido.toFixed(2).replace('.', ',')}`,
      `Valor Pendente;${summary.valorPendente.toFixed(2).replace('.', ',')}`,
      '',
      `Pendentes;${summary.byConfirmation.pendente}`,
      `Confirmados;${summary.byConfirmation.confirmado}`,
      `Atendidos;${summary.byConfirmation.atendido}`,
      `Cancelados;${summary.byConfirmation.cancelado}`,
    ];

    const csvContent = [header, ...rows, ...summaryRows].join('\n');
    
    // Create and download file
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `agendamentos_${format(startDate, 'ddMMyyyy')}_${format(endDate, 'ddMMyyyy')}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    toast({
      title: "CSV exportado",
      description: `Arquivo exportado com sucesso.`,
    });
  };

  const header = (
    <PageHeader
      title="Relatório de Agendamentos"
      subtitle="Análise detalhada do período"
      action={
        <div className="flex gap-2">
          {!embedded && (
            <Button onClick={() => navigate('/relatorios')} size="sm" variant="ghost">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Voltar
            </Button>
          )}
          <Button onClick={exportToCSV} size="sm" variant="outline">
            <FileText className="h-4 w-4 mr-1" />
            CSV
          </Button>
          <Button onClick={exportToPDF} size="sm" variant="outline">
            <Download className="h-4 w-4 mr-1" />
            PDF
          </Button>
        </div>
      }
    />
  );

  const exportButtons = (
    <div className="flex gap-2 justify-end">
      <Button onClick={exportToCSV} size="sm" variant="outline">
        <FileText className="h-4 w-4 mr-1" /> CSV
      </Button>
      <Button onClick={exportToPDF} size="sm" variant="outline">
        <Download className="h-4 w-4 mr-1" /> PDF
      </Button>
    </div>
  );

  const Wrapper = embedded
    ? ({ children }: { children: React.ReactNode }) => <div>{embedded && exportButtons}{children}</div>
    : ({ children }: { children: React.ReactNode }) => (
        <MainLayout>{header}{children}</MainLayout>
      );

  return (
    <Wrapper>

      <div className="space-y-4">
        {/* Filters */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-3">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Filtros</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
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

              {/* Client filter */}
              <Select value={selectedClient} onValueChange={setSelectedClient}>
                <SelectTrigger>
                  <SelectValue placeholder="Cliente" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os clientes</SelectItem>
                  {clients.map(client => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Service filter */}
              <Select value={selectedService} onValueChange={setSelectedService}>
                <SelectTrigger>
                  <SelectValue placeholder="Serviço" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os serviços</SelectItem>
                  {services.map(service => (
                    <SelectItem key={service.id} value={service.id}>
                      {service.description}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Confirmation status filter */}
              <Select value={selectedConfirmation} onValueChange={setSelectedConfirmation}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os status</SelectItem>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="confirmado">Confirmado</SelectItem>
                  <SelectItem value="atendido">Atendido</SelectItem>
                  <SelectItem value="cancelado">Cancelado</SelectItem>
                </SelectContent>
              </Select>

              {/* Payment status filter */}
              <Select value={selectedPayment} onValueChange={setSelectedPayment}>
                <SelectTrigger>
                  <SelectValue placeholder="Pagamento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os pagamentos</SelectItem>
                  <SelectItem value="pago">Pago</SelectItem>
                  <SelectItem value="sinal">Sinal</SelectItem>
                  <SelectItem value="nao_pago">Não Pago</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-3">
          <Card>
            <CardContent className="pt-4">
              <p className="text-sm text-muted-foreground">Total Agendamentos</p>
              <p className="text-2xl font-bold">{summary.total}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <p className="text-sm text-muted-foreground">Valor Total</p>
              <p className="text-2xl font-bold">{formatCurrency(summary.valorTotal)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <p className="text-sm text-muted-foreground">Recebido</p>
              <p className="text-2xl font-bold text-success">{formatCurrency(summary.valorRecebido)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <p className="text-sm text-muted-foreground">Pendente</p>
              <p className="text-2xl font-bold text-warning">{formatCurrency(summary.valorPendente)}</p>
            </CardContent>
          </Card>
        </div>

        {/* Status breakdown */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Por Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">
                Pendentes: {summary.byConfirmation.pendente}
              </Badge>
              <Badge variant="secondary">
                Confirmados: {summary.byConfirmation.confirmado}
              </Badge>
              <Badge variant="default">
                Atendidos: {summary.byConfirmation.atendido}
              </Badge>
              <Badge variant="destructive">
                Cancelados: {summary.byConfirmation.cancelado}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Appointments Table */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Agendamentos ({filteredAppointments.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredAppointments.length > 0 ? (
              <ScrollArea className="h-[300px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data/Hora</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Serviço</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="text-right">Recebido</TableHead>
                      <TableHead className="text-right">Pendente</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAppointments.map((a) => (
                      <TableRow key={a.id}>
                        <TableCell className="text-sm">
                          {format(new Date(a.date), 'dd/MM HH:mm')}
                        </TableCell>
                        <TableCell className="text-sm font-medium">
                          {a.clientName}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {a.service}
                        </TableCell>
                        <TableCell className="text-right text-sm">
                          {formatCurrency(a.amount)}
                        </TableCell>
                        <TableCell className="text-right text-sm text-success">
                          {formatCurrency(a.paidAmount)}
                        </TableCell>
                        <TableCell className={cn(
                          "text-right text-sm",
                          (a.amount - a.paidAmount) > 0 ? "text-warning" : "text-muted-foreground"
                        )}>
                          {formatCurrency(a.amount - a.paidAmount)}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={
                              a.confirmationStatus === 'atendido' ? 'default' :
                              a.confirmationStatus === 'confirmado' ? 'secondary' :
                              a.confirmationStatus === 'cancelado' ? 'destructive' :
                              'outline'
                            }
                            className="text-xs"
                          >
                            {getConfirmationLabel(a.confirmationStatus)}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                Nenhum agendamento encontrado no período
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </Wrapper>
  );
}
