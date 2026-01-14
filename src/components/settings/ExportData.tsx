import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useApp } from '@/contexts/AppContext';
import { useToast } from '@/hooks/use-toast';
import { Download, Users, Scissors, Calendar, Wallet, Tag, Building2 } from 'lucide-react';
import { format } from 'date-fns';

const convertToCSV = (data: any[], headers: string[], keys: string[]): string => {
  const csvRows = [];
  
  csvRows.push(headers.join(';'));
  
  for (const row of data) {
    const values = keys.map(key => {
      let value = row[key];
      
      if (value instanceof Date || (typeof value === 'string' && key === 'date')) {
        try {
          value = format(new Date(value), 'dd/MM/yyyy HH:mm');
        } catch {
          value = value?.toString() || '';
        }
      }
      
      if (typeof value === 'number') {
        value = value.toFixed(2).replace('.', ',');
      }
      
      if (typeof value === 'string') {
        value = `"${value.replace(/"/g, '""')}"`;
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

export const ExportData = () => {
  const { clients, services, appointments, transactions, categories, accounts } = useApp();
  const { toast } = useToast();

  const exportClients = () => {
    if (clients.length === 0) {
      toast({ title: 'Sem dados', description: 'Não há clientes para exportar.', variant: 'destructive' });
      return;
    }
    const csv = convertToCSV(clients, ['Nome', 'Telefone', 'Observações'], ['name', 'phone', 'notes']);
    downloadCSV(csv, `clientes_${getDateSuffix()}.csv`);
    toast({ title: 'Exportação concluída', description: `${clients.length} clientes exportados.` });
  };

  const exportServices = () => {
    if (services.length === 0) {
      toast({ title: 'Sem dados', description: 'Não há serviços para exportar.', variant: 'destructive' });
      return;
    }
    const csv = convertToCSV(
      services, 
      ['Descrição', 'Valor', 'Duração (min)', 'Cor', 'Observações'], 
      ['description', 'amount', 'duration', 'color', 'notes']
    );
    downloadCSV(csv, `servicos_${getDateSuffix()}.csv`);
    toast({ title: 'Exportação concluída', description: `${services.length} serviços exportados.` });
  };

  const exportAppointments = () => {
    if (appointments.length === 0) {
      toast({ title: 'Sem dados', description: 'Não há agendamentos para exportar.', variant: 'destructive' });
      return;
    }
    const csv = convertToCSV(
      appointments,
      ['Data', 'Cliente', 'Serviço', 'Valor', 'Valor Pago', 'Status Pagamento', 'Status Confirmação', 'Duração (min)', 'Observações'],
      ['date', 'clientName', 'service', 'amount', 'paidAmount', 'paymentStatus', 'confirmationStatus', 'duration', 'notes']
    );
    downloadCSV(csv, `agendamentos_${getDateSuffix()}.csv`);
    toast({ title: 'Exportação concluída', description: `${appointments.length} agendamentos exportados.` });
  };

  const exportTransactions = () => {
    if (transactions.length === 0) {
      toast({ title: 'Sem dados', description: 'Não há movimentações para exportar.', variant: 'destructive' });
      return;
    }
    const csv = convertToCSV(
      transactions,
      ['Data', 'Tipo', 'Origem', 'Categoria', 'Conta', 'Valor', 'Descrição', 'ID Agendamento', 'Tipo Recebimento'],
      ['date', 'type', 'scope', 'category', 'account', 'amount', 'description', 'appointmentId', 'paymentType']
    );
    downloadCSV(csv, `movimentacoes_${getDateSuffix()}.csv`);
    toast({ title: 'Exportação concluída', description: `${transactions.length} movimentações exportadas.` });
  };

  const exportCategories = () => {
    if (categories.length === 0) {
      toast({ title: 'Sem dados', description: 'Não há categorias para exportar.', variant: 'destructive' });
      return;
    }
    const csv = convertToCSV(categories, ['Nome', 'Tipo', 'Origem'], ['name', 'type', 'scope']);
    downloadCSV(csv, `categorias_${getDateSuffix()}.csv`);
    toast({ title: 'Exportação concluída', description: `${categories.length} categorias exportadas.` });
  };

  const exportAccounts = () => {
    if (accounts.length === 0) {
      toast({ title: 'Sem dados', description: 'Não há contas para exportar.', variant: 'destructive' });
      return;
    }
    const csv = convertToCSV(accounts, ['Nome', 'Tipo'], ['name', 'type']);
    downloadCSV(csv, `contas_${getDateSuffix()}.csv`);
    toast({ title: 'Exportação concluída', description: `${accounts.length} contas exportadas.` });
  };

  const exportItems = [
    { label: 'Clientes', icon: Users, count: clients.length, onExport: exportClients },
    { label: 'Serviços', icon: Scissors, count: services.length, onExport: exportServices },
    { label: 'Agendamentos', icon: Calendar, count: appointments.length, onExport: exportAppointments },
    { label: 'Movimentações', icon: Wallet, count: transactions.length, onExport: exportTransactions },
    { label: 'Categorias', icon: Tag, count: categories.length, onExport: exportCategories },
    { label: 'Contas', icon: Building2, count: accounts.length, onExport: exportAccounts },
  ];

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Exporte seus dados em formato CSV para backup ou migração.
      </p>

      <div className="grid grid-cols-2 gap-3">
        {exportItems.map((item) => (
          <Card key={item.label} className="p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <item.icon className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.count} registros</p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={item.onExport}>
                <Download className="h-3 w-3 mr-1" />
                CSV
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
