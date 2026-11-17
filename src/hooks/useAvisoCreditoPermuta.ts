import { toast } from 'sonner';
import { useApp } from '@/contexts/AppContext';
import { useUserSettings } from './useUserSettings';
import { creditoAtendimentoPermuta } from '@/lib/permuta';
import type { Appointment } from '@/types';
export function useAvisoCreditoPermuta() {
  const { transactions, accounts } = useApp();
  const { data: settings } = useUserSettings();
  return (appointment: Appointment, receber?: (a: Appointment) => void) => {
    if (!settings?.permuta_corte_em || !appointment.isPermuta) return false;
    const credito = creditoAtendimentoPermuta({...appointment,confirmationStatus:'atendido'}, settings.permuta_corte_em, transactions, accounts);
    if (credito > 0) toast.success(`${new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(credito)} creditado na permuta de ${appointment.clientName}`, {
      action: receber ? { label: 'Recebeu algo em dinheiro?', onClick: () => receber({...appointment,confirmationStatus:'atendido'}) } : undefined,
    });
    else toast.success(`${appointment.clientName} · Atendido`);
    return true;
  };
}