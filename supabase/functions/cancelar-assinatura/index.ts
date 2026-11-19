import { z } from 'npm:zod@3';
import { banco, stripe, autenticar, origem, resposta } from '../_shared/assinaturas.ts';
Deno.serve(async req => {
  if (req.method === 'OPTIONS') return resposta({});
  if (req.method !== 'POST') return resposta({ error: 'Método não permitido.' }, 405);
  const user = await autenticar(req);
  if (!user) return resposta({ error: 'Entre novamente para continuar.' }, 401);
  try {
    origem(req);
    const parsed = z.object({ acao: z.enum(['cancelar','desfazer']) }).strict().safeParse(await req.json());
    if (!parsed.success) return resposta({ error: 'Escolha cancelar ou desfazer.' }, 400);
    const db = banco();
    if (parsed.data.acao === 'desfazer') {
      const { data, error } = await db.from('contas_exclusao').select('id').eq('user_id',user.id).eq('status','agendada').maybeSingle();
      if (error) throw error;
      if (data) return resposta({ error: 'Reative sua conta antes de desfazer o cancelamento.' }, 409);
    }
    const { data: a, error } = await db.from('assinaturas').select('stripe_subscription_id,stripe_customer_id,isento').eq('user_id',user.id).single();
    if (error || !a?.stripe_subscription_id || a.isento) return resposta({ error: 'Não há assinatura para alterar.' }, 409);
    const api = stripe();
    const s = await api.subscriptions.retrieve(a.stripe_subscription_id);
    const customerId = typeof s.customer === 'string' ? s.customer : s.customer.id;
    if (s.metadata.app !== 'belafy' || s.metadata.user_id !== user.id || customerId !== a.stripe_customer_id) throw new Error('VINCULO_INVALIDO');
    if (!['active','past_due','trialing'].includes(s.status)) return resposta({ error: 'Essa assinatura já foi encerrada.' }, 409);
    const cancelar = parsed.data.acao === 'cancelar';
    await api.subscriptions.update(s.id,{ cancel_at_period_end: cancelar });
    const { data: salvo, error: erro } = await db.from('assinaturas').update({ cancelar_no_fim_do_periodo: cancelar, atualizado_em: new Date().toISOString() }).eq('user_id',user.id).select('cancelar_no_fim_do_periodo').single();
    if (erro || salvo?.cancelar_no_fim_do_periodo !== cancelar) throw new Error('NAO_SALVO');
    return resposta({ cancelar_no_fim_do_periodo: cancelar });
  } catch { return resposta({ error: 'Não foi possível alterar a assinatura. Tente novamente.' },500); }
});
