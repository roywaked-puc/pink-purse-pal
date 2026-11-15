import { z } from 'npm:zod@3';
import { banco, stripe, resposta, autenticar, origem, preco } from '../_shared/assinaturas.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return resposta({});
  if (req.method !== 'POST') return resposta({ error: 'Método não permitido.' }, 405);
  const user = await autenticar(req);
  if (!user) return resposta({ error: 'Entre novamente para assinar.' }, 401);
  try {
    const parsed = z.object({ periodicidade: z.enum(['mensal', 'anual']) }).strict().safeParse(await req.json());
    if (!parsed.success) return resposta({ error: 'Escolha mensal ou anual.' }, 400);
    const origin = origem(req);
    const db = banco();
    const api = stripe();
    const p = await preco(parsed.data.periodicidade);
    const { data: a, error } = await db.from('assinaturas').select('*').eq('user_id', user.id).single();
    if (error || !a) throw new Error('ASSINATURA_AUSENTE');
    if (a.isento) return resposta({ error: 'Sua conta já possui acesso isento.' }, 409);
    let customer = a.stripe_customer_id;
    if (!customer) {
      const criado = await api.customers.create({ email: user.email, metadata: { user_id: user.id, app: 'belafy' } }, { idempotencyKey: `belafy-customer-${user.id}` });
      const { data: salvo, error: erroSalvar } = await db.from('assinaturas').update({ stripe_customer_id: criado.id, atualizado_em: new Date().toISOString() }).eq('user_id', user.id).select('stripe_customer_id').single();
      if (erroSalvar || salvo?.stripe_customer_id !== criado.id) throw new Error('CUSTOMER_NAO_SALVO');
      customer = criado.id;
    }
    const assinaturas = await api.subscriptions.list({ customer, status: 'all', limit: 100 });
    if (assinaturas.data.some(s => !['canceled', 'incomplete_expired'].includes(s.status))) return resposta({ error: 'Já existe uma assinatura. Use Gerenciar assinatura.' }, 409);
    const abertas = await api.checkout.sessions.list({ customer, status: 'open', limit: 100 });
    const aberta = abertas.data.find(s => s.metadata?.app === 'belafy' && s.metadata?.periodicidade === parsed.data.periodicidade && s.metadata?.origem === origin);
    if (aberta?.url) return resposta({ url: aberta.url });
    for (const s of abertas.data.filter(s => s.metadata?.app === 'belafy')) await api.checkout.sessions.expire(s.id);
    // Old terminated subscriptions must not prevent a new paid subscription from being bound.
    if (a.stripe_subscription_id) {
      const { error: resetError } = await db.from('assinaturas').update({ stripe_subscription_id: null, plano: 'sem_plano', status: 'sem_assinatura' }).eq('user_id', user.id);
      if (resetError) throw new Error('ASSINATURA_NAO_ATUALIZADA');
    }
    const session = await api.checkout.sessions.create({
      customer, client_reference_id: user.id, mode: 'subscription', locale: 'pt-BR',
      line_items: [{ price: p.id, quantity: 1 }],
      subscription_data: { metadata: { user_id: user.id, app: 'belafy' }, billing_mode: { type: 'flexible' } },
      metadata: { user_id: user.id, app: 'belafy', periodicidade: parsed.data.periodicidade, origem: origin },
      success_url: `${origin}/configuracoes?abrir=meu-plano&checkout=sucesso`,
      cancel_url: `${origin}/configuracoes?abrir=meu-plano&checkout=cancelado`,
    }, { idempotencyKey: `belafy-checkout-${user.id}-${parsed.data.periodicidade}-${Math.floor(Date.now() / 60000)}` });
    return resposta({ url: session.url });
  } catch (err) {
    console.error('criar-checkout-assinatura', err instanceof Error ? err.name : 'erro');
    return resposta({ error: 'Não foi possível abrir o pagamento. Tente novamente.' }, 500);
  }
});