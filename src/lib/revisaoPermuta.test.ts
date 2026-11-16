/// <reference types="node" />
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ETAPAS_FORMULARIOS_PERMUTA_PRONTAS, podeAtivarPermuta, textoSaldoPermuta } from './revisaoPermuta';
test('ativação fica bloqueada enquanto etapas 3 e 4 não estão prontas', () => assert.equal(podeAtivarPermuta(ETAPAS_FORMULARIOS_PERMUTA_PRONTAS, false, [{ saldo: 130, client_id: 'cliente' }]), false));
test('saldo não zero exige cliente', () => assert.equal(podeAtivarPermuta(true, false, [{ saldo: 130, client_id: null }]), false));
test('saldo zero não exige cliente', () => assert.equal(podeAtivarPermuta(true, false, [{ saldo: 0, client_id: null }]), true));
test('conta já ativada recusa nova ativação', () => assert.equal(podeAtivarPermuta(true, true, []), false));
test('saldo positivo é dívida da cliente', () => assert.equal(textoSaldoPermuta('Ferzinha', 130), 'Ferzinha te deve R$ 130,00'));
test('saldo negativo é dívida da profissional', () => assert.equal(textoSaldoPermuta('Tatiane', -145), 'Você deve R$ 145,00 para Tatiane'));