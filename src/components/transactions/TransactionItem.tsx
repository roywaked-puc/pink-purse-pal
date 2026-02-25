import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ArrowUpCircle, ArrowDownCircle, Pencil, Trash2, CalendarCheck } from 'lucide-react';
import { Transaction } from '@/types';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useApp } from '@/contexts/AppContext';

interface TransactionItemProps {
  transaction: Transaction;
  onEdit: (transaction: Transaction) => void;
  onDelete: (transaction: Transaction) => void;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

const typeConfig = {
  entrada: { icon: ArrowUpCircle, label: 'Entrada', color: 'text-success' },
  saida: { icon: ArrowDownCircle, label: 'Saída', color: 'text-destructive' },
};

export function TransactionItem({ transaction, onEdit, onDelete }: TransactionItemProps) {
  const { accounts } = useApp();
  const config = typeConfig[transaction.type];
  const Icon = config.icon;
  const account = accounts.find(a => a.id === transaction.account);
  const isLinkedToAppointment = !!transaction.appointmentId;

  return (
    <div className="p-4 rounded-xl bg-card border border-border shadow-soft animate-fade-in">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-3">
          <div className={cn("p-2 rounded-lg bg-muted", config.color)}>
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <p className="font-medium">{config.label}</p>
            <p className="text-xs text-muted-foreground">
              {format(new Date(transaction.date), "dd/MM/yyyy", { locale: ptBR })}
            </p>
          </div>
        </div>
        <span className={cn(
          "text-xs font-medium px-2.5 py-1 rounded-full",
          transaction.scope === 'empresa' ? "bg-primary/15 text-primary" : "bg-accent text-accent-foreground"
        )}>
          {transaction.scope === 'empresa' ? 'Empresa' : 'Pessoal'}
        </span>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            {transaction.category} • {account?.name || 'Conta'}
          </p>
          {transaction.description && (
            <p className="text-xs text-muted-foreground mt-0.5">{transaction.description}</p>
          )}
          {transaction.clientName && !isLinkedToAppointment && (
            <p className="text-xs text-muted-foreground mt-0.5">Cliente: {transaction.clientName}</p>
          )}
          {isLinkedToAppointment && (
            <div className="flex items-center gap-1 text-xs text-primary mt-1">
              <CalendarCheck className="w-3 h-3" />
              <span>Vinculado a agendamento (só pode excluir)</span>
            </div>
          )}
          <p className={cn("font-semibold mt-1", config.color)}>
            {transaction.type === 'saida' ? '-' : ''}{formatCurrency(transaction.amount)}
          </p>
        </div>
        <div className="flex gap-1">
          {!isLinkedToAppointment && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEdit(transaction)}
              className="h-8 w-8"
            >
              <Pencil className="w-4 h-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(transaction)}
            className="h-8 w-8 text-destructive hover:text-destructive"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
