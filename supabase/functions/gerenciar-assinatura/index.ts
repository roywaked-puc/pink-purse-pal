import { banco, stripe, resposta, autenticar, origem } from '../_shared/assinaturas.ts';
Deno.serve(async req => {
  if (req.method === 'OPTIONS') return resposta({});
  if (req.method !== 'POST') return resposta({ error: 'Método não permitido.' }, 405);
  const user = await autenticar(req);
  if (!user) return resposta({ error: 'Entre novamente para gerenciar sua assinatura.' }, 401);
  try {
    const origin = origem(req);
    const { data, error } = await banco().from('assinaturas').select('stripe_customer_id').eq('user_id', user.id).single();
    if (error || !data?.stripe_customer_id) return resposta({ error: 'Sua conta ainda não possui uma assinatura Stripe.' }, 400);
    const session = await stripe().billingPortal.sessions.create({ customer: data.stripe_customer_id, return_url: `${origin}/configuracoes?abrir=meu-plano` });
    return resposta({ url: session.url });
  } catch {
    return resposta({ error: 'Não foi possível abrir o gerenciamento da assinatura.' }, 500);
  }
});