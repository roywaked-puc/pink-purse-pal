/// <reference types="node" />
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { listarLembretesConfirmacao, politicaCancelamentoSchema } from './lembretesConfirmacao';
import { montarMensagemConfirmacao, servicoConfirmacao, whatsappLink } from './whatsapp';
import type { Appointment, Service } from '../types';

const agora = new Date('2026-10-26T15:00:00Z');
const agendamento: Appointment = { id: 'a', clientId: 'c', clientName: 'Maria Silva', date: new Date('2026-10-28T16:00:00Z'), serviceId: 's', service: 'Legado', amount: 130, paidAmount: 0, duration: 60, confirmationStatus: 'pendente', paymentStatus: 'nao_pago' };
const servico: Service = { id: 's', description: 'Volume Russo', tierType: 'manutencao', amount: 130, duration: 60 };
test('inclui pendente em 2 dias dentro dos próximos 3 dias', () => assert.equal(listarLembretesConfirmacao([agendamento], 3, 48, agora).length, 1));
test('inclui confirmado e retorno previsto', () => assert.equal(listarLembretesConfirmacao(['confirmado', 'retorno_previsto'].map((confirmationStatus: Appointment['confirmationStatus']) => ({ ...agendamento, confirmationStatus })), 3, 48, agora).length, 2));
test('exclui atendido e cancelado', () => assert.deepEqual(listarLembretesConfirmacao(['atendido', 'cancelado'].map((confirmationStatus: Appointment['confirmationStatus']) => ({ ...agendamento, confirmationStatus })), 3, 48, agora), []));
test('exclui passado e depois de 3 dias; mantém limites inclusivos', () => {
  const datas = [-1, 0, 3 * 86_400_000, 3 * 86_400_000 + 1];
  assert.equal(listarLembretesConfirmacao(datas.map(d => ({ ...agendamento, date: new Date(agora.getTime() + d) })), 3, 48, agora).length, 2);
});
test('avisa estritamente abaixo de 48h', () => {
  const itens = listarLembretesConfirmacao([48, 47].map(h => ({ ...agendamento, date: new Date(agora.getTime() + h * 3_600_000) })), 3, 48, agora);
  assert.deepEqual(itens.map(i => i.prazoPassou), [true, false]);
});
test('timestamp determina enviado sem modificar status ou valores', () => {
  const original = { ...agendamento, confirmationSentAt: agora, isPermuta: true };
  assert.equal(listarLembretesConfirmacao([original], 3, 48, agora)[0].enviado, true);
  assert.equal(original.confirmationStatus, 'pendente');
  assert.equal(original.amount, 130);
});
test('saudações respeitam 12h e 18h de São Paulo', () => {
  const template = { confirm_message_template: '{saudacao}' };
  assert.equal(montarMensagemConfirmacao(agendamento, template, servico, new Date('2026-10-26T14:59:00Z')), 'Bom dia');
  assert.equal(montarMensagemConfirmacao(agendamento, template, servico, new Date('2026-10-26T15:00:00Z')), 'Boa tarde');
  assert.equal(montarMensagemConfirmacao(agendamento, template, servico, new Date('2026-10-26T20:59:00Z')), 'Boa tarde');
  assert.equal(montarMensagemConfirmacao(agendamento, template, servico, new Date('2026-10-26T21:00:00Z')), 'Boa noite');
});
test('formata primeiro nome, data/hora, horas e taxa brasileira; mantém desconhecida', () => {
  assert.equal(montarMensagemConfirmacao(agendamento, { confirm_message_template: '{nome}|{servico}|{data}|{horario}|{horas_aviso}|{taxa}|{outra}', cancellation_notice_hours: 72, cancellation_fee: 65.5 }, servico, agora), 'Maria|Manutenção|28/10/2026|13:00|72|65,50|{outra}');
});
test('serviço estruturado e fallback legado', () => {
  assert.equal(servicoConfirmacao(agendamento, { ...servico, tierType: 'colocacao' }), 'Colocação');
  assert.equal(servicoConfirmacao(agendamento, { ...servico, tierType: 'avulso' }), 'Volume Russo');
  assert.equal(servicoConfirmacao({ ...agendamento, serviceId: undefined }), 'Legado');
});
test('template nulo e vazio usam padrões 48h e 50,00', () => {
  for (const texto of [null, '']) {
    const mensagem = montarMensagemConfirmacao(agendamento, { confirm_message_template: texto }, servico, agora);
    assert.ok(mensagem.includes('48h'));
    assert.ok(mensagem.includes('R$ 50,00'));
  }
});
test('link mantém normalização DDI e codificação; sem telefone não há link', () => {
  assert.equal(whatsappLink('(11) 99999-1234', 'Olá Maria!'), 'https://wa.me/5511999991234?text=Ol%C3%A1%20Maria!');
  assert.equal(whatsappLink(undefined, 'mensagem'), null);
});
test('horas mínimo 1 e taxa mínimo 0', () => {
  assert.equal(politicaCancelamentoSchema.safeParse({ cancellation_notice_hours: 0, cancellation_fee: 50 }).success, false);
  assert.equal(politicaCancelamentoSchema.safeParse({ cancellation_notice_hours: 1, cancellation_fee: 0 }).success, true);
  assert.equal(politicaCancelamentoSchema.safeParse({ cancellation_notice_hours: 48, cancellation_fee: -1 }).success, false);
});