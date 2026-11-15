import type { ResumoAssinatura } from '@/types';

export const PRECOS_PRO = { mensal: 3990, anual: 35900 } as const;
export class AssinaturaNecessariaError extends Error {
  readonly code = 'P0010';
  constructor() { super('Assine para criar novos agendamentos.'); this.name = 'AssinaturaNecessariaError'; }
}
export function podeCriarAgendamento(estado: ResumoAssinatura['estado']) { return estado !== 'expirado'; }
export function diasRestantesTeste(testeAte: string, agora = new Date()) {
  return Math.max(0, Math.ceil((new Date(testeAte).getTime() - agora.getTime()) / 86400000));
}
export function avisoAssinatura(a: ResumoAssinatura, agora = new Date()): string | null {
  if (a.estado === 'expirado') return 'Assine para criar novos agendamentos';
  if (a.estado !== 'teste') return null;
  const dias = diasRestantesTeste(a.teste_ate, agora);
  if (dias > 10) return null;
  return dias === 0 ? 'Seu teste terminou. Assine para criar novos agendamentos.' : `Seu teste termina em ${dias} ${dias === 1 ? 'dia' : 'dias'}.`;
}