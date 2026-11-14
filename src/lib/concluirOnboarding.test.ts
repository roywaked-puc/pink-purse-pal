/// <reference types="node" />
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { concluirOnboarding } from './concluirOnboarding';

const agora = new Date('2026-11-14T04:16:00.000Z');

for (const acao of ['concluir', 'pular', 'fechar']) {
  test(`${acao} grava conclusão antes de encerrar as boas-vindas`, async () => {
    const eventos: string[] = [];
    const gravado = await concluirOnboarding(async (dados) => {
      assert.equal(dados.onboarding_concluido_em, '2026-11-14T04:16:00.000Z');
      eventos.push('gravou');
      return dados;
    }, () => eventos.push('fechou'), agora);
    assert.equal(gravado, '2026-11-14T04:16:00.000Z');
    assert.deepEqual(eventos, ['gravou', 'fechou']);
  });
}

test('erro na gravação não fecha e não é ignorado', async () => {
  let fechou = false;
  await assert.rejects(concluirOnboarding(async () => {
    throw new Error('Falha ao salvar');
  }, () => { fechou = true; }, agora), /Falha ao salvar/);
  assert.equal(fechou, false);
});

test('resposta sem conclusão gravada não fecha', async () => {
  let fechou = false;
  await assert.rejects(concluirOnboarding(async () => ({ onboarding_concluido_em: null }),
    () => { fechou = true; }, agora), /conclusão não foi gravada/);
  assert.equal(fechou, false);
});