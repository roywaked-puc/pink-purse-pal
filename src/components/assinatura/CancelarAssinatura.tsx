import { useState } from 'react';
import { toast } from 'sonner';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel } from '@/components/ui/alert-dialog';
import { executarAcaoConta } from '@/hooks/useExclusaoConta';
import type { ResumoAssinatura } from '@/types';
export function CancelarAssinatura({ assinatura, atualizar }: { assinatura:ResumoAssinatura; atualizar:() => Promise<unknown> }) {
  const [open,setOpen] = useState(false);
  const alterar = useMutation({ mutationFn:(acao:'cancelar'|'desfazer') => executarAcaoConta('cancelar-assinatura',{ acao }),onSuccess:async () => { await atualizar(); setOpen(false); toast.success('Assinatura atualizada.'); },onError:e => toast.error(e.message) });
  const fim = assinatura.periodo_atual_fim ? new Date(assinatura.periodo_atual_fim).toLocaleDateString('pt-BR',{ timeZone:'America/Sao_Paulo' }) : 'o fim do período pago';
  if (assinatura.cancelar_no_fim_do_periodo) return <Button variant="outline" className="min-h-11" disabled={alterar.isPending} onClick={() => alterar.mutate('desfazer')}>Desfazer cancelamento</Button>;
  return <>
    <Button variant="ghost" className="min-h-11 text-destructive" onClick={() => setOpen(true)}>Cancelar assinatura</Button>
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent>
        <AlertDialogHeader><AlertDialogTitle>Cancelar assinatura?</AlertDialogTitle><AlertDialogDescription>A renovação automática será desligada. Você continua com o Pro até {fim}; depois disso não será possível criar novos agendamentos. Seus dados não são apagados, e você pode desfazer o cancelamento até lá. Este cancelamento não gera estorno.</AlertDialogDescription></AlertDialogHeader>
        <AlertDialogFooter><AlertDialogCancel className="min-h-11" disabled={alterar.isPending}>Manter assinatura</AlertDialogCancel><Button variant="destructive" className="min-h-11" disabled={alterar.isPending} onClick={() => alterar.mutate('cancelar')}>{alterar.isPending ? 'Cancelando...' : 'Confirmar cancelamento'}</Button></AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </>;
}
