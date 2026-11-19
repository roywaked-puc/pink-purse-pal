import Stripe from 'npm:stripe@23.1.0';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

export { corsHeaders };
export const banco = () => createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '', { auth: { persistSession: false } });
export const stripe = () => new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '');
export const resposta = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
export async function autenticar(req: Request) {
  const token = req.headers.get('Authorization')?.replace(/^Bearer\s+/i, '');
  if (!token) return null;
  const { data, error } = await banco().auth.getUser(token);
  return error ? null : data.user;
}
export function origem(req: Request) {
  const origin = req.headers.get('origin');
  const permitidas = ['http://localhost:8080', 'https://app.belafy.com.br', 'https://pink-purse-pal.lovable.app', 'https://id-preview--4fe47bd7-5174-4e32-962b-5d239f25105c.lovable.app'];
  if (!origin || !permitidas.includes(origin)) throw new Error('ORIGEM_INVALIDA');
  return origin;
}
export async function preco(periodicidade: 'mensal' | 'anual') {
  const id = Deno.env.get(periodicidade === 'mensal' ? 'STRIPE_PRICE_MENSAL_ID' : 'STRIPE_PRICE_ANUAL_ID');
  if (!id) throw new Error('PRECO_NAO_CONFIGURADO');
  const p = await stripe().prices.retrieve(id);
  const live = Deno.env.get('STRIPE_AMBIENTE') === 'live';
  if (!p.active || p.livemode !== live || p.currency !== 'brl' || p.unit_amount !== (periodicidade === 'mensal' ? 3990 : 35900) || p.recurring?.interval !== (periodicidade === 'mensal' ? 'month' : 'year') || p.recurring.interval_count !== 1) throw new Error('PRECO_INVALIDO');
  return p;
}
const ENCERRADAS = ['canceled', 'incomplete_expired'];
const SETE_DIAS = 7 * 86400000;

/** Assinaturas Belafy ainda vivas (não canceladas) de um cliente Stripe. */
export async function assinaturasAtivas(customer: string) {
  const lista = await stripe().subscriptions.list({ customer, status: 'all', limit: 100 });
  return lista.data.filter(s => s.metadata?.app === 'belafy' && !ENCERRADAS.includes(s.status));
}

/**
 * Encerra a cobrança de uma conta que pediu exclusão.
 * - Dentro de 7 dias da primeira cobrança paga (arrependimento, CDC art. 49 / Termos):
 *   estorna o que foi pago e cancela na hora.
 * - Fora disso, `modo: 'fim_do_periodo'` só desliga a renovação; `modo: 'imediato'`
 *   (usado na purga) cancela na hora, sem estorno.
 * Idempotente: pode ser chamada de novo após uma falha parcial.
 */
export async function encerrarCobranca(customer: string, userId: string, modo: 'fim_do_periodo' | 'imediato') {
  const api = stripe();
  const ativas = await assinaturasAtivas(customer);
  const pagas = (await api.invoices.list({ customer, status: 'paid', limit: 100 })).data
    .filter(f => f.amount_paid > 0)
    .sort((a, b) => (a.status_transitions.paid_at ?? a.created) - (b.status_transitions.paid_at ?? b.created));
  const primeira = pagas[0];
  const elegivel = modo === 'fim_do_periodo' && !!primeira && Date.now() - (primeira.status_transitions.paid_at ?? primeira.created) * 1000 <= SETE_DIAS;
  if (elegivel) {
    for (const fatura of pagas) {
      const pagamentos = await api.invoicePayments.list({ invoice: fatura.id!, limit: 10 });
      for (const p of pagamentos.data) {
        if (p.status !== 'paid' || p.payment.type !== 'payment_intent' || !p.payment.payment_intent) continue;
        const pi = typeof p.payment.payment_intent === 'string' ? p.payment.payment_intent : p.payment.payment_intent.id;
        await api.refunds.create({ payment_intent: pi, reason: 'requested_by_customer', metadata: { app: 'belafy', user_id: userId, motivo: 'exclusao_conta_arrependimento' } }, { idempotencyKey: `belafy-reembolso-${pi}` });
      }
    }
  }
  for (const s of ativas) {
    if (elegivel || modo === 'imediato') await api.subscriptions.cancel(s.id, {}, { idempotencyKey: `belafy-cancelar-${s.id}` });
    else if (!s.cancel_at_period_end) await api.subscriptions.update(s.id, { cancel_at_period_end: true });
  }
  return { reembolsado: elegivel && pagas.length > 0 };
}

/** Comparação de segredo em tempo constante. */
export function segredoConfere(recebido: string | null, esperado: string) {
  if (!recebido) return false;
  const a = new TextEncoder().encode(recebido);
  const b = new TextEncoder().encode(esperado);
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}
