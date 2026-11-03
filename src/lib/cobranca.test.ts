import { describe, expect, it } from 'bun:test';
import {
  ASSINATURA_COBRANCA,
  PIX_COBRANCA,
  atendimentosEmAberto,
  montarMensagemCobranca,
  totalEmAberto,
} from '@/lib/cobranca';
import type { Appointment, Service } from '@/types';

const base: Appointment = {
  id: 'a1',
  date: new Date('2026-10-12T12:00:00-03:00'), // segunda, 12/10
  clientId: 'c1',
  clientName: 'Aldeneia Souza',
  service: 'Volume Brasileiro',
  amount: 150,
  paidAmount: 0,
  paymentStatus: 'nao_pago',
  confirmationStatus: 'atendido',
  duration: 60,
};

const servicoManutencao: Service = {
  id: 's1',
  description: 'Volume Brasileiro - Manutenção 16 a 20 dias',
  amount: 130,
  duration: 60,
  techniqueName: 'Volume Brasileiro',
  tierType: 'manutencao',
  diasMin: 16,
  diasMax: 20,
};

describe('atendimentosEmAberto', () => {
  it('inclui apenas atendidos com valor em aberto, em ordem cronológica', () => {
    const itens = atendimentosEmAberto(
      [
        { ...base, id: 'novo', date: new Date('2026-10-20T12:00:00-03:00') },
        { ...base, id: 'antigo', date: new Date('2026-09-01T12:00:00-03:00') },
        { ...base, id: 'quitado', paidAmount: 150 },
        { ...base, id: 'pendente-futuro', confirmationStatus: 'confirmado' },
        { ...base, id: 'cancelado', confirmationStatus: 'cancelado' },
        { ...base, id: 'permuta', isPermuta: true },
        { ...base, id: 'outra-cliente', clientId: 'c2' },
      ],
      'c1',
    );
    expect(itens.map((i) => i.appointment.id)).toEqual(['antigo', 'novo']);
  });

  it('calcula valor em aberto com piso 0 e ignora pagamento a maior', () => {
    const itens = atendimentosEmAberto(
      [{ ...base, amount: 100, paidAmount: 60 }, { ...base, id: 'a2', amount: 100, paidAmount: 120 }],
      'c1',
    );
    expect(itens).toHaveLength(1);
    expect(itens[0].emAberto).toBe(40);
  });

  it('monta descrição a partir do serviço estruturado e usa fallback legado', () => {
    const comServico = atendimentosEmAberto(
      [{ ...base, serviceId: 's1', maintenanceNumber: 2 }],
      'c1',
      (id) => (id === 's1' ? servicoManutencao : undefined),
    );
    expect(comServico[0].descricao).toBe(
      'Volume Brasileiro · Manutenção · Faixa 16–20 dias · 2ª manutenção',
    );

    const semServico = atendimentosEmAberto([{ ...base, service: 'Alongamento de unhas' }], 'c1');
    expect(semServico[0].descricao).toBe('Alongamento de unhas');
  });
});

describe('montarMensagemCobranca', () => {
  const itens = atendimentosEmAberto(
    [
      { ...base, id: 'a1', amount: 150, paidAmount: 0 },
      { ...base, id: 'a2', date: new Date('2026-10-24T12:00:00-03:00'), amount: 200, paidAmount: 50 },
    ],
    'c1',
  );

  const msg = montarMensagemCobranca('Aldeneia Souza', itens);

  it('usa o primeiro nome na saudação', () => {
    expect(msg.startsWith('Oi, Aldeneia! Tudo bem?')).toBe(true);
  });

  it('mostra a linha Valor/Pago só quando houve pagamento parcial', () => {
    expect(msg).not.toContain('Valor: R$ 150,00');
    expect(msg).toContain('Valor: R$ 200,00 | Pago: R$ 50,00');
    expect(msg).toContain('Em aberto: *R$ 150,00*');
    expect(msg).toContain('Em aberto: *R$ 150,00*');
  });

  it('soma o total dos itens e fecha com Pix e assinatura', () => {
    expect(totalEmAberto(itens)).toBe(300);
    expect(msg).toContain('💰 *Total em aberto: R$ 300,00*');
    expect(msg).toContain(`Pode acertar pelo Pix: ${PIX_COBRANCA}`);
    expect(msg.trimEnd().endsWith(ASSINATURA_COBRANCA)).toBe(true);
  });

  it('formata a data abreviada em pt-BR sem ponto no dia da semana', () => {
    expect(msg).toContain('📅 *seg, 12/10*');
    expect(msg).toContain('📅 *sáb, 24/10*');
  });
});
