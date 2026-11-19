import { authenticateCronRequest } from '../_shared/cron-auth.ts';
import { resposta } from '../_shared/assinaturas.ts';
// Managed scheduling keeps its credential out of SQL and source; this adapter supplies the separate purge-only secret.
Deno.serve(async req => {
  if (req.method !== 'POST') return resposta({ error:'Método não permitido.' },405);
  const rejeicao = authenticateCronRequest(req);
  if (rejeicao) return resposta({ error:'Acesso não autorizado.' },rejeicao.status);
  const secret = Deno.env.get('PURGA_CONTAS_SEGREDO');
  const url = Deno.env.get('SUPABASE_URL');
  if (!secret || !url) return resposta({ error:'Rotina indisponível.' },503);
  try {
    const result = await fetch(`${url}/functions/v1/purgar-contas-excluidas`,{ method:'POST', headers:{ 'x-purga-segredo':secret,'Content-Type':'application/json' },body:'{}' });
    return resposta(await result.json(),result.status);
  } catch { return resposta({ error:'Rotina indisponível.' },500); }
});
