import { useMemo } from 'react';
import { format } from 'date-fns';
import { Receipt, AlertTriangle } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

interface AppointmentTransactionsDialogProps {
  appointmentId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AppointmentTransactionsDialog({
  appointmentId,
  open,
  onOpenChange,
}: AppointmentTransactionsDialogProps) {
  const { transactions, getAppointmentById, updateAppointmentPayment } = useApp();

  const appointment = getAppointmentById(appointmentId);

  const linkedTransactions = useMemo(
    () =>
      transactions
        .filter((t) => t.appointmentId === appointmentId)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    [transactions, appointmentId]
  );

  const sumTransactions = useMemo(
    () => linkedTransactions.reduce((acc, t) => acc + t.amount, 0),
    [linkedTransactions]
  );

  const paidAmount = appointment?.paidAmount || 0;
  const hasDivergence = Math.abs(sumTransactions - paidAmount) > 0.001;

  const formatCurrency = (v: number) =>
    `R$ ${v.toFixed(2).replace('.', ',')}`;

  const handleRecalculate = () => {
    updateAppointmentPayment(appointmentId, sumTransactions);
    toast.success('Valor recebido recalculado', {
      description: `Atualizado para ${formatCurrency(sumTransactions)}`,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95%] sm:max-w-lg rounded-xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="w-5 h-5" />
            Movimentos do Agendamento
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          {linkedTransactions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              Nenhuma movimentação financeira vinculada a este agendamento.
            </p>
          ) : (
            <div className="space-y-2">
              {linkedTransactions.map((t) => (
                <div
                  key={t.id}
                  className="border rounded-lg p-3 space-y-1 bg-card"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      {format(new Date(t.date), 'dd/MM/yyyy')}
                    </span>
                    <span className="text-sm font-semibold text-success">
                      {formatCurrency(t.amount)}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {t.account}
                    {t.paymentType && ` • ${t.paymentType === 'sinal' ? 'Sinal' : 'Pagamento'}`}
                  </div>
                  {t.description && (
                    <div className="text-xs text-muted-foreground italic">
                      {t.description}
                    </div>
                  )}
                  {t.grossAmount && t.grossAmount !== t.amount && (
                    <div className="text-xs text-muted-foreground">
                      Bruto: {formatCurrency(t.grossAmount)} (taxa aplicada)
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="border-t pt-3 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Soma das transações:</span>
              <span className="font-semibold">{formatCurrency(sumTransactions)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Valor recebido registrado:</span>
              <span
                className={`font-semibold ${
                  hasDivergence ? 'text-destructive' : ''
                }`}
              >
                {formatCurrency(paidAmount)}
              </span>
            </div>
            {hasDivergence && (
              <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/30 rounded-lg">
                <AlertTriangle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                <div className="text-xs text-destructive">
                  Os valores estão divergentes. Clique em "Recalcular" para ajustar
                  o valor recebido com base na soma real das transações.
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1"
          >
            Fechar
          </Button>
          {hasDivergence && (
            <Button
              type="button"
              onClick={handleRecalculate}
              className="flex-1"
            >
              Recalcular
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
