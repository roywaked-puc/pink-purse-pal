import type { Appointment, Client, Service } from '@/types';
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
const diaFormat = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit',
});
const valorFormat = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

/** Meia-noite UTC do dia de calendário em America/Sao_Paulo. */
function diaSp(data: Date): number {
  const [ano, mes, dia] = diaFormat.format(data).split('-').map(Number);
  return Date.UTC(ano, mes - 1, dia);
}

/**
 * Dias de calendário entre o agendamento e o imediatamente anterior da cliente.
 * O anterior é o item anterior da própria lista futura ou, para o primeiro item,
 * o último agendamento passado com status 'atendido'. Cancelados são ignorados.
 */
export function calcularDiasDesdeAnterior(
  atual: Appointment,
  futuros: Appointment[],
  todos: Appointment[],
): number | null {
  const dataAtual = new Date(atual.date).getTime();
  const naLista = new Set(futuros.map((a) => a.id));
  const anterior = todos
    .filter((a) =>
      a.id !== atual.id &&
      new Date(a.date).getTime() < dataAtual &&
      (naLista.has(a.id) || a.confirmationStatus === 'atendido'),
    )
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
  if (!anterior) return null;
  return Math.round((diaSp(new Date(atual.date)) - diaSp(new Date(anterior.date))) / 86400000);
}

export function montarMensagemAgenda(
  cliente: Pick<Client, 'name'>,
  agendamentos: Appointment[],
  opcoes: { mostrarValores: boolean; servicos: Service[]; agora?: Date },
): string {
  const nome = cliente.name.trim().split(/\s+/)[0];
  const futuros = selecionarAgendaFutura(agendamentos, opcoes.agora);
  const linhas = futuros.map((a) => {
    const partes = dataFormat.formatToParts(new Date(a.date));
    const parte = (tipo: Intl.DateTimeFormatPartTypes) => partes.find((p) => p.type === tipo)?.value ?? '';
    const data = `${parte('weekday').replace(/\.$/, '')}, ${parte('day')}/${parte('month')} · ${parte('hour')}:${parte('minute')}`;
    const servico = a.serviceId ? opcoes.servicos.find((s) => s.id === a.serviceId) : undefined;
    let descricao = '';
    if (servico?.techniqueName && servico.tierType === 'colocacao') {
      descricao = 'Colocação';
    } else if (servico?.techniqueName && servico.tierType === 'manutencao') {
      const dias = calcularDiasDesdeAnterior(a, futuros, agendamentos);
      descricao = dias == null ? 'Manutenção' : `Manutenção (${dias} ${dias === 1 ? 'dia' : 'dias'})`;
    } else if (a.serviceId) {
      // Com vínculo, nunca recuperar a descrição congelada do agendamento.
      descricao = servico ? servico.description : '';
    } else {
      descricao = a.service;
    }
    const valor = opcoes.mostrarValores && !a.isPermuta ? ` · ${valorFormat.format(a.amount)}` : '';
    return `✨ ${data}${descricao ? ` · ${descricao}` : ''}${valor}`;
  });
  const cabecalho = `Oi, ${nome}! Tudo bem? 😊\nSeus horários de fim de ano já estão garantidos:`;
  const atencao = '⚠️ Atenção\nSe não puder comparecer, me avise com pelo menos 48h de antecedência para tentarmos reagendar.\nFaltas ou cancelamentos com menos de 48h de antecedência terão uma taxa de R$ 50,00.';
  const rodape = 'Agradeço a confiança! 💕';
  return [cabecalho, linhas.join('\n'), atencao, rodape].filter(Boolean).join('\n\n');
}

export function linkAgendaWhatsapp(telefone: string | undefined, mensagem: string): string | null {
  const digitos = (telefone ?? '').replace(/\D/g, '');
  const nacional = (digitos.length === 12 || digitos.length === 13) && digitos.startsWith('55')
    ? digitos.slice(2) : digitos;
  if (!/^[1-9]\d(?:[2-5]\d{7}|9\d{8})$/.test(nacional)) return null;
  return whatsappLink(`55${nacional}`, mensagem);
}
