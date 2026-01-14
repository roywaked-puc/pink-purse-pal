import { useState, useEffect, useMemo } from 'react';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { Transaction, TransactionType, TransactionScope, Appointment, Client } from '@/types';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
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
import { useToast } from '@/hooks/use-toast';

interface TransactionFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction?: Transaction | null;
  onDelete?: () => void;
  prefilledAppointment?: Appointment | null;
}

export function TransactionForm({ open, onOpenChange, transaction, onDelete, prefilledAppointment }: TransactionFormProps) {
  const { 
    categories, 
    accounts, 
    addTransaction, 
    updateTransaction,
    getAppointmentsWithBalance,
    updateAppointmentPayment 
  } = useApp();
  const { toast } = useToast();
  
  const [date, setDate] = useState<Date>(new Date());
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [type, setType] = useState<TransactionType | ''>('');
  const [scope, setScope] = useState<TransactionScope | ''>('');
  const [account, setAccount] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  
  // Checkbox para vincular a agendamento
  const [linkToAppointment, setLinkToAppointment] = useState(false);
  
  // Campos para vincular a agendamento
  const [clientName, setClientName] = useState('');
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [paymentType, setPaymentType] = useState<'sinal' | 'pagamento'>('pagamento');

  const selectedCategory = useMemo(() => {
    return categories.find(c => c.id === selectedCategoryId);
  }, [categories, selectedCategoryId]);

  const showLinkOption = type === 'entrada' && !transaction;

  const clientAppointments = useMemo(() => {
    if (!selectedClientId) return [];
    return getAppointmentsWithBalance(selectedClientId);
  }, [selectedClientId, getAppointmentsWithBalance]);

  const balanceToReceive = useMemo(() => {
    if (!selectedAppointment) return 0;
    return selectedAppointment.amount - selectedAppointment.paidAmount;
  }, [selectedAppointment]);

  // Quando seleciona categoria, preenche tipo e origem automaticamente
  useEffect(() => {
    if (selectedCategory) {
      setType(selectedCategory.type);
      setScope(selectedCategory.scope);
      
      // Limpa campos de agendamento se mudar para categoria que não é entrada
      if (selectedCategory.type !== 'entrada') {
        setLinkToAppointment(false);
        setSelectedClientId(null);
        setSelectedAppointment(null);
        setClientName('');
      }
    } else {
      setType('');
      setScope('');
    }
  }, [selectedCategory]);

  // Quando desmarca o checkbox, limpa os campos de agendamento
  useEffect(() => {
    if (!linkToAppointment) {
      setSelectedClientId(null);
      setSelectedAppointment(null);
      setClientName('');
    }
  }, [linkToAppointment]);

  useEffect(() => {
    if (transaction) {
      setDate(new Date(transaction.date));
      // Encontra a categoria pela combinação de nome, tipo e scope
      const cat = categories.find(
        c => c.name === transaction.category && c.type === transaction.type && c.scope === transaction.scope
      );
      setSelectedCategoryId(cat?.id || '');
      setType(transaction.type);
      setScope(transaction.scope);
      setAccount(transaction.account);
      setAmount(transaction.amount.toString());
      setDescription(transaction.description || '');
      setPaymentType(transaction.paymentType || 'pagamento');
      setLinkToAppointment(false);
    } else if (prefilledAppointment) {
      // Pre-preenche com dados do agendamento
      resetForm();
      setDate(new Date());
      // Encontra a categoria "Serviços" (entrada + empresa)
      const serviceCat = categories.find(
        c => c.name === 'Serviços' && c.type === 'entrada' && c.scope === 'empresa'
      );
      if (serviceCat) {
        setSelectedCategoryId(serviceCat.id);
        setType('entrada');
        setScope('empresa');
      }
      setLinkToAppointment(true);
      setClientName(prefilledAppointment.clientName);
      setSelectedClientId(prefilledAppointment.clientId || null);
      setSelectedAppointment(prefilledAppointment);
      const balance = prefilledAppointment.amount - prefilledAppointment.paidAmount;
      setAmount(balance.toFixed(2));
      setDescription(`${prefilledAppointment.service} - ${prefilledAppointment.clientName}`);
      setPaymentType('pagamento');
    } else {
      resetForm();
    }
  }, [transaction, prefilledAppointment, open, categories]);

  // Quando selecionar agendamento, sugere o valor do saldo
  useEffect(() => {
    if (selectedAppointment && !transaction) {
      setAmount(balanceToReceive.toFixed(2));
      setDescription(`${selectedAppointment.service} - ${selectedAppointment.clientName}`);
    }
  }, [selectedAppointment, balanceToReceive, transaction]);

  const resetForm = () => {
    setDate(new Date());
    setSelectedCategoryId('');
    setType('');
    setScope('');
    setAccount('');
    setAmount('');
    setDescription('');
    setLinkToAppointment(false);
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
    
    if (!selectedCategory || !type || !scope) {
      toast({
        title: "Erro",
        description: "Selecione uma categoria",
        variant: "destructive",
      });
      return;
    }

    // Validação: conta/banco obrigatório
    if (!account) {
      toast({
        title: "Erro",
        description: "O campo Conta/Banco é obrigatório",
        variant: "destructive",
      });
      return;
    }

    // Validação: valor obrigatório e maior que zero
    const parsedAmount = parseFloat(amount) || 0;
    if (parsedAmount <= 0) {
      toast({
        title: "Erro",
        description: "O campo Valor é obrigatório e deve ser maior que zero",
        variant: "destructive",
      });
      return;
    }

    // Validação: se vincular a agenda, cliente e agendamento são obrigatórios
    if (linkToAppointment) {
      if (!selectedClientId) {
        toast({
          title: "Erro",
          description: "Selecione um cliente para vincular à agenda",
          variant: "destructive",
        });
        return;
      }
      if (!selectedAppointment) {
        toast({
          title: "Erro",
          description: "Selecione um agendamento para vincular",
          variant: "destructive",
        });
        return;
      }
    }

    // Validação: valor não pode exceder o saldo disponível do agendamento
    if (selectedAppointment && parsedAmount > balanceToReceive) {
      toast({
        title: "Erro",
        description: `O valor não pode exceder o saldo disponível de R$ ${balanceToReceive.toFixed(2).replace('.', ',')}`,
        variant: "destructive",
      });
      return;
    }
    
    const data: Omit<Transaction, 'id'> = {
      date,
      type: type as TransactionType,
      scope: scope as TransactionScope,
      category: selectedCategory.name,
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
            <Label>Data <span className="text-destructive">*</span></Label>
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

          <div className="space-y-2">
            <Label>Categoria <span className="text-destructive">*</span></Label>
            <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>
              <SelectContent>
                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Empresa</div>
                {categories.filter(c => c.scope === 'empresa').map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name} ({cat.type === 'entrada' ? 'Entrada' : 'Saída'})
                  </SelectItem>
                ))}
                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground border-t mt-1 pt-2">Pessoal</div>
                {categories.filter(c => c.scope === 'pessoal').map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name} ({cat.type === 'entrada' ? 'Entrada' : 'Saída'})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Input 
                value={type === 'entrada' ? 'Entrada' : type === 'saida' ? 'Saída' : ''} 
                placeholder="Selecione uma categoria"
                disabled 
                className="bg-muted"
              />
            </div>

            <div className="space-y-2">
              <Label>Origem</Label>
              <Input 
                value={scope === 'empresa' ? 'Empresa' : scope === 'pessoal' ? 'Pessoal' : ''} 
                placeholder="Selecione uma categoria"
                disabled 
                className="bg-muted"
              />
            </div>
          </div>

          {/* Checkbox para vincular a agendamento (apenas para entradas e novas transações) */}
          {showLinkOption && (
            <div className="flex items-center space-x-2 p-3 bg-muted/50 rounded-lg">
              <Checkbox 
                id="linkAppointment" 
                checked={linkToAppointment} 
                onCheckedChange={(checked) => setLinkToAppointment(checked === true)}
                disabled={!!prefilledAppointment}
              />
              <Label 
                htmlFor="linkAppointment" 
                className="text-sm font-normal cursor-pointer"
              >
                Vincular a uma agenda
              </Label>
            </div>
          )}

          {/* Campos de cliente/agendamento quando vincular está ativo */}
          {linkToAppointment && (
            <>
              <div className="space-y-2">
                <Label>Cliente <span className="text-destructive">*</span></Label>
                <ClientAutocomplete
                  value={clientName}
                  onChange={setClientName}
                  onClientSelect={handleClientSelect}
                  disabled={!!prefilledAppointment}
                />
              </div>

              {selectedClientId && !prefilledAppointment && (
                <div className="space-y-2">
                  <Label>Agendamento <span className="text-destructive">*</span></Label>
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

                  <div className="p-3 bg-muted rounded-lg space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Valor total:</span>
                      <span className="text-foreground">R$ {selectedAppointment.amount.toFixed(2).replace('.', ',')}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Já recebido:</span>
                      <span className="text-foreground">R$ {selectedAppointment.paidAmount.toFixed(2).replace('.', ',')}</span>
                    </div>
                    <div className="flex justify-between font-semibold border-t border-border pt-1 mt-1">
                      <span className="text-muted-foreground">Saldo a receber:</span>
                      <span className="text-primary">R$ {balanceToReceive.toFixed(2).replace('.', ',')}</span>
                    </div>
                  </div>
                </>
              )}
            </>
          )}

          <div className="space-y-2">
            <Label>Conta / Banco <span className="text-destructive">*</span></Label>
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
            <Label>{selectedAppointment ? 'Valor Recebido (R$)' : 'Valor (R$)'} <span className="text-destructive">*</span></Label>
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
