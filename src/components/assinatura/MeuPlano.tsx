import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { useApp } from '@/contexts/AppContext';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useCancelarAssinatura, useGerenciarAssinatura } from '@/hooks/useAssinatura';
import { diasRestantesTeste } from '@/lib/assinatura';
import { PaywallAssinatura } from './PaywallAssinatura';

const dataBr = (data: string) => new Date(data).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
export function MeuPlano() {
  const { assinatura, assinaturaCarregando, atualizarAssinatura } = useApp();
  const [open, setOpen] = useState(false);
  const [params, setParams] = useSearchParams();
  const retorno = params.get('checkout');
  const portal = useGerenciarAssinatura();
  const cancelamento = useCancelarAssinatura();
  const [confirmarCancelamento, setConfirmarCancelamento] = useState(false);
  const alterarRenovacao = (acao: 'cancelar' | 'desfazer') => cancelamento.mutate(acao, {
    onSuccess: () => { setConfirmarCancelamento(false); toast.success(acao === 'cancelar' ? 'Assinatura cancelada. Seu Pro continua até o fim do período pago.' : 'Cancelamento desfeito. Sua assinatura segue normalmente.'); },
    onError: e => toast.error(e.message),
  });
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
  const assinaturaViva = assinatura.estado === 'pro' && ['active', 'past_due', 'trialing'].includes(assinatura.status);
  const fimPeriodo = assinatura.periodo_atual_fim ? dataBr(assinatura.periodo_atual_fim) : 'o fim do período pago';
  return <div className="space-y-3">
    <p className="font-semibold">{titulo}</p>
    {assinatura.estado === 'isento' && <p className="text-sm text-muted-foreground">Acesso completo sem cobrança.</p>}
    {assinatura.cancelar_no_fim_do_periodo && <p className="text-sm text-muted-foreground">Cancelamento agendado para o fim do período pago.</p>}
    {retorno === 'sucesso' && assinatura.estado !== 'pro' && <p role="status" className="text-sm text-muted-foreground">Aguardando confirmação do pagamento. O plano será atualizado automaticamente.</p>}
    {retorno === 'cancelado' && <p className="text-sm text-muted-foreground">Pagamento não concluído. Seu plano não foi alterado.</p>}
    {assinatura.estado !== 'isento' && !assinaturaViva && <Button className="min-h-11" onClick={() => setOpen(true)}>Assinar Pro</Button>}
    {assinatura.tem_customer && <Button variant="outline" className="min-h-11 ml-2" disabled={portal.isPending} onClick={() => portal.mutate(undefined, { onError: e => toast.error(e.message) })}>Gerenciar assinatura</Button>}
    {assinaturaViva && (assinatura.cancelar_no_fim_do_periodo
      ? <Button variant="outline" className="min-h-11 w-full" disabled={cancelamento.isPending} onClick={() => alterarRenovacao('desfazer')}>Desfazer cancelamento</Button>
      : <Button variant="ghost" className="min-h-11 w-full text-destructive hover:text-destructive" onClick={() => setConfirmarCancelamento(true)}>Cancelar assinatura</Button>)}
    <AlertDialog open={confirmarCancelamento} onOpenChange={setConfirmarCancelamento}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Cancelar assinatura Pro?</AlertDialogTitle>
          <AlertDialogDescription>A renovação automática será desligada. Você continua com o Pro até {fimPeriodo}; depois disso não será possível criar novos agendamentos. Seus dados não são apagados, e você pode desfazer o cancelamento até lá.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={cancelamento.isPending}>Manter assinatura</AlertDialogCancel>
          <AlertDialogAction disabled={cancelamento.isPending} className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={e => { e.preventDefault(); alterarRenovacao('cancelar'); }}>Cancelar assinatura</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    <PaywallAssinatura open={open} onOpenChange={setOpen} />
  </div>;
}