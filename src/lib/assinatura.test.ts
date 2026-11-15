/// <reference types="node" />
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PRECOS_PRO, podeCriarAgendamento, diasRestantesTeste, avisoAssinatura, AssinaturaNecessariaError } from './assinatura';
import type { ResumoAssinatura } from '@/types';
const a: ResumoAssinatura = { estado: 'teste', teste_ate: '2026-12-25T20:00:00Z', periodo_atual_fim: null, periodicidade: null, cancelar_no_fim_do_periodo: false, status: 'sem_assinatura', tem_customer: false };
test('mensal R$39,90', () => assert.equal(PRECOS_PRO.mensal, 3990));
test('anual R$359,00', () => assert.equal(PRECOS_PRO.anual, 35900));
test('teste tem 40 dias exatos desde cadastro', () => assert.equal(diasRestantesTeste(a.teste_ate, new Date('2026-11-15T20:00:00Z')), 40));
for (const estado of ['isento', 'teste', 'pro'] as const) test(`${estado} permite criação`, () => assert.equal(podeCriarAgendamento(estado), true));
test('expirado bloqueia criação', () => assert.equal(podeCriarAgendamento('expirado'), false));
for (const dias of [10, 3]) test(`avisa com ${dias} dias`, () => assert.match(avisoAssinatura(a, new Date(new Date(a.teste_ate).getTime() - dias * 86400000)) ?? '', new RegExp(`${dias} dias`)));
test('não avisa antes de 10 dias', () => assert.equal(avisoAssinatura(a, new Date('2026-12-14T20:00:00Z')), null));
test('expiração mostra aviso fixo', () => assert.equal(avisoAssinatura({ ...a, estado: 'expirado' }), 'Assine para criar novos agendamentos'));
test('isento não recebe aviso', () => assert.equal(avisoAssinatura({ ...a, estado: 'isento' }), null));
test('erro identificável P0010', () => assert.equal(new AssinaturaNecessariaError().code, 'P0010'));