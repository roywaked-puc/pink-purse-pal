import { z } from 'npm:zod@3';
import { banco, stripe, resposta, autenticar, origem } from '../_shared/assinaturas.ts';

// Cancela (ou desfaz o cancelamento de) a renovação da assinatura Pro.
// O acesso Pro continua até o fim do período já pago; o webhook confirma o estado.
Deno.serve(async req => {
  if (req.method === 'OPTIONS') return resposta({});
  if (req.method !== 'POST') return resposta({ error: 'Método não permitido.' }, 405);
  const user = await autenticar(req);
  if (!user) return resposta({ error: 'Entre novamente para gerenciar sua assinatura.' }, 401);
  try {
    origem(req);
    const parsed = z.object({ acao: z.enum(['cancelar', 'desfazer']) }).strict().safeParse(await req.json());
    if (!parsed.success) return resposta({ error: 'Ação inválida.' }, 400);
    const cancelar = parsed.data.acao === 'cancelar';
    const db = banco();
    const { data: exclusao } = await db.from('contas_exclusao').select('id').eq('user_id', user.id).eq('status', 'agendada').maybeSingle();
    if (exclusao && !cancelar) return resposta({ error: 'Reative a conta antes de retomar a assinatura.' }, 409);
    const { data: a, error } = await db.from('assinaturas').select('stripe_subscription_id,isento').eq('user_id', user.id).single();
    if (error || !a) throw new Error('ASSINATURA_AUSENTE');
    if (a.isento || !a.stripe_subscription_id) return resposta({ error: 'Você não tem uma assinatura Pro para cancelar.' }, 400);
    const api = stripe();
    const s = await api.subscriptions.retrieve(a.stripe_subscription_id);
    if (s.metadata?.app !== 'belafy' || s.metadata?.user_id !== user.id) throw new Error('VINCULO_INVALIDO');
    if (['canceled', 'incomplete_expired'].includes(s.status)) return resposta({ error: 'Esta assinatura já foi encerrada.' }, 409);
    const atualizada = s.cancel_at_period_end === cancelar ? s : await api.subscriptions.update(s.id, { cancel_at_period_end: cancelar });
    // Reflete na hora para a tela; o webhook customer.subscription.updated confirma depois.
    await db.from('assinaturas').update({ cancelar_no_fim_do_periodo: atualizada.cancel_at_period_end, atualizado_em: new Date().toISOString() }).eq('user_id', user.id);
    return resposta({ cancelar_no_fim_do_periodo: atualizada.cancel_at_period_end });
  } catch (err) {
    console.error('cancelar-assinatura', err instanceof Error ? err.name : 'erro');
    return resposta({ error: 'Não foi possível atualizar sua assinatura. Tente novamente.' }, 500);
  }
});
