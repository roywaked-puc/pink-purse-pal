import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { useApp } from '@/contexts/AppContext';
import { useGerenciarAssinatura } from '@/hooks/useAssinatura';
import { diasRestantesTeste } from '@/lib/assinatura';
import { PaywallAssinatura } from './PaywallAssinatura';
import { CancelarAssinatura } from './CancelarAssinatura';
import { podeCancelarPro } from '../../../supabase/functions/_shared/exclusao-regras';

const dataBr = (data: string) => new Date(data).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
export function MeuPlano() {
  const { assinatura, assinaturaCarregando, atualizarAssinatura } = useApp();
  const [open, setOpen] = useState(false);
  const [params, setParams] = useSearchParams();
  const retorno = params.get('checkout');
  const portal = useGerenciarAssinatura();
  useEffect(() => {
    if (retorno !== 'sucesso') return;
    const interval = setInterval(() => { void atualizarAssinatura(); }, 3000);
    const timeout = setTimeout(() => clearInterval(interval), 90000);
    return () => { clearInterval(interval); clearTimeout(timeout); };
  }, [retorno, atualizarAssinatura]);
  useEffect(() => {
    if (retorno === 'sucesso' && assinatura?.estado === 'pro') {
      toast.success('Pagamento confirmado. Seu Pro está ativo!');
      const next = new URLSearchParams(params); next.delete('checkout'); setParams(next, { replace: true });
    }
  }, [retorno, assinatura?.estado, params, setParams]);
  if (assinaturaCarregando) return <p className="text-sm text-muted-foreground">Carregando seu plano...</p>;
  if (!assinatura) return <div><p>Não foi possível carregar seu plano.</p><Button variant="outline" onClick={() => void atualizarAssinatura()}>Tentar novamente</Button></div>;
  const titulo = assinatura.estado === 'isento' ? 'Pro isento' : assinatura.estado === 'teste' ? `${diasRestantesTeste(assinatura.teste_ate)} dias restantes de teste` : assinatura.estado === 'pro' ? `Pro ativo${assinatura.periodo_atual_fim ? ` até ${dataBr(assinatura.periodo_atual_fim)}` : ''}` : 'Teste encerrado';
  return <div className="space-y-3">
    <p className="font-semibold">{titulo}</p>
    {assinatura.estado === 'isento' && <p className="text-sm text-muted-foreground">Acesso completo sem cobrança.</p>}
    {assinatura.cancelar_no_fim_do_periodo && <p className="text-sm text-muted-foreground">Cancelamento agendado para o fim do período pago.</p>}
    {retorno === 'sucesso' && assinatura.estado !== 'pro' && <p role="status" className="text-sm text-muted-foreground">Aguardando confirmação do pagamento. O plano será atualizado automaticamente.</p>}
    {retorno === 'cancelado' && <p className="text-sm text-muted-foreground">Pagamento não concluído. Seu plano não foi alterado.</p>}
    {!['isento','pro'].includes(assinatura.estado) && <Button className="min-h-11" onClick={() => setOpen(true)}>Assinar Pro</Button>}
    {podeCancelarPro(assinatura.estado,assinatura.status) && <CancelarAssinatura assinatura={assinatura} atualizar={atualizarAssinatura} />}
    {assinatura.tem_customer && <Button variant="outline" className="min-h-11 ml-2" disabled={portal.isPending} onClick={() => portal.mutate(undefined, { onError: e => toast.error(e.message) })}>Gerenciar assinatura</Button>}
    <PaywallAssinatura open={open} onOpenChange={setOpen} />
  </div>;
}