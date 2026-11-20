import { banco } from './assinaturas.ts';
export async function iniciarAcaoConta(userId: string) {
  const token = crypto.randomUUID();
  const { data,error } = await banco().rpc('iniciar_acao_conta',{ p_user_id:userId,p_token:token });
  if (error || !data) throw new Error('ACAO_EM_ANDAMENTO');
  return token;
}
export async function finalizarAcaoConta(userId: string, token: string | null) {
  if (token) await banco().rpc('finalizar_acao_conta',{ p_user_id:userId,p_token:token });
}
export async function bloquearExclusaoPendente(userId: string) {
  const { data,error } = await banco().from('contas_exclusao').select('id').eq('user_id',userId).eq('status','agendada').maybeSingle();
  if (error || data) throw new Error('EXCLUSAO_PENDENTE');
}
