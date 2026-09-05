import { useMemo } from 'react';
import { endOfMonth, startOfMonth } from 'date-fns';
import { useApp } from '@/contexts/AppContext';
import { isPermutaTransaction } from '@/lib/accountBalance';
import { useUserSettings } from '@/hooks/useUserSettings';

export interface CaixaSummary {
  /** Entradas - saídas com scope='empresa', acumulado (a partir do início do controle). */
  saldoEmpresa: number;
  /** Entradas - saídas com scope='pessoal', acumulado (a partir do início do controle). */
  saldoPessoal: number;
  /** Soma das entradas (empresa + pessoal) dentro do mês informado. */
  entrouNoMes: number;
  /** Data em que a separação de caixa passou a valer (null = nunca ativada). */
  inicioEm: Date | null;
}

/**
 * Calcula os saldos dos caixas (empresa/pessoal) e o total que entrou no mês.
 *
 * Enquanto a separação de caixa estiver desligada, o comportamento é o histórico:
 * soma todas as transações por scope, sem corte de data.
 * Depois de ativada, só entram lançamentos criados a partir de `caixa_inicio_em`.
 */
export function useCaixaSummary(mes: Date = new Date()): CaixaSummary {
  const { transactions, accounts } = useApp();
  const { data: settings } = useUserSettings();
  const mesTime = mes.getTime();

  const corteTime =
    settings?.caixa_reserva_ativo && settings?.caixa_inicio_em
      ? new Date(settings.caixa_inicio_em).getTime()
      : null;

  return useMemo(() => {
    let saldoEmpresa = 0;
    let saldoPessoal = 0;
    let entrouNoMes = 0;

    const inicio = startOfMonth(new Date(mesTime));
    const fim = endOfMonth(new Date(mesTime));

    for (const t of transactions) {
      // Permutas não são dinheiro disponível — ficam fora do saldo geral.
      if (isPermutaTransaction(t, accounts)) continue;

      // Corte pelo início do controle de caixa (quando ativo).
      if (corteTime !== null) {
        const criadoEm = (t.createdAt ?? t.date) as Date;
        if (new Date(criadoEm).getTime() < corteTime) continue;
      }

      const valor = t.type === 'entrada' ? t.amount : -t.amount;
      if (t.scope === 'empresa') saldoEmpresa += valor;
      else saldoPessoal += valor;

      if (t.type === 'entrada') {
        const d = new Date(t.date);
        if (d >= inicio && d <= fim) entrouNoMes += t.amount;
      }
    }

    return {
      saldoEmpresa,
      saldoPessoal,
      entrouNoMes,
      inicioEm: corteTime !== null ? new Date(corteTime) : null,
    };
  }, [transactions, accounts, mesTime, corteTime]);
}
