import { z } from 'npm:zod@3';
import { banco, autenticar, origem, resposta } from '../_shared/assinaturas.ts';
import { encerrarCobranca } from '../_shared/exclusao-stripe.ts';
const esquema = z.discriminatedUnion('acao', [z.object({ acao: z.literal('solicitar'), confirmacao: z.literal('EXCLUIR') }).strict(), z.object({ acao: z.literal('reativar') }).strict()]);
Deno.serve(async req => {
  if (req.method === 'OPTIONS') return resposta({});
  if (req.method !== 'POST') return resposta({ error: 'Método não permitido.' },405);
  const user = await autenticar(req);
  if (!user) return resposta({ error: 'Entre novamente para continuar.' },401);
  try {
    origem(req);
    const parsed = esquema.safeParse(await req.json());
    if (!parsed.success) return resposta({ error: 'Confirme digitando EXCLUIR.' },400);
    const db = banco();
    if (parsed.data.acao === 'reativar') {
      const { data, error } = await db.rpc('reativar_conta_exclusao',{ p_user_id: user.id });
      if (error) throw error;
      if (!data) return resposta({ error: 'O prazo de reativação terminou.' },409);
      return resposta({ reativada: true });
    }
    const { data: existente, error: erroBusca } = await db.from('contas_exclusao').select('solicitado_em,excluir_apos,reembolsado').eq('user_id',user.id).eq('status','agendada').maybeSingle();
    if (erroBusca) throw erroBusca;
    if (existente) return resposta(existente);
    const { data: a, error } = await db.from('assinaturas').select('stripe_customer_id').eq('user_id',user.id).maybeSingle();
    if (error) throw error;
    const reembolsado = await encerrarCobranca(user.id,a?.stripe_customer_id ?? null,true);
    const { data: salvo, error: erroSalvar } = await db.from('contas_exclusao').insert({ user_id: user.id, email: user.email ?? null, stripe_customer_id: a?.stripe_customer_id ?? null, reembolsado }).select('solicitado_em,excluir_apos,reembolsado').single();
    if (erroSalvar?.code === '23505') {
      const { data: repetido, error: e } = await db.from('contas_exclusao').select('solicitado_em,excluir_apos,reembolsado').eq('user_id',user.id).eq('status','agendada').single();
      if (e) throw e;
      return resposta(repetido);
    }
    if (erroSalvar || !salvo) throw new Error('NAO_AGENDADA');
    return resposta(salvo);
  } catch { return resposta({ error: 'Nada foi excluído. Tente novamente.' },500); }
});
