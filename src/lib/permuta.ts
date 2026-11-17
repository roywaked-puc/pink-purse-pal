import type { Account, Appointment, Client, Transaction } from '@/types';
import { isTransacaoPermuta } from './accountBalance';

export const ERRO_ACERTO_PERMUTA = 'Este lançamento é um acerto de permuta e não pode ser editado ou excluído aqui.';
export const ERRO_CLIENTE_PERMUTA = 'Não é possível excluir cliente com saldo de permuta em aberto. Acerte o saldo antes de excluir.';
export function preferePermuta(cliente: Client | undefined, corte: string | null | undefined) {
  return corte ? Boolean(cliente?.pagaPermuta) : Boolean(cliente?.contaPermutaPadraoId);
}
export function saldoPendenteDinheiro(agendamentos: Appointment[]) {
  return agendamentos.filter(a => !a.isPermuta && a.confirmationStatus !== 'cancelado')
    .reduce((s, a) => s + Math.max(0, a.amount - a.paidAmount), 0);
}
export function creditoAtendimentoPermuta(agendamento: Appointment, corte: string | null | undefined, transacoes: Transaction[], contas: Account[]) {
  if (!corte || !agendamento.isPermuta || !agendamento.clientId || agendamento.confirmationStatus !== 'atendido' || new Date(agendamento.date) < new Date(corte)) return 0;
  const vinculadas = transacoes.filter(t => t.appointmentId === agendamento.id);
  if (vinculadas.some(t => isTransacaoPermuta(t, contas))) return 0;
  return Math.max(0, agendamento.amount - vinculadas.filter(t => t.type === 'entrada').reduce((s, t) => s + (t.grossAmount ?? t.amount), 0));
}
export function contaPermitidaRecebimento(conta: Account, agendamentoPermuta: boolean, corte: string | null | undefined) {
  return corte ? conta.type !== 'permuta' : !agendamentoPermuta || conta.type === 'permuta';
}
export type SituacaoPagamento = 'pago' | 'sinal' | 'nao_pago' | 'permuta';
type AgendamentoPagamento = Pick<Appointment, 'isPermuta' | 'date' | 'paymentStatus' | 'amount' | 'paidAmount'>;
/** Situação exibida: permuta depois do corte vira 'permuta'; o resto usa o status salvo. */
export function situacaoPagamento(a: AgendamentoPagamento, permutaCorteEm: string | null | undefined): SituacaoPagamento {
  if (a.isPermuta && permutaCorteEm && new Date(a.date).getTime() >= new Date(permutaCorteEm).getTime()) return 'permuta';
  return a.paymentStatus;
}
/** Quanto falta receber em dinheiro: 0 para permuta depois do corte; senão total − pago, piso 0. */
export function saldoAReceberEmDinheiro(a: AgendamentoPagamento, permutaCorteEm: string | null | undefined): number {
  if (situacaoPagamento(a, permutaCorteEm) === 'permuta') return 0;
  return Math.max(0, a.amount - (a.paidAmount || 0));
}
