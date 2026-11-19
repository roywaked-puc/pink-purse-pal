import { banco, stripe } from './assinaturas.ts';
import { elegivelReembolso } from './exclusao-regras.ts';

export async function encerrarCobranca(userId: string, customerId: string | null, permitirEstorno: boolean) {
  if (!customerId) return false;
  const api = stripe();
  const customer = await api.customers.retrieve(customerId);
  if (customer.deleted || customer.metadata.app !== 'belafy' || customer.metadata.user_id !== userId) throw new Error('VINCULO_INVALIDO');
  const subs = [];
  for await (const sub of api.subscriptions.list({ customer: customerId, status: 'all', limit: 100 })) {
    if (sub.metadata.app !== 'belafy' || sub.metadata.user_id !== userId) throw new Error('ASSINATURA_INVALIDA');
    subs.push(sub);
  }
  const faturas = [];
  if (permitirEstorno) {
    for await (const invoice of api.invoices.list({ customer: customerId, status: 'paid', limit: 100 })) {
      if (invoice.amount_paid > 0) faturas.push(invoice);
    }
  }
  const primeira = faturas.reduce<number | null>((min, f) => {
    const pagoEm = f.status_transitions.paid_at;
    if (!pagoEm) throw new Error('DATA_PAGAMENTO_AUSENTE');
    return min === null ? pagoEm * 1000 : Math.min(min, pagoEm * 1000);
  }, null);
  const estornar = permitirEstorno && elegivelReembolso(primeira);
  // Stop billing before refunds; every operation is safe to retry after a partial provider failure.
  for (const sub of subs) {
    if (['canceled', 'incomplete_expired'].includes(sub.status)) continue;
    if (estornar || !permitirEstorno) await api.subscriptions.cancel(sub.id, { invoice_now: false, prorate: false });
    else await api.subscriptions.update(sub.id, { cancel_at_period_end: true });
  }
  for await (const session of api.checkout.sessions.list({ customer: customerId, status: 'open', limit: 100 })) {
    if (session.metadata?.app === 'belafy' && session.metadata?.user_id === userId) await api.checkout.sessions.expire(session.id);
  }
  if (estornar) {
    for (const invoice of faturas) {
      let encontrou = false;
      for await (const payment of api.invoicePayments.list({ invoice: invoice.id, status: 'paid', limit: 100 })) {
        const pi = payment.payment.payment_intent;
        if (!pi) throw new Error('PAGAMENTO_NAO_REEMBOLSAVEL');
        const intent = await api.paymentIntents.retrieve(typeof pi === 'string' ? pi : pi.id);
        const chargeId = typeof intent.latest_charge === 'string' ? intent.latest_charge : intent.latest_charge?.id;
        if (!chargeId) throw new Error('COBRANCA_AUSENTE');
        encontrou = true;
        const charge = await api.charges.retrieve(chargeId);
        if (!charge.refunded) {
          const refund = await api.refunds.create({ charge: chargeId, reason: 'requested_by_customer' }, { idempotencyKey: `belafy-exclusao-reembolso-${chargeId}` });
          if (refund.status !== 'succeeded' && refund.status !== 'pending') throw new Error('ESTORNO_FALHOU');
        }
      }
      if (!encontrou) throw new Error('PAGAMENTO_AUSENTE');
    }
  }
  const agora = new Date().toISOString();
  const { error } = await banco().from('assinaturas').update(estornar
    ? { cancelar_no_fim_do_periodo: true, status: 'canceled', plano: 'sem_plano', periodo_atual_fim: agora, teste_ate: agora, estorno_exclusao_em: agora, atualizado_em: agora }
    : { cancelar_no_fim_do_periodo: true, atualizado_em: agora }).eq('user_id', userId);
  if (error) throw new Error('PLANO_NAO_ATUALIZADO');
  return estornar;
}
