import { z } from 'zod';
import type { Appointment } from '@/types';

export const politicaCancelamentoSchema = z.object({
  cancellation_notice_hours: z.number().int('Informe horas inteiras').min(1, 'O aviso deve ser de pelo menos 1 hora'),
  cancellation_fee: z.number().min(0, 'A taxa não pode ser negativa'),
});

export function listarLembretesConfirmacao(agendamentos: Appointment[], dias = 3, horasAviso = 48, agora = new Date()) {
  const inicio = agora.getTime();
  const fim = inicio + dias * 24 * 60 * 60 * 1000;
  return agendamentos
    .filter(a => a.date.getTime() >= inicio && a.date.getTime() <= fim &&
      ['pendente', 'confirmado', 'retorno_previsto'].includes(a.confirmationStatus))
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .map(agendamento => ({
      agendamento,
      enviado: !!agendamento.confirmationSentAt,
      prazoPassou: agendamento.date.getTime() - inicio < horasAviso * 60 * 60 * 1000,
    }));
}