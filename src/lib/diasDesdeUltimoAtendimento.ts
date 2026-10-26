import { differenceInCalendarDays } from 'date-fns';

interface AgendamentoBase {
  id: string;
  clientId?: string;
  date: Date | string;
  confirmationStatus: string;
}

/**
 * Último atendimento ('atendido') da mesma cliente com data anterior à deste agendamento.
 * Ignora cancelados e o próprio agendamento.
 */
export function ultimoAtendimentoAnterior<T extends AgendamentoBase>(alvo: AgendamentoBase, todos: T[]): T | null {
  if (!alvo.clientId) return null;
  const ref = new Date(alvo.date).getTime();
  let melhor: T | null = null;
  for (const a of todos) {
    if (a.id === alvo.id || a.clientId !== alvo.clientId || a.confirmationStatus !== 'atendido') continue;
    const t = new Date(a.date).getTime();
    if (t >= ref) continue;
    if (!melhor || t > new Date(melhor.date).getTime()) melhor = a;
  }
  return melhor;
}

/** Dias de calendário entre o último atendimento anterior e a DATA DO AGENDAMENTO. null = primeira visita. */
export function diasDesdeUltimoAtendimento(alvo: AgendamentoBase, todos: AgendamentoBase[]): number | null {
  const anterior = ultimoAtendimentoAnterior(alvo, todos);
  if (!anterior) return null;
  return differenceInCalendarDays(new Date(alvo.date), new Date(anterior.date));
}

export type SituacaoIntervalo = 'primeira' | 'neutro' | 'dentro' | 'fora';

export function situacaoIntervalo(
  dias: number | null,
  servico?: { tierType?: string | null; diasMin?: number | null; diasMax?: number | null } | null,
): SituacaoIntervalo {
  if (dias == null) return 'primeira';
  if (servico?.tierType !== 'manutencao' || servico.diasMin == null || servico.diasMax == null) return 'neutro';
  return dias >= servico.diasMin && dias <= servico.diasMax ? 'dentro' : 'fora';
}
