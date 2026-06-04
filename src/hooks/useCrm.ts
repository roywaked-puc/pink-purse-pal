import { useMemo } from 'react';
import { differenceInCalendarDays, addDays, isAfter, isBefore, isSameMonth, parseISO, startOfMonth, endOfMonth } from 'date-fns';
import { useApp } from '@/contexts/AppContext';
import { useUserSettings } from '@/hooks/useUserSettings';
import { Appointment, Client } from '@/types';

export interface ClientCrmStats {
  client: Client;
  firstAppointment?: Appointment;
  lastAttended?: Appointment;
  nextScheduled?: Appointment;
  totalSpent: number;
  totalPaid: number;
  pendingBalance: number;
  attendedCount: number;
  ticketMedio: number;
  lastPaymentDate?: Date;
  lastPaymentAmount?: number;
  daysSinceLastAttended?: number;
  isInactive: boolean;
  isActive: boolean;
}

export function useCrm() {
  const { clients, appointments, transactions } = useApp();
  const { data: settings } = useUserSettings();

  const inactiveDays = settings?.crm_inactive_days ?? 45;
  const confirmDays = settings?.crm_confirm_days ?? 3;
  const vipCount = settings?.crm_vip_count ?? 10;

  const stats = useMemo<ClientCrmStats[]>(() => {
    const today = new Date();
    return clients.map((client) => {
      const cAppts = appointments
        .filter((a) => a.clientId === client.id)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      const attended = cAppts.filter((a) => a.confirmationStatus === 'atendido');
      const lastAttended = attended[0];
      const firstAppointment = cAppts[cAppts.length - 1];
      const nextScheduled = [...cAppts]
        .reverse()
        .find(
          (a) =>
            isAfter(new Date(a.date), today) &&
            a.confirmationStatus !== 'cancelado' &&
            a.confirmationStatus !== 'atendido',
        );

      const totalSpent = cAppts
        .filter((a) => a.confirmationStatus !== 'cancelado')
        .reduce((s, a) => s + a.amount, 0);
      const totalPaid = cAppts
        .filter((a) => a.confirmationStatus !== 'cancelado')
        .reduce((s, a) => s + a.paidAmount, 0);
      const pendingBalance = Math.max(0, totalSpent - totalPaid);

      const apptIds = new Set(cAppts.map((a) => a.id));
      const cTransactions = transactions
        .filter((t) => t.appointmentId && apptIds.has(t.appointmentId) && t.type === 'entrada')
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      const lastTx = cTransactions[0];

      const daysSinceLastAttended = lastAttended
        ? differenceInCalendarDays(today, new Date(lastAttended.date))
        : undefined;

      const isInactive =
        !!lastAttended &&
        daysSinceLastAttended !== undefined &&
        daysSinceLastAttended > inactiveDays;
      const isActive = !!lastAttended && !isInactive;

      return {
        client,
        firstAppointment,
        lastAttended,
        nextScheduled,
        totalSpent,
        totalPaid,
        pendingBalance,
        attendedCount: attended.length,
        ticketMedio: attended.length > 0 ? totalPaid / attended.length : 0,
        lastPaymentDate: lastTx ? new Date(lastTx.date) : undefined,
        lastPaymentAmount: lastTx?.amount,
        daysSinceLastAttended,
        isInactive,
        isActive,
      };
    });
  }, [clients, appointments, transactions, inactiveDays]);

  // CARD 1: Confirmações pendentes
  const pendingConfirmations = useMemo(() => {
    const today = new Date();
    const limit = addDays(today, confirmDays);
    return appointments
      .filter(
        (a) =>
          a.confirmationStatus === 'pendente' &&
          isAfter(new Date(a.date), today) &&
          isBefore(new Date(a.date), limit),
      )
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [appointments, confirmDays]);

  // CARD 2: Retornos pendentes (atendidas sem próximo agendamento)
  const pendingReturns = useMemo(() => {
    return stats
      .filter((s) => s.lastAttended && !s.nextScheduled && !s.isInactive)
      .sort(
        (a, b) =>
          new Date(b.lastAttended!.date).getTime() - new Date(a.lastAttended!.date).getTime(),
      );
  }, [stats]);

  // CARD 3: Inativas
  const inactiveClients = useMemo(() => {
    return stats
      .filter((s) => s.isInactive)
      .sort((a, b) => (b.daysSinceLastAttended ?? 0) - (a.daysSinceLastAttended ?? 0));
  }, [stats]);

  // CARD 4: Saldo pendente
  const pendingPayments = useMemo(() => {
    return stats
      .filter((s) => s.pendingBalance > 0.01)
      .sort((a, b) => b.pendingBalance - a.pendingBalance);
  }, [stats]);

  // CARD 5: VIP — score = totalPaid * 0.6 normalized + attendedCount * 0.4 normalized
  const vipClients = useMemo(() => {
    const maxPaid = Math.max(1, ...stats.map((s) => s.totalPaid));
    const maxCount = Math.max(1, ...stats.map((s) => s.attendedCount));
    return [...stats]
      .filter((s) => s.attendedCount > 0)
      .map((s) => ({
        ...s,
        score: (s.totalPaid / maxPaid) * 0.6 + (s.attendedCount / maxCount) * 0.4,
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, vipCount);
  }, [stats, vipCount]);

  // CARD 6: Aniversariantes do mês
  const birthdaysThisMonth = useMemo(() => {
    const today = new Date();
    return stats
      .filter((s) => {
        if (!s.client.birthDate) return false;
        try {
          const d = parseISO(s.client.birthDate);
          return isSameMonth(
            new Date(today.getFullYear(), d.getMonth(), d.getDate()),
            today,
          );
        } catch {
          return false;
        }
      })
      .sort((a, b) => {
        const da = parseISO(a.client.birthDate!).getDate();
        const db = parseISO(b.client.birthDate!).getDate();
        return da - db;
      });
  }, [stats]);

  const totals = useMemo(
    () => ({
      activeCount: stats.filter((s) => s.isActive).length,
      inactiveCount: inactiveClients.length,
      pendingBalanceTotal: stats.reduce((s, c) => s + c.pendingBalance, 0),
      pendingReturnsCount: pendingReturns.length,
      pendingConfirmationsCount: pendingConfirmations.length,
      vipCount: vipClients.length,
      birthdayCount: birthdaysThisMonth.length,
    }),
    [stats, inactiveClients, pendingReturns, pendingConfirmations, vipClients, birthdaysThisMonth],
  );

  return {
    stats,
    pendingConfirmations,
    pendingReturns,
    inactiveClients,
    pendingPayments,
    vipClients,
    birthdaysThisMonth,
    totals,
    settings: { inactiveDays, confirmDays, vipCount },
  };
}

export function getClientStats(stats: ClientCrmStats[], clientId: string) {
  return stats.find((s) => s.client.id === clientId);
}
