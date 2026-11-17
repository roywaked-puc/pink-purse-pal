import type { Appointment } from '@/types';

export interface IndicadorMes {
  mes: number; // 0-11
  faturamento: number;
  aReceber: number;
  permuta: number;
  atendimentosPagos: number;
  atendimentosPermuta: number;
  clientesUnicas: number;
}

type ApptInput = Pick<Appointment, 'date' | 'amount' | 'paidAmount' | 'confirmationStatus' | 'isPermuta' | 'clientId' | 'clientName'>;

const fmt = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit' });

/** Ano e mês (0-11) da data no fuso de São Paulo. */
export function anoMesSaoPaulo(d: Date): { ano: number; mes: number } {
  const parts = fmt.formatToParts(d);
  const ano = Number(parts.find(p => p.type === 'year')?.value);
  const mes = Number(parts.find(p => p.type === 'month')?.value) - 1;
  return { ano, mes };
}

const normalizar = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();
const r2 = (v: number) => Math.round(v * 100) / 100;

/** Indicadores mensais a partir dos atendimentos (status 'atendido'), sem usar transações. */
export function calcularIndicadoresMensais(appointments: ApptInput[], ano: number): IndicadorMes[] {
  const meses = Array.from({ length: 12 }, (_, mes) => ({
    mes, faturamento: 0, aReceber: 0, permuta: 0, atendimentosPagos: 0, atendimentosPermuta: 0,
    clientes: new Set<string>(),
  }));
  for (const a of appointments) {
    if (a.confirmationStatus !== 'atendido') continue;
    const { ano: y, mes } = anoMesSaoPaulo(new Date(a.date));
    if (y !== ano) continue;
    const m = meses[mes];
    const amount = Number(a.amount) || 0;
    if (a.isPermuta) {
      m.permuta += amount;
      m.atendimentosPermuta += 1;
    } else {
      m.faturamento += amount;
      m.aReceber += Math.max(amount - (Number(a.paidAmount) || 0), 0);
      m.atendimentosPagos += 1;
    }
    const chave = a.clientId || (a.clientName ? `nome:${normalizar(a.clientName)}` : '');
    if (chave) m.clientes.add(chave);
  }
  return meses.map(({ clientes, ...m }) => ({
    ...m,
    faturamento: r2(m.faturamento),
    aReceber: r2(m.aReceber),
    permuta: r2(m.permuta),
    clientesUnicas: clientes.size,
  }));
}

export function temAtendimentosNoAno(appointments: ApptInput[], ano: number): boolean {
  return appointments.some(a => a.confirmationStatus === 'atendido' && anoMesSaoPaulo(new Date(a.date)).ano === ano);
}
