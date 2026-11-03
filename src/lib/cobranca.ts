import type { Appointment, Service } from '@/types';
import { getAppointmentDescription } from '@/lib/maintenance';

/** Chave Pix exibida na mensagem de cobrança. */
export const PIX_COBRANCA = 'marcinhacilios@gmail.com';
/** Assinatura exibida no final da mensagem de cobrança. */
export const ASSINATURA_COBRANCA = 'Marcinha';

export interface AtendimentoEmAberto {
  appointment: Appointment;
  /** Valor em aberto (amount − paidAmount, com piso 0). Sempre > 0. */
  emAberto: number;
  /** Descrição montada a partir do serviço estruturado (fallback: texto legado). */
  descricao: string;
}

const formatBRL = (v: number) =>
  v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/**
 * Lista os atendimentos com saldo em aberto de uma cliente.
 * Regras (mesmas do card "Saldo pendente"):
 * - apenas confirmation_status = 'atendido';
 * - exclui permutas e cancelados;
 * - valor em aberto = amount − paidAmount, com piso 0; itens zerados são ignorados;
 * - ordem cronológica (mais antigo primeiro).
 */
export function atendimentosEmAberto(
  appointments: Appointment[],
  clientId: string,
  getServiceById?: (id: string) => Service | undefined,
): AtendimentoEmAberto[] {
  return appointments
    .filter(
      (a) =>
        a.clientId === clientId &&
        a.confirmationStatus === 'atendido' &&
        !a.isPermuta &&
        a.amount - (a.paidAmount || 0) > 0,
    )
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map((a) => ({
      appointment: a,
      emAberto: Math.max(0, a.amount - (a.paidAmount || 0)),
      descricao: getAppointmentDescription(
        a,
        a.serviceId && getServiceById ? getServiceById(a.serviceId) : undefined,
      ),
    }));
}

/** Soma dos valores em aberto dos itens selecionados. */
export function totalEmAberto(itens: AtendimentoEmAberto[]): number {
  return itens.reduce((s, i) => s + i.emAberto, 0);
}

const FUSO = 'America/Sao_Paulo';

function formatarDataCurta(date: Date): string {
  const diaSemana = new Intl.DateTimeFormat('pt-BR', { timeZone: FUSO, weekday: 'short' })
    .format(date)
    .replace('.', '');
  const diaMes = new Intl.DateTimeFormat('pt-BR', { timeZone: FUSO, day: '2-digit', month: '2-digit' }).format(date);
  return `${diaSemana}, ${diaMes}`;
}

/**
 * Monta o texto da cobrança de saldo pendente para WhatsApp.
 * A linha "Valor: ... | Pago: ..." só aparece quando algo já foi pago.
 */
export function montarMensagemCobranca(nomeCliente: string, itens: AtendimentoEmAberto[]): string {
  const primeiroNome = nomeCliente.trim().split(/\s+/)[0] || '';
  const blocos = itens.map((item) => {
    const a = item.appointment;
    const pago = a.paidAmount || 0;
    const linhas = [`📅 *${formatarDataCurta(new Date(a.date))}* · ${item.descricao}`];
    if (pago > 0) {
      linhas.push(`Valor: R$ ${formatBRL(a.amount)} | Pago: R$ ${formatBRL(pago)}`);
    }
    linhas.push(`Em aberto: *R$ ${formatBRL(item.emAberto)}*`);
    return linhas.join('\n');
  });

  return [
    `Oi, ${primeiroNome}! Tudo bem?`,
    '',
    'Passando pra te mandar o resumo dos atendimentos que ficaram em aberto:',
    '',
    blocos.join('\n\n'),
    '',
    '━━━━━━━━━━━━',
    `💰 *Total em aberto: R$ ${formatBRL(totalEmAberto(itens))}*`,
    '',
    `Pode acertar pelo Pix: ${PIX_COBRANCA}`,
    'Qualquer dúvida é só me chamar. Obrigada!',
    ASSINATURA_COBRANCA,
  ].join('\n');
}
