import { useMemo } from 'react';
import { endOfMonth, startOfMonth } from 'date-fns';
import { useApp } from '@/contexts/AppContext';

export interface CaixaSummary {
  /** Entradas - saídas com scope='empresa', acumulado (sem filtro de período). */
  saldoEmpresa: number;
  /** Entradas - saídas com scope='pessoal', acumulado (sem filtro de período). */
  saldoPessoal: number;
  /** Soma das entradas (empresa + pessoal) dentro do mês informado. */
  entrouNoMes: number;
}

/**
 * Calcula os saldos dos caixas (empresa/pessoal) e o total que entrou no mês
 * a partir das transações já existentes. Reusado pela Home e por Movimentações.
 */
export function useCaixaSummary(mes: Date = new Date()): CaixaSummary {
  const { transactions } = useApp();
  const mesTime = mes.getTime();

  return useMemo(() => {
    let saldoEmpresa = 0;
    let saldoPessoal = 0;
    let entrouNoMes = 0;

    const inicio = startOfMonth(new Date(mesTime));
    const fim = endOfMonth(new Date(mesTime));

    for (const t of transactions) {
      const valor = t.type === 'entrada' ? t.amount : -t.amount;
      if (t.scope === 'empresa') saldoEmpresa += valor;
      else saldoPessoal += valor;

      if (t.type === 'entrada') {
        const d = new Date(t.date);
        if (d >= inicio && d <= fim) entrouNoMes += t.amount;
      }
    }

    return { saldoEmpresa, saldoPessoal, entrouNoMes };
  }, [transactions, mesTime]);
}
