/// <reference types="node" />
import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { Appointment, Service } from '../types';
import { linkAgendaWhatsapp, montarMensagemAgenda, selecionarAgendaFutura } from './agendaWhatsapp';

const agora = new Date('2026-11-11T12:00:00Z');
const base: Appointment = {
  id: 'a', date: agora, clientName: 'Maria Silva', service: 'Legado', amount: 115,
  paidAmount: 0, paymentStatus: 'nao_pago', confirmationStatus: 'pendente', duration: 60,
};
const servico: Service = {
  id: 's', description: 'Volume Russo', techniqueName: 'Volume Russo', tierType: 'manutencao',
  diasMin: 16, diasMax: 20, amount: 115, duration: 60,
};
const montar = (agendas: Appointment[], mostrarValores = false, servicos: Service[] = [servico]) =>
  montarMensagemAgenda({ name: 'Maria Silva' }, agendas, { mostrarValores, servicos, agora });

test('inclui exatamente os três status elegíveis a partir de agora', () => {
  const agendas = ['pendente', 'confirmado', 'retorno_previsto', 'atendido', 'cancelado'].map((status, i) =>
    ({ ...base, id: String(i), confirmationStatus: status as Appointment['confirmationStatus'] }));
  agendas.push({ ...base, id: 'passado', date: new Date(agora.getTime() - 1) });
  assert.deepEqual(selecionarAgendaFutura(agendas, agora).map((a) => a.id), ['0', '1', '2']);
});
test('ordena cronologicamente sem alterar a lista original', () => {
  const agendas = [{ ...base, id: 'depois', date: new Date('2026-11-12T12:00:00Z') }, base];
  assert.deepEqual(selecionarAgendaFutura(agendas, agora).map((a) => a.id), ['a', 'depois']);
  assert.equal(agendas[0].id, 'depois');
});
test('valores desligados não expõem montantes', () => {
  assert.equal(montar([base]).includes('R$'), false);
});
test('valores ligados usam o valor do agendamento, nunca da tabela de serviços', () => {
  assert.match(montar([{ ...base, serviceId: 's', amount: 130 }], true), /R\$\s130,00/);
});
test('permuta nunca expõe valor mesmo com opção ligada', () => {
  assert.equal(montar([{ ...base, isPermuta: true }], true).includes('R$'), false);
});
test('não limita a agenda em dez horários', () => {
  assert.equal(montar(Array.from({ length: 12 }, (_, i) => ({ ...base, id: String(i) }))).split('✨').length - 1, 12);
});
test('descrição vinculada usa faixa e número atual, sem a técnica e sem o legado', () => {
  const texto = montar([{ ...base, serviceId: 's', maintenanceNumber: 3 }]);
  assert.match(texto, /— Manutenção · Faixa 16–20 dias · 3ª manutenção/);
  assert.equal(texto.includes('Volume Russo'), false);
  assert.equal(texto.includes('Legado'), false);
});
test('colocação mostra só o tipo, sem técnica, faixa ou número', () => {
  const texto = montar([{ ...base, serviceId: 's', maintenanceNumber: 5 }], false,
    [{ ...servico, tierType: 'colocacao' }]);
  assert.match(texto, /— Colocação$/m);
  assert.equal(texto.includes('Volume Russo'), false);
  assert.equal(texto.includes('ª manutenção'), false);
});
test('cabeçalho sem emojis e sem a linha de imprevisto', () => {
  const texto = montar([{ ...base, serviceId: 's', maintenanceNumber: 1 }]);
  assert.equal(texto.startsWith('Oi, Maria! Seus próximos horários agendados:\n\n✨ '), true);
  for (const fora of ['💕', '📅', 'comigo', 'imprevisto', '😊']) assert.equal(texto.includes(fora), false);
});
test('partes vazias não deixam separadores sobrando', () => {
  const semFaixa = { ...servico, diasMin: undefined, diasMax: undefined };
  const texto = montar([{ ...base, serviceId: 's' }], false, [semFaixa]);
  assert.match(texto, /— Manutenção$/m);
  for (const sobra of ['— ·', '· ·', ' ·\n', '  ']) assert.equal(texto.includes(sobra), false);
});
test('sem número e colocação não exibem número de manutenção', () => {
  assert.equal(montar([{ ...base, serviceId: 's' }]).includes('ª manutenção'), false);
  assert.equal(montar([{ ...base, serviceId: 's', maintenanceNumber: 5 }], false,
    [{ ...servico, tierType: 'colocacao' }]).includes('ª manutenção'), false);
});
test('avulso vinculado usa nome atual do catálogo', () => {
  assert.match(montar([{ ...base, serviceId: 's' }], false, [{ ...servico, tierType: 'avulso' }]), /Volume Russo/);
});
test('sem service_id preserva texto livre; sem texto não acrescenta descrição', () => {
  assert.match(montar([base]), /— Legado/);
  assert.equal(montar([{ ...base, service: '' }]).includes('—'), false);
});
test('formata data e hora em São Paulo mesmo quando muda o dia UTC', () => {
  const texto = montarMensagemAgenda({ name: 'Maria Silva' }, [{ ...base, date: new Date('2026-11-12T01:00:00Z') }],
    { mostrarValores: false, servicos: [], agora });
  assert.match(texto, /qua, 11\/11 · 22:00/);
});
test('valida telefone nacional e internacional e codifica texto editado', () => {
  assert.equal(linkAgendaWhatsapp('', 'Oi'), null);
  assert.equal(linkAgendaWhatsapp('123', 'Oi'), null);
  assert.equal(linkAgendaWhatsapp('00000000000', 'Oi'), null);
  const esperado = 'https://wa.me/5511999991234?text=Texto%20editado%20%26%20ok';
  assert.equal(linkAgendaWhatsapp('(11) 99999-1234', 'Texto editado & ok'), esperado);
  assert.equal(linkAgendaWhatsapp('+55 (11) 99999-1234', 'Texto editado & ok'), esperado);
  assert.equal(linkAgendaWhatsapp('(55) 99999-1234', 'Oi'), 'https://wa.me/5555999991234?text=Oi');
});