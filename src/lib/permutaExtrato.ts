export type PeriodoPermuta = 'ultimo_acerto' | '90_dias' | 'tudo';
export interface LinhaPermuta {
  client_id: string;
  date: string;
  origem: string;
  tipo: string;
  descricao: string | null;
  valor: number;
  appointment_id: string | null;
  permuta_lancamento_id: string | null;
}
export const dinheiroPermuta = (valor: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
export function ordenarExtrato(linhas: LinhaPermuta[]) {
  return [...linhas].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime() || (a.permuta_lancamento_id ?? a.appointment_id ?? '').localeCompare(b.permuta_lancamento_id ?? b.appointment_id ?? ''));
}
export function extratoPeriodo(linhas: LinhaPermuta[], periodo: PeriodoPermuta, agora = new Date()) {
  const ordenadas = ordenarExtrato(linhas);
  let inicio = 0;
  if (periodo === '90_dias') {
    const limite = new Date(agora);
    limite.setUTCDate(limite.getUTCDate() - 90);
    const indice = ordenadas.findIndex(l => new Date(l.date) >= limite);
    inicio = indice < 0 ? ordenadas.length : indice;
  } else if (periodo === 'ultimo_acerto') {
    let saldo = 0;
    ordenadas.forEach((l, i) => {
      saldo = Math.round((saldo + Number(l.valor)) * 100) / 100;
      if (saldo === 0 || l.tipo === 'acerto_recebido' || l.tipo === 'acerto_pago') inicio = i + 1;
    });
  }
  const saldoAnterior = ordenadas.slice(0, inicio).reduce((s, l) => s + Number(l.valor), 0);
  const saldo = ordenadas.reduce((s, l) => s + Number(l.valor), 0);
  return { linhas: ordenadas.slice(inicio), saldoAnterior, saldo };
}
export function descricaoLinhaPermuta(l: LinhaPermuta) {
  if (l.tipo === 'acerto_recebido') return 'Você pagou em dinheiro';
  if (l.tipo === 'acerto_pago') return 'Eu paguei em dinheiro';
  if (l.tipo === 'saldo_inicial') return `Saldo de ${new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit' }).format(new Date(l.date))}`;
  return `${l.descricao || (l.tipo === 'ajuste' ? 'Ajuste' : 'Atendimento')}${l.tipo === 'atendimento' ? ' (você)' : l.tipo === 'fui_atendida' ? ' (eu)' : ''}`;
}
export function montarMensagemPermuta(nome: string, linhas: LinhaPermuta[], periodo: PeriodoPermuta = 'ultimo_acerto', agora = new Date()) {
  const { linhas: selecionadas, saldoAnterior, saldo } = extratoPeriodo(linhas, periodo, agora);
  const data = new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit' });
  const texto = [`Oi, ${nome.trim().split(/\s+/)[0]}! 💕`, 'Segue nossa conta corrente de permuta para conferência:', ''];
  if (saldoAnterior !== 0) texto.push(`Saldo anterior: ${saldoAnterior < 0 ? '− ' : ''}${dinheiroPermuta(Math.abs(saldoAnterior))}`);
  selecionadas.forEach(l => texto.push(`${data.format(new Date(l.date))} – ${descricaoLinhaPermuta(l)} · ${l.valor > 0 ? '+' : '−'} ${dinheiroPermuta(Math.abs(l.valor))}`));
  texto.push('', saldo > 0 ? `Saldo atual: eu tenho ${dinheiroPermuta(saldo)} em serviços com você 😊` : saldo < 0 ? `Saldo atual: você tem ${dinheiroPermuta(-saldo)} em serviços comigo 😊` : 'Estamos quites! ✨', '', 'Qualquer divergência me avisa, tá? 💗');
  return texto.join('\n');
}
export function podeEditarPermuta(tipo: string) { return tipo === 'fui_atendida' || tipo === 'ajuste'; }