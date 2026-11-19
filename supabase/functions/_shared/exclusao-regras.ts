export const PRAZO_DESISTENCIA_DIAS = 30;
export const PRAZO_REEMBOLSO_DIAS = 7;
export function elegivelReembolso(primeiroPagamento: number | null, agora = Date.now()) {
  return primeiroPagamento !== null && primeiroPagamento <= agora && agora - primeiroPagamento <= PRAZO_REEMBOLSO_DIAS * 86400000;
}
export function podeReativar(excluirApos: string, agora = Date.now()) { return agora < new Date(excluirApos).getTime(); }
export function podeCancelarPro(estado: string, status: string) { return estado === 'pro' && ['active', 'past_due', 'trialing'].includes(status); }
