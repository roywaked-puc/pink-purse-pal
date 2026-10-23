import type { Appointment, Client, Service } from '@/types';
import { getAppointmentDescription } from './maintenance';
import { whatsappLink } from './whatsapp';

export function selecionarAgendaFutura(agendamentos: Appointment[], agora = new Date()): Appointment[] {
  return agendamentos.filter((a) =>
    new Date(a.date).getTime() >= agora.getTime() &&
    ['pendente', 'confirmado', 'retorno_previsto'].includes(a.confirmationStatus),
  ).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

const dataFormat = new Intl.DateTimeFormat('pt-BR', {
  timeZone: 'America/Sao_Paulo', weekday: 'short', day: '2-digit', month: '2-digit',
  hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
});
const valorFormat = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

export function montarMensagemAgenda(
  cliente: Pick<Client, 'name'>,
  agendamentos: Appointment[],
  opcoes: { mostrarValores: boolean; servicos: Service[]; agora?: Date },
): string {
  const nome = cliente.name.trim().split(/\s+/)[0];
  const linhas = selecionarAgendaFutura(agendamentos, opcoes.agora).map((a) => {
    const partes = dataFormat.formatToParts(new Date(a.date));
    const parte = (tipo: Intl.DateTimeFormatPartTypes) => partes.find((p) => p.type === tipo)?.value ?? '';
    const data = `${parte('weekday').replace(/\.$/, '')}, ${parte('day')}/${parte('month')} · ${parte('hour')}:${parte('minute')}`;
    const servico = a.serviceId ? opcoes.servicos.find((s) => s.id === a.serviceId) : undefined;
    // Com vínculo, nunca recuperar a descrição congelada do agendamento.
    const descricao = a.serviceId
      ? (servico ? getAppointmentDescription({ ...a, service: servico.description }, servico) : '')
      : a.service;
    const valor = opcoes.mostrarValores && !a.isPermuta ? ` · ${valorFormat.format(a.amount)}` : '';
    return `📅 ${data}${descricao ? ` — ${descricao}` : ''}${valor}`;
  });
  return `Oi, ${nome}! 💕 Seus próximos horários comigo:\n\n${linhas.join('\n')}\n\nQualquer imprevisto, me avisa com antecedência pra gente remarcar 😊`;
}

export function linkAgendaWhatsapp(telefone: string | undefined, mensagem: string): string | null {
  const digitos = (telefone ?? '').replace(/\D/g, '');
  const nacional = (digitos.length === 12 || digitos.length === 13) && digitos.startsWith('55')
    ? digitos.slice(2) : digitos;
  if (!/^[1-9]\d(?:[2-5]\d{7}|9\d{8})$/.test(nacional)) return null;
  return whatsappLink(`55${nacional}`, mensagem);
}