/**
 * Replicar mudança de estrutura de faixas de manutenção (incluir, alterar "Até", excluir)
 * do serviço de origem para os outros serviços com manutenção. Somente funções puras.
 * Faixas de serviços diferentes se correspondem pelos dias, nunca por posição ou nome.
 */
import { calcularFaixas, erroAteFaixa } from './serviceFaixas';

export interface FaixaDias {
  id?: string;
  de: number;
  ate: number;
  amount: number;
  duration: number;
}

export type MudancaFaixa =
  | { tipo: 'incluir'; antes: FaixaDias[]; nova: FaixaDias; anterior?: FaixaDias }
  | { tipo: 'alterar'; antes: FaixaDias[]; de: number; fimAntigo: number; fimNovo: number }
  | { tipo: 'excluir'; antes: FaixaDias[]; removida: FaixaDias };

export interface ResultadoDeteccao {
  /** Quantas mudanças de estrutura houve (inclusões + exclusões + "Até" alterados). */
  quantidade: number;
  /** Preenchida só quando quantidade === 1 e a mudança é replicável. */
  mudanca: MudancaFaixa | null;
}

/**
 * Compara as faixas antes/depois do salvamento pelo id. Valor/duração não contam;
 * o ajuste automático do início da faixa seguinte também não conta.
 */
export function detectarMudancaEstrutura(
  antesRaw: { id?: string; ate: number; amount: number; duration: number }[],
  depoisRaw: { id?: string; ate: number; amount: number; duration: number }[],
): ResultadoDeteccao {
  const antes = calcularFaixas(antesRaw);
  const depois = calcularFaixas(depoisRaw);
  const antesPorId = new Map(antes.filter(f => f.id).map(f => [f.id!, f]));
  const depoisIds = new Set(depois.filter(f => f.id).map(f => f.id!));

  const novas = depois.filter(f => !f.id || !antesPorId.has(f.id));
  const removidas = antes.filter(f => f.id && !depoisIds.has(f.id));
  const alteradas = depois.filter(f => f.id && antesPorId.has(f.id) && antesPorId.get(f.id)!.ate !== f.ate);
  const quantidade = novas.length + removidas.length + alteradas.length;
  if (quantidade !== 1) return { quantidade, mudanca: null };

  const base = antes.map(limpar);
  if (novas.length) {
    const idx = depois.indexOf(novas[0]);
    // A "Nova faixa" sempre entra depois da última; qualquer outra coisa não é replicável.
    if (idx !== depois.length - 1) return { quantidade, mudanca: null };
    return { quantidade, mudanca: { tipo: 'incluir', antes: base, nova: limpar(novas[0]), anterior: idx > 0 ? limpar(depois[idx - 1]) : undefined } };
  }
  if (removidas.length) return { quantidade, mudanca: { tipo: 'excluir', antes: base, removida: limpar(removidas[0]) } };
  const f = alteradas[0];
  const original = antesPorId.get(f.id!)!;
  return { quantidade, mudanca: { tipo: 'alterar', antes: base, de: original.de, fimAntigo: original.ate, fimNovo: f.ate } };
}

const limpar = (f: FaixaDias): FaixaDias => ({ id: f.id, de: f.de, ate: f.ate, amount: f.amount, duration: f.duration });

export const formatarIntervalo = (f: { de: number; ate: number }) => `${f.de}–${f.ate}`;
export const formatarFaixas = (faixas: { de: number; ate: number }[]) =>
  faixas.length ? `${faixas.map(formatarIntervalo).join(' · ')} dias` : 'sem faixas';

/** Mesmos limites (início e fim) em todas as faixas. */
const mesmaEstrutura = (a: FaixaDias[], b: FaixaDias[]) =>
  a.length === b.length && a.every((f, i) => f.de === b[i].de && f.ate === b[i].ate);

// ---------------------------------------------------------------------------
// (a) Incluir faixa
// ---------------------------------------------------------------------------

export type StatusInclusao = 'mesmas' | 'diferentes' | 'cobre';

export interface AnaliseInclusao {
  status: StatusInclusao;
  /** Intervalo que a nova faixa terá neste serviço (quando status ≠ cobre). */
  novaDe: number;
  novaAte: number;
  /** Última faixa atual do serviço (para "Já cobre" e para sugerir valor). */
  ultima?: FaixaDias;
  marcadoInicial: boolean;
}

export function analisarInclusao(mudanca: Extract<MudancaFaixa, { tipo: 'incluir' }>, faixas: FaixaDias[]): AnaliseInclusao {
  const ultima = faixas[faixas.length - 1];
  const ultimoFim = ultima?.ate ?? 0;
  const ate = mudanca.nova.ate;
  if (ultimoFim >= ate) return { status: 'cobre', novaDe: ultimoFim + 1, novaAte: ate, ultima, marcadoInicial: false };
  const mesmas = faixas.length > 0 && mesmaEstrutura(faixas, mudanca.antes);
  return { status: mesmas ? 'mesmas' : 'diferentes', novaDe: ultimoFim + 1, novaAte: ate, ultima, marcadoInicial: mesmas };
}

export type ModoValor = 'mais_reais' | 'mais_pct' | 'mesmo';

/** Diferença e proporção entre a nova faixa da origem e a faixa anterior da origem. */
export function referenciaValor(mudanca: Extract<MudancaFaixa, { tipo: 'incluir' }>) {
  const novo = mudanca.nova.amount;
  const anterior = mudanca.anterior?.amount;
  if (anterior == null || anterior <= 0) return null;
  return { novo, anterior, diferenca: novo - anterior, proporcao: novo / anterior, percentual: Math.round((novo / anterior - 1) * 100) };
}

export const arredondar5 = (v: number) => Math.round(v / 5) * 5;

export function sugerirValor(modo: ModoValor, mudanca: Extract<MudancaFaixa, { tipo: 'incluir' }>, ultimaDestino?: FaixaDias): number {
  const novo = mudanca.nova.amount;
  const ref = referenciaValor(mudanca);
  if (!ref || !ultimaDestino || modo === 'mesmo') return novo;
  if (modo === 'mais_reais') return round2(ultimaDestino.amount + ref.diferenca);
  return arredondar5(ultimaDestino.amount * ref.proporcao);
}

const round2 = (v: number) => Math.round(v * 100) / 100;

// ---------------------------------------------------------------------------
// (b) Alterar o "Até" de uma faixa
// ---------------------------------------------------------------------------

/**
 * mesmas: estrutura inteira igual à da origem antes da mudança (marcado).
 * tem: mesmo início e mesmo fim antigo, estrutura diferente no resto (marcado).
 * diferentes: só o fim antigo bate, início diferente (desmarcado, pode marcar).
 */
export type StatusAlteracao = 'mesmas' | 'tem' | 'diferentes' | 'ja_esta' | 'nao_tem' | 'conflito';

export interface AnaliseAlteracao {
  status: StatusAlteracao;
  faixa?: FaixaDias;
  seguinte?: FaixaDias;
  /** Motivo do conflito, com a mesma mensagem do editor de faixas. */
  motivo?: string;
  marcadoInicial: boolean;
}

export function analisarAlteracao(mudanca: Extract<MudancaFaixa, { tipo: 'alterar' }>, faixas: FaixaDias[]): AnaliseAlteracao {
  const idx = faixas.findIndex(f => f.ate === mudanca.fimAntigo);
  if (idx < 0) {
    const igual = faixas.some(f => f.ate === mudanca.fimNovo);
    return { status: igual ? 'ja_esta' : 'nao_tem', marcadoInicial: false };
  }
  const faixa = faixas[idx];
  const seguinte = idx + 1 < faixas.length ? faixas[idx + 1] : undefined;
  const motivo = erroAteFaixa(mudanca.fimNovo, faixa.de, seguinte?.ate, faixas.filter((_, i) => i !== idx).map(f => f.ate));
  if (motivo) return { status: 'conflito', faixa, seguinte, motivo, marcadoInicial: false };
  if (faixa.de !== mudanca.de) return { status: 'diferentes', faixa, seguinte, marcadoInicial: false };
  return { status: mesmaEstrutura(faixas, mudanca.antes) ? 'mesmas' : 'tem', faixa, seguinte, marcadoInicial: true };
}

// ---------------------------------------------------------------------------
// (c) Excluir faixa
// ---------------------------------------------------------------------------

export type StatusExclusao = 'livre' | 'em_uso' | 'nao_tem';

export interface AnaliseExclusao {
  status: StatusExclusao;
  faixa?: FaixaDias;
  seguinte?: FaixaDias;
  atendimentos: number;
  marcadoInicial: boolean;
}

export function analisarExclusao(
  mudanca: Extract<MudancaFaixa, { tipo: 'excluir' }>,
  faixas: FaixaDias[],
  atendimentosPorFaixa: Record<string, number>,
): AnaliseExclusao {
  const { de, ate } = mudanca.removida;
  const idx = faixas.findIndex(f => f.de === de && f.ate === ate);
  if (idx < 0) return { status: 'nao_tem', atendimentos: 0, marcadoInicial: false };
  const faixa = faixas[idx];
  const seguinte = faixas[idx + 1];
  const atendimentos = (faixa.id && atendimentosPorFaixa[faixa.id]) || 0;
  if (atendimentos > 0) return { status: 'em_uso', faixa, seguinte, atendimentos, marcadoInicial: false };
  return { status: 'livre', faixa, seguinte, atendimentos: 0, marcadoInicial: true };
}
