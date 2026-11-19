/// <reference types="node" />
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { elegivelReembolso, podeReativar, podeCancelarPro, PRAZO_DESISTENCIA_DIAS } from '../../supabase/functions/_shared/exclusao-regras';
const agora = Date.parse('2026-11-19T00:00:00Z');
test('prazo de desistência é 30 dias', () => assert.equal(PRAZO_DESISTENCIA_DIAS,30));
test('primeiro pagamento até sete dias permite reembolso', () => assert.equal(elegivelReembolso(agora-7*86400000,agora),true));
test('após sete dias não permite reembolso', () => assert.equal(elegivelReembolso(agora-7*86400000-1,agora),false));
test('sem contratação paga não há reembolso', () => assert.equal(elegivelReembolso(null,agora),false));
test('antes do fim dos 30 dias pode reativar', () => assert.equal(podeReativar('2026-12-19T00:00:00Z',Date.parse('2026-12-18T23:59:59Z')),true));
test('no prazo vencido não pode reativar', () => assert.equal(podeReativar('2026-12-19T00:00:00Z',Date.parse('2026-12-19T00:00:00Z')),false));
for (const status of ['active','past_due','trialing']) test(`Pro ${status} permite cancelamento`,() => assert.equal(podeCancelarPro('pro',status),true));
test('isenta não oferece cancelamento',() => assert.equal(podeCancelarPro('isento','active'),false));