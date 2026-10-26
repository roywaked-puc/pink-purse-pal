import type { Appointment, Service } from '@/types';

export const TEMPLATE_CONFIRMACAO_PADRAO = `{saudacao}, {nome}!

Passando para confirmar seu horário de {servico} dos cílios.

📅 Data: {data}
⏰ Horário: {horario}

Aguardo você! ✨

⚠️ Atenção
Se não puder comparecer, me avise com pelo menos {horas_aviso}h de antecedência para tentarmos reagendar.
Faltas ou cancelamentos com menos de {horas_aviso}h de antecedência terão uma taxa de R$ {taxa}.`;

export interface ConfiguracaoConfirmacao {
  confirm_message_template?: string | null;
  cancellation_notice_hours?: number;
  cancellation_fee?: number;
}

export function servicoConfirmacao(agendamento: Pick<Appointment, 'service' | 'serviceId'>, servico?: Service): string {
  if (agendamento.serviceId && servico?.tierType === 'colocacao') return 'Colocação';
  if (agendamento.serviceId && servico?.tierType === 'manutencao') return 'Manutenção';
  return servico?.description || agendamento.service;
}

export function montarMensagemConfirmacao(
  agendamento: Pick<Appointment, 'date' | 'clientName' | 'service' | 'serviceId'>,
  configuracoes: ConfiguracaoConfirmacao = {},
  servico?: Service,
  agora = new Date(),
): string {
  const fuso = 'America/Sao_Paulo';
  const hora = Number(new Intl.DateTimeFormat('pt-BR', { timeZone: fuso, hour: '2-digit', hourCycle: 'h23' }).format(agora));
  const variaveis: Record<string, string> = {
    saudacao: hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite',
    nome: agendamento.clientName.trim().split(/\s+/)[0] || '',
    servico: servicoConfirmacao(agendamento, servico),
    data: new Intl.DateTimeFormat('pt-BR', { timeZone: fuso, day: '2-digit', month: '2-digit', year: 'numeric' }).format(agendamento.date),
    horario: new Intl.DateTimeFormat('pt-BR', { timeZone: fuso, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(agendamento.date),
    horas_aviso: String(configuracoes.cancellation_notice_hours ?? 48),
    taxa: (configuracoes.cancellation_fee ?? 50).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
  };
  const template = configuracoes.confirm_message_template?.trim() ? configuracoes.confirm_message_template : TEMPLATE_CONFIRMACAO_PADRAO;
  return template.replace(/\{([^{}]+)\}/g, (original, chave: string) => variaveis[chave] ?? original);
}

export function whatsappLink(phone: string | undefined, message: string): string | null {
  const clean = (phone || '').replace(/\D/g, '');
  if (!clean) return null;
  const withCountry = clean.startsWith('55') ? clean : `55${clean}`;
  return `https://wa.me/${withCountry}?text=${encodeURIComponent(message)}`;
}

export const waMessages = {
  confirm: (name: string, dateStr: string) =>
    `Olá ${name}! Tudo bem? Passando para confirmar seu agendamento em ${dateStr}. Posso confirmar? ✨`,
  return: (name: string) =>
    `Olá ${name}! Já está chegando a hora do seu retorno. Quer agendar um horário? ✨`,
  inactive: (name: string) =>
    `Oi ${name}! Faz um tempinho que não nos vemos 💕 Que tal marcar um horário? Posso te encaixar.`,
  pendingPayment: (name: string, value: string) =>
    `Olá ${name}! Tudo bem? Apenas um lembrete carinhoso sobre o saldo de ${value}. Qualquer dúvida estou à disposição 💕`,
  birthday: (name: string) =>
    `Parabéns, ${name}! 🎉🎂 Que seu dia seja tão lindo quanto você. Um presente especial te aguarda — vamos marcar? 💕`,
};
