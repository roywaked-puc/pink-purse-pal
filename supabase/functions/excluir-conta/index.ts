import { z } from 'npm:zod@3';
import { banco, resposta, autenticar, origem, encerrarCobranca } from '../_shared/assinaturas.ts';

const PRAZO_DIAS = 30;
const corpo = z.discriminatedUnion('acao', [
  z.object({ acao: z.literal('solicitar'), confirmacao: z.literal('EXCLUIR') }).strict(),
  z.object({ acao: z.literal('reativar') }).strict(),
]);

// solicitar: encerra a cobrança e agenda a exclusão para daqui a 30 dias.
// reativar: desiste da exclusão dentro do prazo.
// A exclusão definitiva é feita pela função purgar-contas-excluidas.
Deno.serve(async req => {
  if (req.method === 'OPTIONS') return resposta({});
  if (req.method !== 'POST') return resposta({ error: 'Método não permitido.' }, 405);
  const user = await autenticar(req);
  if (!user) return resposta({ error: 'Entre novamente para continuar.' }, 401);
  try {
    origem(req);
    const parsed = corpo.safeParse(await req.json());
    if (!parsed.success) return resposta({ error: 'Digite EXCLUIR para confirmar.' }, 400);
    const db = banco();
    const { data: pendente, error: erroPendente } = await db.from('contas_exclusao').select('id,excluir_apos,reembolsado').eq('user_id', user.id).eq('status', 'agendada').maybeSingle();
    if (erroPendente) throw erroPendente;

    if (parsed.data.acao === 'reativar') {
      if (!pendente) return resposta({ error: 'Não há exclusão agendada para esta conta.' }, 404);
      if (new Date(pendente.excluir_apos).getTime() <= Date.now()) return resposta({ error: 'O prazo para desistir terminou.' }, 409);
      const { error } = await db.from('contas_exclusao').update({ status: 'cancelada', cancelada_em: new Date().toISOString() }).eq('id', pendente.id).eq('status', 'agendada');
      if (error) throw error;
      return resposta({ reativada: true });
    }

    if (pendente) return resposta({ excluir_apos: pendente.excluir_apos, reembolsado: pendente.reembolsado });
    const { data: a, error: erroAssinatura } = await db.from('assinaturas').select('stripe_customer_id').eq('user_id', user.id).maybeSingle();
    if (erroAssinatura) throw erroAssinatura;
    let reembolsado = false;
    // Cobrança primeiro: se o Stripe falhar, nada é agendado e ela pode tentar de novo.
    if (a?.stripe_customer_id) {
      reembolsado = (await encerrarCobranca(a.stripe_customer_id, user.id, 'fim_do_periodo')).reembolsado;
      const agora = new Date().toISOString();
      await db.from('assinaturas').update(reembolsado
        ? { status: 'canceled', cancelar_no_fim_do_periodo: false, periodo_atual_fim: agora, atualizado_em: agora }
        : { cancelar_no_fim_do_periodo: true, atualizado_em: agora }).eq('user_id', user.id);
    }
    const excluirApos = new Date(Date.now() + PRAZO_DIAS * 86400000).toISOString();
    const { error } = await db.from('contas_exclusao').insert({ user_id: user.id, email: user.email, stripe_customer_id: a?.stripe_customer_id ?? null, reembolsado, excluir_apos: excluirApos });
    if (error) throw error;
    return resposta({ excluir_apos: excluirApos, reembolsado });
  } catch (err) {
    console.error('excluir-conta', err instanceof Error ? err.name : 'erro');
    return resposta({ error: 'Não foi possível concluir o pedido. Nada foi excluído. Tente novamente.' }, 500);
  }
});
