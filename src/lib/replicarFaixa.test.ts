/// <reference types="node" />
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  detectarMudancaEstrutura as detectar, analisarInclusao, analisarAlteracao, analisarExclusao, sugerirValor, referenciaValor, arredondar5,
  type MudancaFaixa,
} from './replicarFaixa';
import { calcularFaixas, erroAteFaixa } from './serviceFaixas';

type Linha = [id: string | undefined, ate: number, amount: number, duration?: number];
const fx = (...l: Linha[]) => l.map(([id, ate, amount, duration = 60]) => ({ id, ate, amount, duration }));
const calc = (...l: Linha[]) => calcularFaixas(fx(...l));
const origemAntes = fx(['a', 15, 100], ['b', 20, 120], ['c', 25, 140]);

// ---- Detecção da mudança (conta pelo id)
test('só valor/duração: 0 mudanças', () => {
  assert.equal(detectar(origemAntes, fx(['a', 15, 110], ['b', 20, 120, 90], ['c', 25, 150])).quantidade, 0);
});
test('incluir 26–30: 1 mudança, anterior = 21–25', () => {
  const r = detectar(origemAntes, [...origemAntes, ...fx([undefined, 30, 170, 120])]);
  assert.equal(r.quantidade, 1);
  assert.ok(r.mudanca?.tipo === 'incluir');
  assert.deepEqual([r.mudanca.nova.de, r.mudanca.nova.ate, r.mudanca.anterior?.amount], [26, 30, 140]);
});
test('incluir + mudar preço de outra: 1 mudança (só a inclusão)', () => {
  const r = detectar(origemAntes, fx(['a', 15, 999], ['b', 20, 120], ['c', 25, 140], [undefined, 30, 170]));
  assert.equal(r.quantidade, 1);
  assert.equal(r.mudanca?.tipo, 'incluir');
});
test('alterar 16–20 → 16–21: 1 mudança (ajuste da seguinte não conta)', () => {
  const r = detectar(origemAntes, fx(['a', 15, 100], ['b', 21, 120], ['c', 25, 140]));
  assert.equal(r.quantidade, 1);
  assert.deepEqual(r.mudanca, { tipo: 'alterar', antes: calcularFaixas(origemAntes), de: 16, fimAntigo: 20, fimNovo: 21 });
});
test('excluir 21–25: 1 mudança', () => {
  const r = detectar(origemAntes, fx(['a', 15, 100], ['b', 20, 120]));
  assert.ok(r.mudanca?.tipo === 'excluir');
  assert.deepEqual([r.mudanca.removida.de, r.mudanca.removida.ate], [21, 25]);
});
test('2+ mudanças: sem mudança replicável', () => {
  const r = detectar(origemAntes, fx(['a', 15, 100], ['b', 21, 120], ['c', 25, 140], [undefined, 30, 170]));
  assert.equal(r.quantidade, 2);
  assert.equal(r.mudanca, null);
  assert.equal(detectar(origemAntes, fx(['a', 15, 100], ['b', 20, 120])).quantidade, 1);
  assert.equal(detectar(origemAntes, fx(['a', 15, 100])).quantidade, 2);
});

// ---- (a) Incluir
const inc = detectar(origemAntes, [...origemAntes, ...fx([undefined, 30, 170, 120])]).mudanca as Extract<MudancaFaixa, { tipo: 'incluir' }>;
test('(a) mesmas faixas: marcado, 26–30', () => {
  const a = analisarInclusao(inc, calc(['x', 15, 90], ['y', 20, 110], ['z', 25, 130]));
  assert.deepEqual([a.status, a.novaDe, a.novaAte, a.marcadoInicial], ['mesmas', 26, 30, true]);
});
test('(a) faixas diferentes: desmarcado, começa no último fim + 1', () => {
  const a = analisarInclusao(inc, calc(['x', 10, 90], ['y', 20, 110]));
  assert.deepEqual([a.status, a.novaDe, a.novaAte, a.marcadoInicial], ['diferentes', 21, 30, false]);
});
test('(a) serviço sem faixas: diferentes, de 1 a 30', () => {
  const a = analisarInclusao(inc, []);
  assert.deepEqual([a.status, a.novaDe, a.novaAte], ['diferentes', 1, 30]);
});
test('(a) já cobre quando último fim ≥ novo Até', () => {
  assert.equal(analisarInclusao(inc, calc(['x', 15, 1], ['y', 30, 1])).status, 'cobre');
  assert.equal(analisarInclusao(inc, calc(['x', 35, 1])).status, 'cobre');
});
test('(a) valor sugerido: + R$, + % (arredonda a R$ 5) e mesmo valor', () => {
  const ultima = { id: 'z', de: 21, ate: 25, amount: 130, duration: 60 };
  const ref = referenciaValor(inc)!;
  assert.deepEqual([ref.diferenca, ref.percentual], [30, 21]);
  assert.equal(sugerirValor('mais_reais', inc, ultima), 160);
  assert.equal(sugerirValor('mais_pct', inc, ultima), 160); // 130 × 170/140 = 157,86
  assert.equal(sugerirValor('mesmo', inc, ultima), 170);
  assert.equal(sugerirValor('mais_reais', inc, undefined), 170); // destino sem faixas
  assert.deepEqual([arredondar5(152.4), arredondar5(152.5)], [150, 155]);
});
test('(a) origem sem faixa anterior: mesmo valor', () => {
  const m = { ...inc, anterior: undefined };
  assert.equal(referenciaValor(m), null);
  assert.equal(sugerirValor('mais_reais', m, { de: 1, ate: 10, amount: 50, duration: 60 }), 170);
});

// ---- (b) Alterar o "Até"
const alt: Extract<MudancaFaixa, { tipo: 'alterar' }> = { tipo: 'alterar', antes: calcularFaixas(origemAntes), de: 16, fimAntigo: 20, fimNovo: 21 };
test('(b) mesma estrutura da origem: "mesmas", marcado, com a seguinte', () => {
  const a = analisarAlteracao(alt, calc(['x', 15, 1], ['y', 20, 1], ['z', 25, 1]));
  assert.deepEqual([a.status, a.faixa?.id, a.seguinte?.id, a.marcadoInicial], ['mesmas', 'y', 'z', true]);
});
test('(b) mesmo início e fim, estrutura diferente no resto: "tem", marcado', () => {
  const a = analisarAlteracao(alt, calc(['x', 15, 1], ['y', 20, 1], ['z', 30, 1]));
  assert.deepEqual([a.status, a.marcadoInicial], ['tem', true]);
});
test('(b) só o fim bate (C: 1–10 · 11–20): "diferentes", desmarcado, sem seguinte', () => {
  const a = analisarAlteracao(alt, calc(['x', 10, 1], ['y', 20, 1]));
  assert.deepEqual([a.status, a.faixa?.de, a.seguinte, a.marcadoInicial], ['diferentes', 11, undefined, false]);
});
test('(b) já está assim / não tem', () => {
  assert.equal(analisarAlteracao(alt, calc(['x', 15, 1], ['y', 21, 1])).status, 'ja_esta');
  assert.equal(analisarAlteracao(alt, calc(['x', 15, 1], ['y', 22, 1])).status, 'nao_tem');
});
test('(b) conflito só quando invade a seguinte ou fica inválido para a própria faixa', () => {
  const invade = analisarAlteracao(alt, calc(['x', 15, 1], ['y', 20, 1], ['z', 21, 1]));
  assert.equal(invade.status, 'conflito');
  assert.equal(invade.motivo, 'Não pode passar de 20 (fim da faixa seguinte é 21)');
  assert.equal(analisarAlteracao({ ...alt, fimNovo: 15 }, calc(['x', 15, 1], ['y', 20, 1])).status, 'conflito');
  // Fim = início é permitido, como no editor da origem.
  assert.equal(analisarAlteracao({ ...alt, fimNovo: 16 }, calc(['x', 15, 1], ['y', 20, 1])).status, 'tem');
});
test('editor e replicação usam a mesma validação do "Até"', () => {
  assert.equal(erroAteFaixa(16, 16, undefined, []), null);
  assert.equal(erroAteFaixa(15, 16, undefined, []), 'Até precisa ser maior ou igual a 16');
  assert.equal(erroAteFaixa(Number.NaN, 16, undefined, []), 'Até precisa ser maior ou igual a 16');
  assert.equal(erroAteFaixa(25, 16, 25, []), 'Não pode passar de 24 (fim da faixa seguinte é 25)');
  assert.equal(erroAteFaixa(20, 16, undefined, [20]), 'Já existe uma faixa terminando nesse dia');
});

// ---- (c) Excluir
const exc: Extract<MudancaFaixa, { tipo: 'excluir' }> = {
  tipo: 'excluir', antes: calcularFaixas(origemAntes), removida: { id: 'c', de: 21, ate: 25, amount: 140, duration: 60 },
};
test('(c) sem atendimentos: marcado, seguinte identificada', () => {
  const a = analisarExclusao(exc, calc(['x', 20, 1], ['y', 25, 1], ['z', 30, 1]), {});
  assert.deepEqual([a.status, a.faixa?.id, a.seguinte?.id, a.marcadoInicial], ['livre', 'y', 'z', true]);
});
test('(c) em uso: bloqueada, com a contagem', () => {
  const a = analisarExclusao(exc, calc(['x', 20, 1], ['y', 25, 1]), { y: 3 });
  assert.deepEqual([a.status, a.atendimentos, a.marcadoInicial], ['em_uso', 3, false]);
});
test('(c) não tem: precisa de início E fim iguais', () => {
  assert.equal(analisarExclusao(exc, calc(['x', 18, 1], ['y', 25, 1]), {}).status, 'nao_tem');
  assert.equal(analisarExclusao(exc, [], {}).status, 'nao_tem');
});
