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