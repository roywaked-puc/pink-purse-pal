import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { LogoBelafy } from '@/components/ds/LogoBelafy';
import { useAuth } from '@/contexts/AuthContext';
import { useAlterarExclusaoConta } from '@/hooks/useExclusaoConta';
import type { ExclusaoContaPendente } from '@/types';
export function ContaEmExclusao({ exclusao }: { exclusao:ExclusaoContaPendente }) {
  const { signOut } = useAuth();
  const reativar = useAlterarExclusaoConta();
  return <main className="min-h-dvh bg-belafy-ameixa text-belafy-nevoa flex flex-col items-center justify-center gap-6 p-6 text-center">
    <LogoBelafy variante="escuro" tamanho={40} />
    <h1 className="text-2xl font-semibold">Sua conta será excluída</h1>
    <p className="max-w-md">Exclusão definitiva a partir de {new Date(exclusao.excluir_apos).toLocaleString('pt-BR',{ timeZone:'America/Sao_Paulo' })} (horário de Brasília).</p>
    <p className="max-w-md text-sm">Você pode desistir antes dessa data. Reativar a conta não religa a assinatura automaticamente.</p>
    {exclusao.reembolsado && <p className="text-sm">Seu reembolso foi solicitado e o Pro encerrado.</p>}
    <div className="flex w-full max-w-sm flex-col gap-3">
      <Button className="min-h-11 bg-belafy-rosa text-belafy-tinta hover:bg-belafy-rosa/90" disabled={reativar.isPending} onClick={() => reativar.mutate('reativar',{ onSuccess:() => toast.success('Sua conta foi reativada.'),onError:e => toast.error(e.message) })}>{reativar.isPending ? 'Reativando...' : 'Reativar minha conta'}</Button>
      <Button variant="ghost" className="min-h-11 text-belafy-nevoa hover:bg-belafy-nevoa/10 hover:text-belafy-nevoa" onClick={() => void signOut()}>Sair</Button>
    </div>
  </main>;
}
