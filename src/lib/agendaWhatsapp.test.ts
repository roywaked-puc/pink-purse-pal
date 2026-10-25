/// <reference types="node" />
import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { Appointment, Service } from '../types';
import {
  calcularDiasDesdeAnterior, linkAgendaWhatsapp, montarMensagemAgenda, selecionarAgendaFutura,
} from './agendaWhatsapp';

const agora = new Date('2026-11-01T12:00:00Z');
const base: Appointment = {
  id: 'a', date: new Date('2026-11-05T12:00:00Z'), clientName: 'Maria Silva', service: 'Legado', amount: 115,
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
test('valores desligados não expõem o valor do agendamento', () => {
  assert.equal(montar([base]).includes('115'), false);
});
test('valores ligados usam o valor do agendamento, nunca da tabela de serviços', () => {
  assert.match(montar([{ ...base, serviceId: 's', amount: 130 }], true), /R\$\s130,00/);
});
test('permuta nunca expõe valor mesmo com opção ligada', () => {
  assert.equal(montar([{ ...base, isPermuta: true, amount: 130 }], true).includes('130'), false);
});
test('não limita a agenda em dez horários', () => {
  assert.equal(montar(Array.from({ length: 12 }, (_, i) => ({ ...base, id: String(i) }))).split('✨').length - 1, 12);
});
test('manutenção mostra dias desde o atendimento anterior, sem faixa, número ou técnica', () => {
  const anterior = { ...base, id: 'ant', date: new Date('2026-10-17T12:00:00Z'), confirmationStatus: 'atendido' as const };
  const texto = montar([anterior, { ...base, serviceId: 's', maintenanceNumber: 3 }]);
  assert.match(texto, /✨ qui, 05\/11 · 09:00 · Manutenção \(19 dias\)/);
  for (const fora of ['Faixa', 'ª manutenção', 'Volume Russo', 'Legado']) assert.equal(texto.includes(fora), false);
});
test('manutenção sem nenhum anterior mostra só "Manutenção"', () => {
  assert.match(montar([{ ...base, serviceId: 's' }]), /· Manutenção$/m);
});
test('primeiro item usa o último atendido; o seguinte usa o item anterior da lista', () => {
  const atendido = { ...base, id: 'at', date: new Date('2026-10-17T12:00:00Z'), confirmationStatus: 'atendido' as const };
  const segunda = { ...base, id: 'b', serviceId: 's', date: new Date('2026-11-24T12:00:00Z') };
  const texto = montar([atendido, { ...base, serviceId: 's' }, segunda]);
  assert.match(texto, /05\/11 · 09:00 · Manutenção \(19 dias\)/);
  assert.match(texto, /24\/11 · 09:00 · Manutenção \(19 dias\)/);
});
test('cancelado é ignorado ao procurar o anterior', () => {
  const cancelado = { ...base, id: 'c', date: new Date('2026-11-03T12:00:00Z'), confirmationStatus: 'cancelado' as const };
  const atendido = { ...base, id: 'at', date: new Date('2026-10-26T12:00:00Z'), confirmationStatus: 'atendido' as const };
  assert.match(montar([cancelado, atendido, { ...base, serviceId: 's' }]), /Manutenção \(10 dias\)/);
});
test('singular usa "(1 dia)"', () => {
  const atendido = { ...base, id: 'at', date: new Date('2026-11-04T12:00:00Z'), confirmationStatus: 'atendido' as const };
  assert.match(montar([atendido, { ...base, serviceId: 's' }]), /Manutenção \(1 dia\)/);
});
test('calcularDiasDesdeAnterior compara só a data, ignorando a hora', () => {
  const atendido = { ...base, id: 'at', date: new Date('2026-10-17T23:00:00Z'), confirmationStatus: 'atendido' as const };
  assert.equal(calcularDiasDesdeAnterior(base, [base], [atendido, base]), 19);
  assert.equal(calcularDiasDesdeAnterior(base, [base], [base]), null);
});
test('colocação mostra só "Colocação", sem técnica, faixa ou número', () => {
  const texto = montar([{ ...base, serviceId: 's', maintenanceNumber: 5 }], false,
    [{ ...servico, tierType: 'colocacao' }]);
  assert.match(texto, /· Colocação$/m);
  assert.equal(texto.includes('Volume Russo'), false);
});
test('cabeçalho, atenção e agradecimento seguem o novo modelo', () => {
  const texto = montar([{ ...base, serviceId: 's' }]);
  assert.equal(texto.startsWith('Oi, Maria! Tudo bem? 😊\nSeus horários de fim de ano já estão garantidos:\n\n✨ '), true);
  assert.match(texto, /\n\n⚠️ Atenção\nSe não puder comparecer, me avise com pelo menos 48h/);
  assert.match(texto, /taxa de R\$ 50,00\./);
  assert.equal(texto.endsWith('\n\nAgradeço a confiança! 💕'), true);
  for (const fora of ['comigo', 'imprevisto', '📅']) assert.equal(texto.includes(fora), false);
});
test('partes vazias não deixam separadores sobrando', () => {
  const texto = montar([{ ...base, serviceId: 's' }]);
  for (const sobra of ['· ·', ' ·\n', '  ', '—']) assert.equal(texto.includes(sobra), false);
});
test('avulso vinculado usa o nome atual do catálogo, sem dias', () => {
  const texto = montar([{ ...base, serviceId: 's' }], false, [{ ...servico, tierType: 'avulso' }]);
  assert.match(texto, /· Volume Russo$/m);
  assert.equal(texto.includes('dias)'), false);
});
test('sem service_id preserva texto livre; sem texto não acrescenta descrição', () => {
  assert.match(montar([base]), /· Legado$/m);
  assert.equal(montar([{ ...base, service: '' }]).includes('09:00 ·'), false);
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
