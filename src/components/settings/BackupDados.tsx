import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Drawer, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { useContagemFotos, useGerarBackup, type ProgressoBackup, type ResultadoBackup } from '@/hooks/useGerarBackup';
import { Download, Share2, ShieldAlert, Loader2, CheckCircle2 } from 'lucide-react';

type Estado = 'parado' | 'gerando' | 'pronto';

export function BackupDados() {
  const { toast } = useToast();
  const gerar = useGerarBackup();
  const { data: totalFotos } = useContagemFotos();
  const [incluirFotos, setIncluirFotos] = useState(true);
  const [estado, setEstado] = useState<Estado>('parado');
  const [aberto, setAberto] = useState(false);
  const [confirmarCancelar, setConfirmarCancelar] = useState(false);
  const [progresso, setProgresso] = useState<ProgressoBackup>({ etapa: 'Lendo seus dados…', percentual: 0 });
  const [resultado, setResultado] = useState<ResultadoBackup | null>(null);
  const controle = useRef<AbortController | null>(null);
  const travado = useRef(false);

  const podeCompartilhar = (() => {
    if (!resultado || typeof navigator === 'undefined' || !navigator.canShare) return false;
    try {
      return navigator.canShare({ files: [new File([resultado.blob], resultado.nome, { type: 'application/zip' })] });
    } catch { return false; }
  })();

  // Durante a geração: botão voltar do celular pergunta antes; sair da página também.
  useEffect(() => {
    if (estado !== 'gerando') return;
    window.history.pushState({ backup: true }, '');
    const aoVoltar = () => {
      window.history.pushState({ backup: true }, '');
      setConfirmarCancelar(true);
    };
    const antesDeSair = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('popstate', aoVoltar);
    window.addEventListener('beforeunload', antesDeSair);
    return () => {
      window.removeEventListener('popstate', aoVoltar);
      window.removeEventListener('beforeunload', antesDeSair);
    };
  }, [estado]);

  const iniciar = useCallback(async () => {
    if (travado.current) return;
    travado.current = true;
    const ac = new AbortController();
    controle.current = ac;
    setResultado(null);
    setProgresso({ etapa: 'Lendo seus dados…', percentual: 0 });
    setEstado('gerando');
    setAberto(true);

    let wakeLock: { release: () => Promise<void> } | null = null;
    try {
      wakeLock = await (navigator as Navigator & { wakeLock?: { request: (t: 'screen') => Promise<{ release: () => Promise<void> }> } }).wakeLock?.request('screen') ?? null;
    } catch { /* navegador sem suporte: segue normalmente */ }

    try {
      const r = await gerar({ incluirFotos, signal: ac.signal, onProgresso: setProgresso });
      setResultado(r);
      setEstado('pronto');
    } catch (e) {
      setAberto(false);
      setEstado('parado');
      if (!(e instanceof DOMException && e.name === 'AbortError')) {
        toast({
          title: 'Não foi possível fazer o backup',
          description: e instanceof Error ? e.message : 'Tente novamente.',
          variant: 'destructive',
        });
      } else {
        toast({ title: 'Backup cancelado' });
      }
    } finally {
      setConfirmarCancelar(false);
      try { await wakeLock?.release(); } catch { /* ignora */ }
      travado.current = false;
    }
  }, [gerar, incluirFotos, toast]);

  const aoMudarDrawer = (abrir: boolean) => {
    if (abrir) return;
    if (estado === 'gerando') { setConfirmarCancelar(true); return; }
    setAberto(false);
    setEstado('parado');
  };

  const baixar = () => {
    if (!resultado) return;
    const url = URL.createObjectURL(resultado.blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = resultado.nome;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  };

  const compartilhar = async () => {
    if (!resultado) return;
    try {
      await navigator.share({ files: [new File([resultado.blob], resultado.nome, { type: 'application/zip' })], title: resultado.nome });
    } catch { /* usuária fechou o compartilhamento */ }
  };

  const r = resultado?.resumo;

  return (
    <div className="space-y-4 pb-2">
      <p className="text-sm text-muted-foreground">
        Uma cópia de tudo: clientes, agenda, financeiro, fichas de anamnese e fotos.
      </p>
      <div className="flex items-center justify-between gap-3 rounded-lg border p-3 min-h-11">
        <Label htmlFor="backup-fotos" className="flex flex-col gap-0.5 cursor-pointer">
          <span>Incluir fotos</span>
          <span className="text-xs font-normal text-muted-foreground">
            {totalFotos === undefined ? 'Contando fotos…' : `${totalFotos} ${totalFotos === 1 ? 'foto' : 'fotos'}`}
          </span>
        </Label>
        <Switch id="backup-fotos" checked={incluirFotos} onCheckedChange={setIncluirFotos} disabled={estado === 'gerando'} />
      </div>
      <Button className="w-full min-h-11" onClick={iniciar} disabled={estado === 'gerando'}>
        {estado === 'gerando' ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
        Fazer backup
      </Button>
      <p className="flex items-start gap-2 text-xs text-muted-foreground">
        <ShieldAlert className="h-4 w-4 shrink-0" />
        O arquivo contém dados de saúde das suas clientes. Guarde em local seguro.
      </p>

      <Drawer open={aberto} onOpenChange={aoMudarDrawer}>
        <DrawerContent>
          <div className="mx-auto w-full max-w-md">
            <DrawerHeader>
              <DrawerTitle>{estado === 'pronto' ? 'Backup pronto' : 'Fazendo backup'}</DrawerTitle>
              <DrawerDescription>
                {estado === 'pronto' ? resultado?.nome : 'Mantenha o app aberto até terminar.'}
              </DrawerDescription>
            </DrawerHeader>
            <div className="px-4 space-y-3">
              {estado === 'gerando' && (
                <>
                  <p className="text-sm font-medium" aria-live="polite">{progresso.etapa}</p>
                  <Progress value={progresso.percentual} />
                </>
              )}
              {estado === 'pronto' && r && (
                <div className="space-y-2">
                  <p className="flex items-center gap-2 text-sm font-medium text-primary">
                    <CheckCircle2 className="h-5 w-5" /> Tudo copiado
                  </p>
                  <ul className="grid grid-cols-2 gap-2 text-sm">
                    <li className="rounded-md bg-muted p-2">{r.clientes} clientes</li>
                    <li className="rounded-md bg-muted p-2">{r.agendamentos} agendamentos</li>
                    <li className="rounded-md bg-muted p-2">{r.movimentacoes} movimentações</li>
                    <li className="rounded-md bg-muted p-2">{r.fotos} fotos</li>
                    <li className="rounded-md bg-muted p-2">{r.fichas} fichas</li>
                  </ul>
                  {r.falhas > 0 && (
                    <p className="text-sm text-destructive">
                      {r.falhas} {r.falhas === 1 ? 'item não pôde ser copiado' : 'itens não puderam ser copiados'}. Veja o arquivo erros.txt.
                    </p>
                  )}
                </div>
              )}
            </div>
            <DrawerFooter>
              {estado === 'gerando' && (
                <Button variant="outline" className="min-h-11" onClick={() => setConfirmarCancelar(true)}>Cancelar</Button>
              )}
              {estado === 'pronto' && (
                <>
                  <Button className="min-h-11" onClick={baixar}><Download className="h-4 w-4 mr-2" />Baixar</Button>
                  {podeCompartilhar && (
                    <Button variant="outline" className="min-h-11" onClick={compartilhar}>
                      <Share2 className="h-4 w-4 mr-2" />Salvar ou compartilhar
                    </Button>
                  )}
                  <Button variant="ghost" className="min-h-11" onClick={() => aoMudarDrawer(false)}>Fechar</Button>
                </>
              )}
            </DrawerFooter>
          </div>
        </DrawerContent>
      </Drawer>

      <AlertDialog open={confirmarCancelar} onOpenChange={setConfirmarCancelar}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar o backup?</AlertDialogTitle>
            <AlertDialogDescription>O que já foi copiado será descartado.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="min-h-11">Continuar backup</AlertDialogCancel>
            <AlertDialogAction className="min-h-11" onClick={() => controle.current?.abort()}>Cancelar backup</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
