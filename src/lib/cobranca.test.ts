/// <reference types="node" />
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  ASSINATURA_COBRANCA,
  PIX_COBRANCA,
  atendimentosEmAberto,
  montarMensagemCobranca,
  totalEmAberto,
} from '@/lib/cobranca';
import type { Appointment, Service } from '@/types';

const base: Appointment = {
  id: 'a1',
  date: new Date('2026-10-12T12:00:00-03:00'), // segunda, 12/10
  clientId: 'c1',
  clientName: 'Aldeneia Souza',
  service: 'Volume Brasileiro',
  amount: 150,
  paidAmount: 0,
  paymentStatus: 'nao_pago',
  confirmationStatus: 'atendido',
  duration: 60,
};

const servicoManutencao: Service = {
  id: 's1',
  description: 'Volume Brasileiro - Manutenção 16 a 20 dias',
  amount: 130,
  duration: 60,
  techniqueName: 'Volume Brasileiro',
  tierType: 'manutencao',
  diasMin: 16,
  diasMax: 20,
};

test('atendimentosEmAberto: inclui apenas atendidos com valor em aberto, em ordem cronológica', () => {
  const itens = atendimentosEmAberto(
    [
      { ...base, id: 'novo', date: new Date('2026-10-20T12:00:00-03:00') },
      { ...base, id: 'antigo', date: new Date('2026-09-01T12:00:00-03:00') },
      { ...base, id: 'quitado', paidAmount: 150 },
      { ...base, id: 'pendente-futuro', confirmationStatus: 'confirmado' },
      { ...base, id: 'cancelado', confirmationStatus: 'cancelado' },
      { ...base, id: 'permuta', isPermuta: true },
      { ...base, id: 'outra-cliente', clientId: 'c2' },
    ],
    'c1',
  );
  assert.deepEqual(
    itens.map((i) => i.appointment.id),
    ['antigo', 'novo'],
  );
});

test('atendimentosEmAberto: calcula valor em aberto com piso 0 e ignora pagamento a maior', () => {
  const itens = atendimentosEmAberto(
    [
      { ...base, amount: 100, paidAmount: 60 },
      { ...base, id: 'a2', amount: 100, paidAmount: 120 },
    ],
    'c1',
  );
  assert.equal(itens.length, 1);
  assert.equal(itens[0].emAberto, 40);
});

test('atendimentosEmAberto: monta descrição do serviço estruturado e usa fallback legado', () => {
  const comServico = atendimentosEmAberto(
    [{ ...base, serviceId: 's1', maintenanceNumber: 2 }],
    'c1',
    (id) => (id === 's1' ? servicoManutencao : undefined),
  );
  assert.equal(
    comServico[0].descricao,
    'Volume Brasileiro · Manutenção · Faixa 16–20 dias · 2ª manutenção',
  );

  const semServico = atendimentosEmAberto([{ ...base, service: 'Alongamento de unhas' }], 'c1');
  assert.equal(semServico[0].descricao, 'Alongamento de unhas');
});

const itensMensagem = atendimentosEmAberto(
  [
    { ...base, id: 'a1', amount: 150, paidAmount: 0 },
    { ...base, id: 'a2', date: new Date('2026-10-24T12:00:00-03:00'), amount: 200, paidAmount: 50 },
  ],
  'c1',
);
const mensagem = montarMensagemCobranca('Aldeneia Souza', itensMensagem);

test('montarMensagemCobranca: usa o primeiro nome na saudação', () => {
  assert.ok(mensagem.startsWith('Oi, Aldeneia! Tudo bem?'));
});

test('montarMensagemCobranca: mostra a linha Valor/Pago só quando houve pagamento parcial', () => {
  assert.ok(!mensagem.includes('Valor: R$ 150,00'));
  assert.ok(mensagem.includes('Valor: R$ 200,00 | Pago: R$ 50,00'));
  assert.ok(mensagem.includes('Em aberto: *R$ 150,00*'));
});

test('montarMensagemCobranca: soma o total dos itens e fecha com Pix e assinatura', () => {
  assert.equal(totalEmAberto(itensMensagem), 300);
  assert.ok(mensagem.includes('💰 *Total em aberto: R$ 300,00*'));
  assert.ok(mensagem.includes(`Pode acertar pelo Pix: ${PIX_COBRANCA}`));
  assert.ok(mensagem.trimEnd().endsWith(ASSINATURA_COBRANCA));
});

test('montarMensagemCobranca: formata a data abreviada em pt-BR sem ponto no dia da semana', () => {
  assert.ok(mensagem.includes('📅 *seg, 12/10*'));
  assert.ok(mensagem.includes('📅 *sáb, 24/10*'));
});
