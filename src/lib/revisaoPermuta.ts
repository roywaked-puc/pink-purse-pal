export const ETAPAS_FORMULARIOS_PERMUTA_PRONTAS = false;

export interface ContaPermutaRevisao {
  conta_legada_id: string;
  nome: string;
  saldo_bruto: number;
  saldo_liquido: number;
  client_id_sugerido: string | null;
}

export interface AtendimentoPermutaSemLancamento {
  id: string;
  client_id: string;
  client_name: string;
  date: string;
  amount: number;
}

export interface RevisaoPermuta {
  corte: string | null;
  contas: ContaPermutaRevisao[];
  atendimentos: AtendimentoPermutaSemLancamento[];
}

export function podeAtivarPermuta(formulariosProntos: boolean, jaAtivada: boolean, contas: { saldo: number; client_id: string | null }[]) {
  return formulariosProntos && !jaAtivada && contas.every(c => c.saldo === 0 || Boolean(c.client_id));
}

export function textoSaldoPermuta(nome: string, saldo: number) {
  const valor = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Math.abs(saldo));
  return saldo > 0 ? `${nome} te deve ${valor}` : saldo < 0 ? `Você deve ${valor} para ${nome}` : 'Sem saldo a migrar';
}