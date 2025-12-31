import { useState, useEffect, useMemo } from 'react';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { Transaction, TransactionType, TransactionScope, Appointment, Client } from '@/types';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { ClientAutocomplete } from '@/components/appointments/ClientAutocomplete';
import { AppointmentSelector } from './AppointmentSelector';

interface TransactionFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction?: Transaction | null;
  onDelete?: () => void;
}

export function TransactionForm({ open, onOpenChange, transaction, onDelete }: TransactionFormProps) {
  const { 
    categories, 
    accounts, 
    addTransaction, 
    updateTransaction,
    getAppointmentsWithBalance,
    updateAppointmentPayment 
  } = useApp();
  
  const [date, setDate] = useState<Date>(new Date());
  const [type, setType] = useState<TransactionType>('entrada');
  const [scope, setScope] = useState<TransactionScope>('empresa');
  const [category, setCategory] = useState('');
  const [account, setAccount] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  
  // Campos para vincular a agendamento
  const [clientName, setClientName] = useState('');
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [paymentType, setPaymentType] = useState<'sinal' | 'pagamento'>('pagamento');

  const showAppointmentFields = type === 'entrada' && scope === 'empresa';

  const clientAppointments = useMemo(() => {
    if (!selectedClientId) return [];
    return getAppointmentsWithBalance(selectedClientId);
  }, [selectedClientId, getAppointmentsWithBalance]);

  const balanceToReceive = useMemo(() => {
    if (!selectedAppointment) return 0;
    return selectedAppointment.amount - selectedAppointment.paidAmount;
  }, [selectedAppointment]);

  useEffect(() => {
    if (transaction) {
      setDate(new Date(transaction.date));
      setType(transaction.type);
      setScope(transaction.scope);
      setCategory(transaction.category);
      setAccount(transaction.account);
      setAmount(transaction.amount.toString());
      setDescription(transaction.description || '');
      setPaymentType(transaction.paymentType || 'pagamento');
    } else {
      resetForm();
    }
  }, [transaction, open]);

  // Quando selecionar agendamento, sugere o valor do saldo
  useEffect(() => {
    if (selectedAppointment && !transaction) {
      setAmount(balanceToReceive.toFixed(2));
      setDescription(`${selectedAppointment.service} - ${selectedAppointment.clientName}`);
    }
  }, [selectedAppointment, balanceToReceive, transaction]);

  const resetForm = () => {
    setDate(new Date());
    setType('entrada');
    setScope('empresa');
    setCategory('');
    setAccount('');
    setAmount('');
    setDescription('');
    setClientName('');
    setSelectedClientId(null);
    setSelectedAppointment(null);
    setPaymentType('pagamento');
  };

  const handleClientSelect = (client: Client | null) => {
    if (client) {
      setSelectedClientId(client.id);
    } else {
      setSelectedClientId(null);
      setSelectedAppointment(null);
    }
  };

  const handleAppointmentSelect = (appointment: Appointment | null) => {
    setSelectedAppointment(appointment);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const data: Omit<Transaction, 'id'> = {
      date,
      type,
      scope,
      category: category || 'Geral',
      account,
      amount: parseFloat(amount) || 0,
      description: description || undefined,
      appointmentId: selectedAppointment?.id,
      paymentType: selectedAppointment ? paymentType : undefined,
    };

    if (transaction) {
      updateTransaction(transaction.id, data);
    } else {
      addTransaction(data);
      
      // Atualiza o saldo pago do agendamento
      if (selectedAppointment) {
        updateAppointmentPayment(selectedAppointment.id, parseFloat(amount) || 0);
      }
    }

    onOpenChange(false);
    resetForm();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95%] sm:max-w-md rounded-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {transaction ? 'Editar Movimentação' : 'Nova Movimentação'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Data</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "dd/MM/yyyy") : "Selecione"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(d) => d && setDate(d)}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={type} onValueChange={(v) => {
                setType(v as TransactionType);
                // Limpa campos de agendamento se mudar de entrada
                if (v !== 'entrada') {
                  setSelectedClientId(null);
                  setSelectedAppointment(null);
                  setClientName('');
                }
              }}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="entrada">Entrada</SelectItem>
                  <SelectItem value="saida">Saída</SelectItem>
                  <SelectItem value="ajuste">Ajuste</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Origem</Label>
              <Select value={scope} onValueChange={(v) => {
                setScope(v as TransactionScope);
                // Limpa campos de agendamento se mudar para pessoal
                if (v === 'pessoal') {
                  setSelectedClientId(null);
                  setSelectedAppointment(null);
                  setClientName('');
                }
              }}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="empresa">Empresa</SelectItem>
                  <SelectItem value="pessoal">Pessoal</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Categoria</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.name}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {showAppointmentFields && !transaction && (
            <>
              <div className="space-y-2">
                <Label>Cliente (opcional)</Label>
                <ClientAutocomplete
                  value={clientName}
                  onChange={setClientName}
                  onClientSelect={handleClientSelect}
                />
              </div>

              {selectedClientId && (
                <div className="space-y-2">
                  <Label>Agendamento</Label>
                  <AppointmentSelector
                    appointments={clientAppointments}
                    selectedId={selectedAppointment?.id || null}
                    onSelect={handleAppointmentSelect}
                  />
                </div>
              )}

              {selectedAppointment && (
                <>
                  <div className="space-y-2">
                    <Label>Tipo de Recebimento</Label>
                    <Select value={paymentType} onValueChange={(v) => setPaymentType(v as 'sinal' | 'pagamento')}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sinal">Sinal</SelectItem>
                        <SelectItem value="pagamento">Pagamento</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">Valor a receber</p>
                    <p className="text-lg font-semibold text-foreground">
                      R$ {balanceToReceive.toFixed(2).replace('.', ',')}
                    </p>
                  </div>
                </>
              )}
            </>
          )}

          <div className="space-y-2">
            <Label>Conta / Banco</Label>
            <Select value={account} onValueChange={setAccount}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {accounts.map((acc) => (
                  <SelectItem key={acc.id} value={acc.id}>
                    {acc.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>{selectedAppointment ? 'Valor Recebido (R$)' : 'Valor (R$)'}</Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0,00"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Descrição (opcional)</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detalhes da movimentação..."
              rows={2}
            />
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2 pt-4">
            {transaction && onDelete && (
              <Button
                type="button"
                variant="destructive"
                onClick={onDelete}
                className="w-full sm:w-auto"
              >
                Excluir
              </Button>
            )}
            <div className="flex gap-2 w-full sm:w-auto">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button type="submit" className="flex-1">
                Salvar
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
