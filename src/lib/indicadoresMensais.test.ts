/// <reference types="node" />
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calcularIndicadoresMensais, temAtendimentosNoAno } from './indicadoresMensais';

const ap = (o: Record<string, unknown>) => ({
  date: new Date('2026-10-10T15:00:00Z'), amount: 100, paidAmount: 0,
  confirmationStatus: 'atendido', isPermuta: false, clientId: 'c1', clientName: 'Ana', ...o,
}) as any;

test('faturamento soma só atendidos não permuta', () => {
  const r = calcularIndicadoresMensais([
    ap({}), ap({ amount: 50, isPermuta: true }), ap({ confirmationStatus: 'cancelado' }),
    ap({ confirmationStatus: 'confirmado' }), ap({ confirmationStatus: 'pendente' }),
  ], 2026);
  assert.equal(r[9].faturamento, 100);
  assert.equal(r[9].permuta, 50);
  assert.equal(r[9].atendimentosPagos, 1);
  assert.equal(r[9].atendimentosPermuta, 1);
});

test('a receber nunca negativo quando pago maior que valor', () => {
  const r = calcularIndicadoresMensais([ap({ amount: 100, paidAmount: 130 }), ap({ amount: 200, paidAmount: 50 })], 2026);
  assert.equal(r[9].aReceber, 150);
});

test('agrupa pelo mês no fuso de São Paulo', () => {
  // 01/11 01:00 UTC = 31/10 22:00 em São Paulo
  const r = calcularIndicadoresMensais([ap({ date: new Date('2026-11-01T01:00:00Z') })], 2026);
  assert.equal(r[9].faturamento, 100);
  assert.equal(r[10].faturamento, 0);
});

test('clientes únicas por id com fallback de nome normalizado', () => {
  const r = calcularIndicadoresMensais([
    ap({}), ap({}), ap({ clientId: undefined, clientName: 'Bia ' }), ap({ clientId: undefined, clientName: 'bía' }),
  ], 2026);
  assert.equal(r[9].clientesUnicas, 2);
});

test('detecta ano sem atendimentos', () => {
  assert.equal(temAtendimentosNoAno([ap({})], 2025), false);
  assert.equal(temAtendimentosNoAno([ap({})], 2026), true);
});
