/// <reference types="node" />
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { diasDesdeUltimoAtendimento, situacaoIntervalo } from './diasDesdeUltimoAtendimento';

const ap = (id: string, date: string, status = 'atendido', clientId = 'c1') => ({ id, clientId, date: new Date(date), confirmationStatus: status });
const todos = [
  ap('a', '2026-10-01T10:00:00'),
  ap('b', '2026-10-10T10:00:00', 'cancelado'),
  ap('x', '2026-10-12T10:00:00', 'atendido', 'c2'),
  ap('alvo', '2026-10-19T09:00:00', 'pendente'),
];

test('conta dias até a data do agendamento, ignorando cancelados e outras clientes', () => {
  assert.equal(diasDesdeUltimoAtendimento(todos[3], todos), 18);
});
test('sem atendimento anterior = primeira visita', () => {
  assert.equal(diasDesdeUltimoAtendimento(todos[0], todos), null);
  assert.equal(situacaoIntervalo(null), 'primeira');
});
test('manutenção dentro/fora da faixa; colocação neutra', () => {
  const m = { tierType: 'manutencao', diasMin: 16, diasMax: 20 };
  assert.equal(situacaoIntervalo(18, m), 'dentro');
  assert.equal(situacaoIntervalo(26, m), 'fora');
  assert.equal(situacaoIntervalo(10, m), 'fora');
  assert.equal(situacaoIntervalo(42, { tierType: 'colocacao' }), 'neutro');
});

test('Carol: conta da agenda anterior pendente (21 dias, dentro da faixa)', () => {
  const lista = [
    ap('at', '2026-11-09T13:00:00-03:00'),
    ap('col', '2026-11-30T13:00:00-03:00', 'pendente'),
    ap('man', '2026-12-21T13:00:00-03:00', 'pendente'),
  ];
  assert.equal(diasDesdeUltimoAtendimento(lista[2], lista), 21);
  assert.equal(situacaoIntervalo(21, { tierType: 'manutencao', diasMin: 21, diasMax: 25 }), 'dentro');
  lista[1].confirmationStatus = 'cancelado';
  assert.equal(diasDesdeUltimoAtendimento(lista[2], lista), 42);
  lista[1].confirmationStatus = 'pendente'; lista[1].date = new Date('2026-12-02T13:00:00-03:00');
  assert.equal(diasDesdeUltimoAtendimento(lista[2], lista), 19);
});
