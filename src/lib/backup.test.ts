import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  escaparCsv, gerarCsv, BOM, sanitizarNome, nomeComId, formatarRespostaAnamnese,
  formatarDataBr, formatarValor, nomeArquivoZip,
} from './backup';

test('escapa ponto e vírgula, aspas e quebra de linha', () => {
  assert.equal(escaparCsv('a;b'), '"a;b"');
  assert.equal(escaparCsv('diz "oi"'), '"diz ""oi"""');
  assert.equal(escaparCsv('linha1\nlinha2'), '"linha1\nlinha2"');
  assert.equal(escaparCsv('simples'), 'simples');
  assert.equal(escaparCsv(null), '');
});

test('CSV começa com BOM e usa ;', () => {
  const csv = gerarCsv(['Nome', 'Valor'], [['Ana', '10,00']]);
  assert.ok(csv.startsWith(BOM));
  assert.equal(csv, `${BOM}Nome;Valor\r\nAna;10,00\r\n`);
});

test('sanitiza nomes: acentos e caracteres inválidos', () => {
  assert.equal(sanitizarNome('Joana d\'Ávila / Sé: "VIP"?'), "Joana_d'Avila_Se_VIP");
  assert.equal(sanitizarNome('   '), 'sem_nome');
  assert.equal(sanitizarNome('a'.repeat(100)).length, 40);
});

test('duas clientes com o mesmo nome não colidem', () => {
  const a = nomeComId('Maria Silva', '11111111-aaaa-bbbb-cccc-000000000000');
  const b = nomeComId('Maria Silva', '22222222-aaaa-bbbb-cccc-000000000000');
  assert.notEqual(a, b);
  assert.equal(a, 'Maria_Silva_11111111');
});

test('formata respostas de anamnese', () => {
  assert.equal(formatarRespostaAnamnese('multipla_escolha', ['Alergia', 'Diabetes']), 'Alergia, Diabetes');
  assert.equal(formatarRespostaAnamnese('sim_nao', 'sim'), 'Sim');
  assert.equal(formatarRespostaAnamnese('sim_nao', 'nao'), 'Não');
  assert.equal(formatarRespostaAnamnese('checkbox', true), 'Sim');
  assert.equal(formatarRespostaAnamnese('checkbox', false), 'Não');
  assert.equal(formatarRespostaAnamnese('data', '2026-03-05'), '05/03/2026');
  assert.equal(formatarRespostaAnamnese('texto_curto', null), '');
});

test('datas no fuso de São Paulo, valores com vírgula e nome do zip', () => {
  assert.equal(formatarDataBr('2026-11-24T02:30:00Z'), '23/11/2026 23:30');
  assert.equal(formatarValor(39.9), '39,90');
  assert.equal(nomeArquivoZip(new Date('2026-11-24T16:41:00Z')), 'belafy-backup-2026-11-24-1341.zip');
});
