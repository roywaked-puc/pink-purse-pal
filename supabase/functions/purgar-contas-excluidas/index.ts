import { banco, resposta, encerrarCobranca, segredoConfere } from '../_shared/assinaturas.ts';

// Executada por agendamento (1x por dia). Apaga de vez as contas cujo prazo de
// 30 dias para desistir terminou. Protegida pelo segredo PURGA_CONTAS_SEGREDO,
// enviado no cabeçalho x-purga-segredo. Cada etapa é repetível: se algo falhar,
// a conta continua 'agendada' e é tentada de novo na próxima execução.
type Db = ReturnType<typeof banco>;

async function apagarPasta(db: Db, bucket: string, prefixo: string): Promise<void> {
  for (;;) {
    const { data, error } = await db.storage.from(bucket).list(prefixo, { limit: 1000 });
    if (error) throw new Error('STORAGE_LISTAR');
    if (!data?.length) return;
    const arquivos = data.filter(i => i.id).map(i => `${prefixo}/${i.name}`);
    for (const pasta of data.filter(i => !i.id)) await apagarPasta(db, bucket, `${prefixo}/${pasta.name}`);
    if (!arquivos.length) return;
    const { error: erroRemover } = await db.storage.from(bucket).remove(arquivos);
    if (erroRemover) throw new Error('STORAGE_REMOVER');
  }
}

Deno.serve(async req => {
  if (req.method !== 'POST') return resposta({ error: 'Método não permitido.' }, 405);
  const segredo = Deno.env.get('PURGA_CONTAS_SEGREDO');
  if (!segredo) return resposta({ error: 'Purga não configurada.' }, 503);
  if (!segredoConfere(req.headers.get('x-purga-segredo'), segredo)) return resposta({ error: 'Não autorizado.' }, 401);
  const db = banco();
  const { data: vencidas, error } = await db.from('contas_exclusao').select('id,user_id,stripe_customer_id')
    .eq('status', 'agendada').lte('excluir_apos', new Date().toISOString()).order('excluir_apos').limit(20);
  if (error) return resposta({ error: 'Não foi possível listar as contas.' }, 500);
  let concluidas = 0;
  const { data: buckets } = await db.storage.listBuckets();
  for (const c of vencidas ?? []) {
    try {
      if (c.stripe_customer_id) await encerrarCobranca(c.stripe_customer_id, c.user_id, 'imediato');
      const { error: erroPurga } = await db.rpc('purgar_dados_conta', { p_user_id: c.user_id });
      if (erroPurga) throw new Error(erroPurga.message?.startsWith('PURGA_INCOMPLETA') ? erroPurga.message.slice(0, 200) : 'PURGA_BANCO');
      for (const b of buckets ?? []) await apagarPasta(db, b.id, c.user_id);
      const { error: erroAuth } = await db.auth.admin.deleteUser(c.user_id);
      if (erroAuth && erroAuth.status !== 404) throw new Error('AUTH_EXCLUIR');
      await db.from('contas_exclusao').update({ status: 'concluida', concluida_em: new Date().toISOString(), email: null, ultimo_erro: null }).eq('id', c.id);
      concluidas++;
    } catch (err) {
      const motivo = err instanceof Error ? err.message.slice(0, 200) : 'erro';
      console.error('purgar-contas-excluidas', c.id, motivo);
      await db.from('contas_exclusao').update({ ultimo_erro: motivo }).eq('id', c.id);
    }
  }
  return resposta({ processadas: vencidas?.length ?? 0, concluidas });
});
