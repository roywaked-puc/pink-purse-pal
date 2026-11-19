import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { LogoBelafy } from '@/components/ds/LogoBelafy';
import { useAuth } from '@/contexts/AuthContext';
import { useReativarConta } from '@/hooks/useExclusaoConta';
import type { ExclusaoConta } from '@/types';

const dataBr = (data: string) => new Date(data).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: 'long', year: 'numeric' });

/** Tela única mostrada enquanto a conta está com exclusão agendada. */
export function ContaEmExclusao({ exclusao }: { exclusao: ExclusaoConta }) {
  const { signOut } = useAuth();
  const reativar = useReativarConta();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-belafy-ameixa px-4 py-10">
      <LogoBelafy variante="escuro" tamanho={40} />
      <Card className="w-full max-w-md rounded-3xl">
        <CardContent className="space-y-4 pt-6">
          <h1 className="text-xl font-semibold">Sua conta será excluída</h1>
          <p className="text-sm text-muted-foreground">
            Todos os dados serão apagados de vez em <strong className="text-foreground">{dataBr(exclusao.excluir_apos)}</strong>.
            Até lá você pode desistir e continuar usando o app normalmente.
          </p>
          {exclusao.reembolsado
            ? <p className="text-sm text-muted-foreground">O valor da assinatura foi estornado. Se reativar, será preciso assinar de novo para criar agendamentos.</p>
            : <p className="text-sm text-muted-foreground">A renovação da assinatura foi cancelada. Se reativar, você pode retomá-la em Configurações → Meu Plano.</p>}
          <Button className="min-h-11 w-full" disabled={reativar.isPending}
            onClick={() => reativar.mutate(undefined, { onSuccess: () => toast.success('Conta reativada!'), onError: e => toast.error(e.message) })}>
            {reativar.isPending ? 'Reativando...' : 'Reativar minha conta'}
          </Button>
          <Button variant="outline" className="min-h-11 w-full" disabled={reativar.isPending} onClick={() => void signOut()}>Sair</Button>
        </CardContent>
      </Card>
    </div>
  );
}
