/// <reference types="node" />
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
const expect = (v: unknown) => ({ toBe: (e: unknown) => assert.equal(v, e) });
import { situacaoPagamento as s, saldoAReceberEmDinheiro as r } from './permuta';
const corte = '2026-11-16T03:00:00Z';
const base = { isPermuta: true, date: new Date('2026-11-17T12:30:00Z'), amount: 200, paidAmount: 0, paymentStatus: 'nao_pago' as 'pago' | 'sinal' | 'nao_pago' };
describe('situação de pagamento', () => {
  it('permuta antes do corte usa o status salvo', () => {
    const a = { ...base, date: new Date('2026-11-10T12:00:00Z'), paidAmount: 200, paymentStatus: 'pago' as const };
    expect(s(a, corte)).toBe('pago'); expect(r(a, corte)).toBe(0);
    const b = { ...base, date: new Date('2026-11-10T12:00:00Z') };
    expect(s(b, corte)).toBe('nao_pago'); expect(r(b, corte)).toBe(200);
  });
  it('permuta depois do corte (confirmado/atendido/cancelado) vira permuta e zera o saldo', () => {
    expect(s(base, corte)).toBe('permuta'); expect(r(base, corte)).toBe(0);
  });
  it('permuta depois do corte com R$ 50 em Pix continua permuta, saldo 0', () => {
    const a = { ...base, paidAmount: 50, paymentStatus: 'sinal' as const };
    expect(s(a, corte)).toBe('permuta'); expect(r(a, corte)).toBe(0);
  });
  it('no exato momento do corte já é permuta', () => {
    expect(s({ ...base, date: new Date(corte) }, corte)).toBe('permuta');
  });
  it('corte nulo mantém o comportamento atual', () => {
    expect(s(base, null)).toBe('nao_pago'); expect(r(base, null)).toBe(200);
  });
  it('não permuta não muda', () => {
    const n = { ...base, isPermuta: false };
    expect(s({ ...n, paidAmount: 200, paymentStatus: 'pago' }, corte)).toBe('pago');
    expect(s({ ...n, paidAmount: 80, paymentStatus: 'sinal' }, corte)).toBe('sinal');
    expect(r({ ...n, paidAmount: 80, paymentStatus: 'sinal' }, corte)).toBe(120);
    expect(s(n, corte)).toBe('nao_pago'); expect(r(n, corte)).toBe(200);
  });
});
