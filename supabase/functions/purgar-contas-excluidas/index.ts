import { createHash, timingSafeEqual } from 'node:crypto';
import { banco, resposta } from '../_shared/assinaturas.ts';
import { encerrarCobranca } from '../_shared/exclusao-stripe.ts';
async function apagarPasta(bucket: string, prefix: string) {
  const storage = banco().storage.from(bucket);
  // Always start at offset zero as each batch is removed; recursively visit folders.
  while (true) {
    const { data, error } = await storage.list(prefix,{ limit:100, offset:0 });
    if (error) throw error;
    if (!data?.length) return;
    const arquivos: string[] = [];
    for (const item of data) {
      const path = `${prefix}/${item.name}`;
      if (item.id) arquivos.push(path); else await apagarPasta(bucket,path);
    }
    if (arquivos.length) { const { error: e } = await storage.remove(arquivos); if (e) throw e; }
    // Empty virtual folders disappear after their final object is removed.
  }
}
Deno.serve(async req => {
  if (req.method !== 'POST') return resposta({ error: 'Método não permitido.' },405);
  const secret = Deno.env.get('PURGA_CONTAS_SEGREDO');
  const provided = req.headers.get('x-purga-segredo') ?? '';
  const digest = (s: string) => createHash('sha256').update(s).digest();
  if (!secret || !timingSafeEqual(digest(provided),digest(secret))) return resposta({ error: 'Acesso não autorizado.' },401);
  try {
    const db = banco();
    const { data: pedidos, error } = await db.from('contas_exclusao').select('id,user_id,stripe_customer_id').eq('status','agendada').lte('excluir_apos',new Date().toISOString()).order('excluir_apos').limit(50);
    if (error) throw error;
    let concluidas = 0;
    for (const pedido of pedidos ?? []) {
      try {
        await encerrarCobranca(pedido.user_id,pedido.stripe_customer_id,false);
        const { error: e } = await db.rpc('purgar_dados_conta',{ p_user_id:pedido.user_id });
        if (e) throw e;
        const { data: buckets, error: b } = await db.storage.listBuckets();
        if (b) throw b;
        for (const bucket of buckets ?? []) await apagarPasta(bucket.id,pedido.user_id);
        const { error: u } = await db.auth.admin.deleteUser(pedido.user_id);
        // A retry after successful auth deletion can safely finish the request.
        if (u && u.code !== 'user_not_found' && u.status !== 404) throw u;
        const { error: c } = await db.from('contas_exclusao').update({ status:'concluida', concluida_em:new Date().toISOString(), email:null, ultimo_erro:null }).eq('id',pedido.id).eq('status','agendada');
        if (c) throw c;
        concluidas++;
      } catch {
        await db.from('contas_exclusao').update({ ultimo_erro:'Não foi possível concluir a exclusão. Nova tentativa na próxima execução.' }).eq('id',pedido.id);
      }
    }
    return resposta({ concluidas });
  } catch { return resposta({ error:'Não foi possível executar as exclusões.' },500); }
});
