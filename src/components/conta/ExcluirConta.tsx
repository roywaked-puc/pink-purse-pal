import { useState } from 'react';
import { toast } from 'sonner';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useSolicitarExclusaoConta } from '@/hooks/useExclusaoConta';

/** Botão + confirmação para pedir a exclusão da conta (30 dias para desistir). */
export function ExcluirConta() {
  const [aberto, setAberto] = useState(false);
  const [texto, setTexto] = useState('');
  const solicitar = useSolicitarExclusaoConta();
  const confirmado = texto.trim().toUpperCase() === 'EXCLUIR';

  const alterarAberto = (v: boolean) => { if (solicitar.isPending) return; setAberto(v); if (!v) setTexto(''); };
  const excluir = () => solicitar.mutate(undefined, {
    onSuccess: r => toast.success(r.reembolsado ? 'Exclusão agendada. O valor pago será estornado no seu meio de pagamento.' : 'Exclusão agendada.'),
    onError: e => toast.error(e.message),
  });

  return <>
    <Button variant="ghost" className="min-h-11 w-full text-destructive hover:text-destructive" onClick={() => setAberto(true)}>
      <Trash2 className="h-4 w-4 mr-2" />Excluir minha conta
    </Button>
    <AlertDialog open={aberto} onOpenChange={alterarAberto}>
      <AlertDialogContent className="max-h-[90vh] overflow-y-auto">
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir sua conta?</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-2 text-sm text-muted-foreground text-left">
              <p>Depois de <strong className="text-foreground">30 dias</strong>, apagamos de vez todos os dados da conta: clientes, agenda, movimentações, fotos, fichas de anamnese (inclusive as assinadas), configurações e o seu login.</p>
              <p>Sua assinatura é cancelada agora. Se você assinou pela primeira vez há até 7 dias, devolvemos o valor pago.</p>
              <p>Mudou de ideia? É só entrar de novo dentro dos 30 dias e tocar em <strong className="text-foreground">Reativar minha conta</strong>.</p>
              <p>Antes, use <strong className="text-foreground">Exportar Dados</strong> para guardar uma cópia. A exportação em CSV não inclui fotos nem fichas de anamnese — baixe o PDF das fichas que precisar guardar.</p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-2">
          <Label htmlFor="confirmar-exclusao">Para confirmar, digite EXCLUIR</Label>
          <Input id="confirmar-exclusao" value={texto} onChange={e => setTexto(e.target.value)} autoComplete="off" autoCapitalize="characters" disabled={solicitar.isPending} />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={solicitar.isPending}>Voltar</AlertDialogCancel>
          <Button variant="destructive" className="min-h-11" disabled={!confirmado || solicitar.isPending} onClick={excluir}>
            {solicitar.isPending ? 'Excluindo...' : 'Excluir conta'}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </>;
}
