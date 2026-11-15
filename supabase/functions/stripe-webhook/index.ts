import Stripe from 'npm:stripe@23.1.0';
import { banco, stripe, resposta } from '../_shared/assinaturas.ts';

const eventos = new Set(['checkout.session.completed', 'customer.subscription.updated', 'customer.subscription.deleted', 'invoice.paid', 'invoice.payment_failed']);
Deno.serve(async req => {
  if (req.method === 'OPTIONS') return resposta({});
  if (req.method !== 'POST') return resposta({ error: 'Método não permitido.' }, 405);
  const secret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
  const assinatura = req.headers.get('stripe-signature');
  if (!secret) return resposta({ error: 'Webhook ainda não configurado.' }, 503);
  if (!assinatura) return resposta({ error: 'Assinatura inválida.' }, 400);
  const api = stripe();
  let event: Stripe.Event;
  try { event = await api.webhooks.constructEventAsync(await req.text(), assinatura, secret); }
  catch { return resposta({ error: 'Assinatura inválida.' }, 400); }
  const live = Deno.env.get('STRIPE_AMBIENTE') === 'live';
  if (event.livemode !== live) return resposta({ error: 'Ambiente inválido.' }, 400);
  if (!eventos.has(event.type)) return resposta({ recebido: true });
  try {
    const db = banco();
    const { data: anterior, error: erroAnterior } = await db.from('eventos_stripe').select('evento_id').eq('evento_id', event.id).maybeSingle();
    if (erroAnterior) throw erroAnterior;
    if (anterior) return resposta({ recebido: true, duplicado: true });
    let subscriptionId: string | undefined;
    let customerId: string | undefined;
    let fatura: Stripe.Invoice | undefined;
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.metadata?.app !== 'belafy') return resposta({ recebido: true });
      subscriptionId = typeof session.subscription === 'string' ? session.subscription : session.subscription?.id;
      customerId = typeof session.customer === 'string' ? session.customer : session.customer?.id;
    } else if (event.type.startsWith('invoice.')) {
      fatura = await api.invoices.retrieve((event.data.object as Stripe.Invoice).id);
      subscriptionId = typeof fatura.parent?.subscription_details?.subscription === 'string' ? fatura.parent.subscription_details.subscription : fatura.parent?.subscription_details?.subscription?.id;
      customerId = typeof fatura.customer === 'string' ? fatura.customer : fatura.customer?.id;
    } else {
      const s = event.data.object as Stripe.Subscription;
      subscriptionId = s.id;
      customerId = typeof s.customer === 'string' ? s.customer : s.customer.id;
    }
    if (!subscriptionId || !customerId) return resposta({ recebido: true });
    const s = await api.subscriptions.retrieve(subscriptionId);
    if (s.metadata.app !== 'belafy') return resposta({ recebido: true });
    const userId = s.metadata.user_id;
    if (!userId || !/^[0-9a-f-]{36}$/i.test(userId)) throw new Error('USUARIO_INVALIDO');
    const customer = await api.customers.retrieve(customerId);
    if (customer.deleted || customer.metadata.user_id !== userId) throw new Error('CUSTOMER_INVALIDO');
    const { data: a, error } = await db.from('assinaturas').select('stripe_customer_id,stripe_subscription_id').eq('user_id', userId).single();
    if (error || a?.stripe_customer_id !== customerId) throw new Error('VINCULO_INVALIDO');
    const p = s.items.data[0]?.price;
    const mensal = Deno.env.get('STRIPE_PRICE_MENSAL_ID');
    const anual = Deno.env.get('STRIPE_PRICE_ANUAL_ID');
    if (!p || ![mensal, anual].includes(p.id)) throw new Error('PRECO_INVALIDO');
    const pago = event.type === 'invoice.paid' && fatura?.status === 'paid' && fatura.amount_paid > 0;
    // Only invoice.paid can extend the paid entitlement, never Checkout completion.
    const fim = pago ? Math.max(...(fatura?.lines.data.filter(l => l.price?.id === p.id || l.pricing?.price_details?.price === p.id).map(l => l.period.end) ?? []), 0) : 0;
    if (pago && !fim) throw new Error('PERIODO_INVALIDO');
    const { error: erroAplicar } = await db.rpc('aplicar_evento_stripe', {
      p_evento_id: event.id, p_tipo: event.type, p_modo: live ? 'live' : 'sandbox', p_ocorrido_em: new Date(event.created * 1000).toISOString(),
      p_user_id: userId, p_customer: customerId, p_subscription: s.id, p_status: s.status,
      p_periodicidade: p.id === mensal ? 'mensal' : 'anual', p_fim: fim ? new Date(fim * 1000).toISOString() : null,
      p_cancelar: s.cancel_at_period_end, p_pago: pago,
    });
    if (erroAplicar) throw erroAplicar;
    return resposta({ recebido: true });
  } catch (err) {
    console.error('stripe-webhook', err instanceof Error ? err.name : 'erro');
    return resposta({ error: 'Não foi possível processar o evento. Tente novamente.' }, 500);
  }
});