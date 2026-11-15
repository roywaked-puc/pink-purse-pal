/// <reference types="node" />
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { prepararMensagensAjuda, lerRespostaAjuda, type MensagemAjuda } from './chatAjuda';
import { sanitizeChatError } from './sanitizeError';

test('envia somente as 10 últimas mensagens, preservando a ordem', () => {
  const mensagens: MensagemAjuda[] = Array.from({ length: 12 }, (_, i) => ({ papel: 'usuario', conteudo: String(i) }));
  assert.deepEqual(prepararMensagensAjuda(mensagens).map((m) => m.conteudo), ['2','3','4','5','6','7','8','9','10','11']);
});
test('limita cada conteúdo a 1.000 caracteres', () => {
  assert.equal(prepararMensagensAjuda([{ papel: 'assistente', conteudo: 'a'.repeat(1001) }])[0].conteudo.length, 1000);
});
test('SSE aceita eventos fragmentados e exige conclusão', async () => {
  const texto = 'data: {"texto":"Olá"}\n\ndata: {"fim":true}\n\n';
  const bytes = new TextEncoder().encode(texto);
  const eventos: unknown[] = [];
  await lerRespostaAjuda(new ReadableStream({ start(c) { c.enqueue(bytes.slice(0, 18)); c.enqueue(bytes.slice(18)); c.close(); } }), (e) => eventos.push(e));
  assert.deepEqual(eventos, [{ texto: 'Olá' }, { fim: true }]);
});
test('interrupção não vira sucesso silencioso', async () => {
  await assert.rejects(lerRespostaAjuda(new ReadableStream({ start(c) { c.close(); } }), () => {}), /interrompida/);
});
test('429 fornece aviso de espera seguro', () => { assert.match(sanitizeChatError(429).message, /Aguarde/); });
test('402 fornece aviso de créditos seguro', () => { assert.match(sanitizeChatError(402).message, /créditos/); });