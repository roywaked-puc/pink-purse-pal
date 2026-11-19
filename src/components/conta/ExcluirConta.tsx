import { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel } from '@/components/ui/alert-dialog';
import { useAlterarExclusaoConta } from '@/hooks/useExclusaoConta';
export function ExcluirConta() {
  const [open,setOpen] = useState(false);
  const [confirmacao,setConfirmacao] = useState('');
  const excluir = useAlterarExclusaoConta();
  return <section className="border-t pt-4">
    <Button variant="ghost" className="min-h-11 text-destructive" onClick={() => { setConfirmacao(''); setOpen(true); }}><Trash2 className="mr-2 h-4 w-4" />Excluir minha conta</Button>
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent className="max-h-[90dvh] overflow-y-auto">
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir minha conta</AlertDialogTitle>
          <AlertDialogDescription>Você terá 30 dias para desistir entrando novamente e reativando sua conta. Depois, apagaremos de vez clientes, agenda, movimentações, fotos, fichas de anamnese (inclusive assinadas), configurações e seu login.</AlertDialogDescription>
        </AlertDialogHeader>
        <p className="text-sm text-muted-foreground">A cobrança da assinatura será encerrada agora. Se a primeira contratação paga foi há até 7 dias, o valor pago será estornado automaticamente e o Pro encerrado imediatamente. Fora desse prazo, desligamos a renovação, sem estorno.</p>
        <p className="text-sm text-muted-foreground">Ao reativar, a assinatura não será religada automaticamente.</p>
        <p className="text-sm text-muted-foreground">Recomendamos exportar seus dados antes. O CSV não inclui fotos nem fichas de anamnese.</p>
        <Button asChild variant="outline" className="min-h-11"><Link to="/configuracoes?abrir=export" onClick={() => setOpen(false)}>Exportar Dados</Link></Button>
        <label htmlFor="confirmar-exclusao" className="text-sm font-medium">Digite EXCLUIR para confirmar</label>
        <Input id="confirmar-exclusao" autoComplete="off" value={confirmacao} onChange={e => setConfirmacao(e.target.value)} />
        <AlertDialogFooter>
          <AlertDialogCancel disabled={excluir.isPending} className="min-h-11">Manter minha conta</AlertDialogCancel>
          <Button variant="destructive" className="min-h-11" disabled={confirmacao !== 'EXCLUIR' || excluir.isPending} onClick={() => excluir.mutate('solicitar',{ onSuccess:() => setOpen(false),onError:e => toast.error(e.message) })}>{excluir.isPending ? 'Confirmando...' : 'Confirmar exclusão'}</Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </section>;
}
