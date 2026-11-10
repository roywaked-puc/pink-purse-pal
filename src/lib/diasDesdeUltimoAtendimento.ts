interface AgendamentoBase {
  id: string;
  clientId?: string;
  date: Date | string;
  confirmationStatus: string;
}

const fmtSp = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit' });

/** Dias de calendário (America/Sao_Paulo, ignorando hora) entre duas datas: b − a. */
export function diasCalendarioSp(a: Date | string, b: Date | string): number {
  const dia = (d: Date | string) => Date.parse(`${fmtSp.format(new Date(d))}T00:00:00Z`);
  return Math.round((dia(b) - dia(a)) / 86400000);
}

function anteriorPor<T extends AgendamentoBase>(alvo: AgendamentoBase, todos: T[], aceita: (a: T) => boolean): T | null {
  if (!alvo.clientId) return null;
  const ref = new Date(alvo.date).getTime();
  let melhor: T | null = null;
  for (const a of todos) {
    if (a.id === alvo.id || a.clientId !== alvo.clientId || !aceita(a)) continue;
    const t = new Date(a.date).getTime();
    if (t >= ref) continue;
    if (!melhor || t > new Date(melhor.date).getTime()) melhor = a;
  }
  return melhor;
}

/**
 * Agendamento imediatamente ANTERIOR da mesma cliente (qualquer status, exceto cancelado).
 * Ignora o próprio agendamento. Permite montar agendas futuras encadeadas.
 */
export function agendamentoAnterior<T extends AgendamentoBase>(alvo: AgendamentoBase, todos: T[], filtro?: (a: T) => boolean): T | null {
  return anteriorPor(alvo, todos, (a) => a.confirmationStatus !== 'cancelado' && (!filtro || filtro(a)));
}

/** Último atendimento ('atendido') anterior — usado no histórico de atendimentos concluídos. */
export function ultimoAtendimentoAnterior<T extends AgendamentoBase>(alvo: AgendamentoBase, todos: T[]): T | null {
  return anteriorPor(alvo, todos, (a) => a.confirmationStatus === 'atendido');
}

export interface IntervaloAnterior { dias: number; anteriorAtendido: boolean }

/** Dias de calendário entre o agendamento anterior e a DATA DO AGENDAMENTO. null = sem anterior. */
export function intervaloDesdeAnterior<T extends AgendamentoBase>(alvo: AgendamentoBase, todos: T[], filtro?: (a: T) => boolean): IntervaloAnterior | null {
  const ant = agendamentoAnterior(alvo, todos, filtro);
  if (!ant) return null;
  return { dias: diasCalendarioSp(ant.date, alvo.date), anteriorAtendido: ant.confirmationStatus === 'atendido' };
}

export function diasDesdeUltimoAtendimento(alvo: AgendamentoBase, todos: AgendamentoBase[]): number | null {
  return intervaloDesdeAnterior(alvo, todos)?.dias ?? null;
}

/** Intervalo entre atendimentos concluídos (histórico da ficha). */
export function diasDesdeAtendimentoConcluido(alvo: AgendamentoBase, todos: AgendamentoBase[]): number | null {
  const ant = ultimoAtendimentoAnterior(alvo, todos);
  return ant ? diasCalendarioSp(ant.date, alvo.date) : null;
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
