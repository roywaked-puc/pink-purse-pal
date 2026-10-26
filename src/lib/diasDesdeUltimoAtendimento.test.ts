import { describe, it, expect } from 'vitest';
import { diasDesdeUltimoAtendimento, situacaoIntervalo } from './diasDesdeUltimoAtendimento';

const ap = (id: string, date: string, status = 'atendido', clientId = 'c1') => ({ id, clientId, date: new Date(date), confirmationStatus: status });

describe('diasDesdeUltimoAtendimento', () => {
  const todos = [
    ap('a', '2026-10-01T10:00:00'),
    ap('b', '2026-10-10T10:00:00', 'cancelado'),
    ap('x', '2026-10-12T10:00:00', 'atendido', 'c2'),
    ap('alvo', '2026-10-19T09:00:00', 'pendente'),
  ];
  it('conta dias de calendário até a data do agendamento, ignorando cancelados e outras clientes', () => {
    expect(diasDesdeUltimoAtendimento(todos[3], todos)).toBe(18);
  });
  it('sem atendimento anterior = primeira visita', () => {
    expect(diasDesdeUltimoAtendimento(todos[0], todos)).toBeNull();
    expect(situacaoIntervalo(null)).toBe('primeira');
  });
  it('faixa de manutenção dentro/fora; colocação neutra', () => {
    const m = { tierType: 'manutencao', diasMin: 16, diasMax: 20 };
    expect(situacaoIntervalo(18, m)).toBe('dentro');
    expect(situacaoIntervalo(26, m)).toBe('fora');
    expect(situacaoIntervalo(10, m)).toBe('fora');
    expect(situacaoIntervalo(42, { tierType: 'colocacao' })).toBe('neutro');
  });
});
