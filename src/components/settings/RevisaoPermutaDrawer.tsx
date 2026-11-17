import { useState } from 'react';
import { ArrowLeftRight, X } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { useRevisaoPermuta } from '@/hooks/useRevisaoPermuta';
import { ETAPAS_FORMULARIOS_PERMUTA_PRONTAS, podeAtivarPermuta, textoSaldoPermuta } from '@/lib/revisaoPermuta';
import { Button } from '@/components/ui/button';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter } from '@/components/ui/drawer';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useAtivarPermuta } from '@/hooks/usePermuta';
import { DeleteConfirmDialog } from '@/components/shared/DeleteConfirmDialog';
import { toast } from 'sonner';

const dinheiro = (valor: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);

export function RevisaoPermutaDrawer() {
  const { clients } = useApp();
  const [aberto, setAberto] = useState(false);
  const [confirmar, setConfirmar] = useState(false);
  const ativar = useAtivarPermuta();
  const [escolhas, setEscolhas] = useState<Record<string, string>>({});
  const [incluidos, setIncluidos] = useState<Record<string, string>>({});
  const { data, isFetching, error, refetch } = useRevisaoPermuta(aberto);
  const contas = data?.contas ?? [];
  const clienteConta = (id: string, sugestao: string | null) => escolhas[id] ?? sugestao ?? '';
  const saldoConta = (id: string, saldo: number) => saldo + (data?.atendimentos ?? []).filter(a => incluidos[a.id] === id).reduce((s, a) => s + Number(a.amount), 0);
  const podeAtivar = podeAtivarPermuta(ETAPAS_FORMULARIOS_PERMUTA_PRONTAS, Boolean(data?.corte), contas.map(c => ({ saldo: saldoConta(c.conta_legada_id, Number(c.saldo_bruto)), client_id: clienteConta(c.conta_legada_id, c.client_id_sugerido) })));

  return <>
    <div className="rounded-lg border border-border bg-card p-3 space-y-2">
      <div className="flex items-center gap-2"><ArrowLeftRight className="h-5 w-5 text-primary" /><p className="font-medium">Nova conta corrente de permuta</p></div>
      <Button variant="outline" className="min-h-11" onClick={() => { setEscolhas({}); setIncluidos({}); setAberto(true); }}>Revisar contas antigas</Button>
    </div>
    <Drawer open={aberto} onOpenChange={o => { if (!ativar.isPending) setAberto(o); }}>
      <DrawerContent className="max-h-[90dvh] mx-auto max-w-2xl">
        <DrawerHeader className="text-left pr-14">
          <DrawerTitle>Nova conta corrente de permuta</DrawerTitle>
          <DrawerDescription>Confira os saldos e escolha a cliente de cada conta. Nenhum dado antigo será apagado.</DrawerDescription>
          <Button variant="ghost" size="icon" className="absolute right-3 top-5 h-11 w-11" aria-label="Fechar revisão" onClick={() => setAberto(false)}><X className="h-5 w-5" /></Button>
        </DrawerHeader>
        <div className="overflow-y-auto px-4 space-y-3">
          {isFetching && <p className="text-sm text-muted-foreground">Conferindo contas…</p>}
          {error && <div className="space-y-2"><p className="text-sm text-destructive">Não foi possível conferir as contas.</p><Button variant="outline" onClick={() => refetch()}>Tentar novamente</Button></div>}
          {data?.corte && <p className="text-sm text-muted-foreground">Conta corrente já ativada.</p>}
          {!isFetching && data && contas.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma conta de permuta antiga.</p>}
          {contas.map(conta => {
            const id = conta.conta_legada_id;
            const clienteId = clienteConta(id, conta.client_id_sugerido);
            const nome = clients.find(c => c.id === clienteId)?.name ?? conta.nome;
            const saldo = saldoConta(id, Number(conta.saldo_bruto));
            return <div key={id} className="rounded-lg border border-border bg-card p-3 space-y-2">
              <p className="font-medium">{conta.nome}</p>
              <p className={saldo > 0 ? 'text-sm font-medium text-success' : saldo < 0 ? 'text-sm font-medium text-warning' : 'text-sm text-muted-foreground'}>{textoSaldoPermuta(nome, saldo)}</p>
              {Number(conta.saldo_bruto) !== Number(conta.saldo_liquido) && <p className="text-xs text-muted-foreground">Saldo bruto: {dinheiro(Number(conta.saldo_bruto))} · Extrato atual: {dinheiro(Number(conta.saldo_liquido))}</p>}
              <Select value={clienteId || 'sem-cliente'} onValueChange={valor => { setEscolhas(prev => ({ ...prev, [id]: valor === 'sem-cliente' ? '' : valor })); setIncluidos(prev => Object.fromEntries(Object.entries(prev).filter(([, contaId]) => contaId !== id))); }}>
                <SelectTrigger className="min-h-11 w-full" aria-label={`Cliente da conta ${conta.nome}`}><SelectValue placeholder="Escolher cliente" /></SelectTrigger>
                <SelectContent><SelectItem value="sem-cliente">Escolher cliente{saldo === 0 ? ' (opcional)' : ''}</SelectItem>{clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
              {saldo !== 0 && !clienteId && <p className="text-xs text-destructive">Escolha a cliente para este saldo.</p>}
            </div>;
          })}
          {(data?.atendimentos.length ?? 0) > 0 && <section className="space-y-2 py-2">
            <p className="text-sm font-medium">Estes atendimentos em permuta não tinham lançamento. Deseja incluí-los no saldo inicial?</p>
            {data?.atendimentos.map(a => {
              const destino = contas.find(c => clienteConta(c.conta_legada_id, c.client_id_sugerido) === a.client_id);
              return <label key={a.id} className="flex min-h-11 items-center gap-3 text-sm"><Checkbox checked={Boolean(incluidos[a.id])} disabled={!destino} onCheckedChange={marcado => setIncluidos(prev => ({ ...prev, [a.id]: marcado && destino ? destino.conta_legada_id : '' }))} /><span>{a.client_name} · {new Date(a.date).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })} · {dinheiro(Number(a.amount))}{!destino && ' — escolha a cliente em uma conta acima'}</span></label>;
            })}
          </section>}
        </div>
        <DrawerFooter>
          <Button onClick={() => setConfirmar(true)} disabled={!data || !podeAtivar || isFetching || Boolean(error) || ativar.isPending} className="min-h-11 h-auto whitespace-normal">{ativar.isPending ? 'Ativando…' : 'Ativar'}</Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
    <DeleteConfirmDialog open={confirmar} onOpenChange={o => { if (!ativar.isPending) setConfirmar(o); }} title="Ativar conta corrente de permuta?" description="Os saldos revisados serão registrados e os novos formulários passarão a usar a conta corrente por cliente. O histórico antigo será preservado." onConfirm={async () => {
      if (!data || !podeAtivar || ativar.isPending) return;
      try {
        await ativar.mutateAsync(contas.map(c => ({ conta_legada_id: c.conta_legada_id, client_id: clienteConta(c.conta_legada_id, c.client_id_sugerido) || null, valor: saldoConta(c.conta_legada_id, Number(c.saldo_bruto)), appointment_ids: Object.entries(incluidos).filter(([, id]) => id === c.conta_legada_id).map(([id]) => id) })));
        toast.success('Conta corrente de permuta ativada'); setConfirmar(false); setAberto(false);
      } catch (e) { toast.error(e instanceof Error ? e.message : 'Não foi possível ativar. Reabra a revisão.'); setConfirmar(false); }
    }} />
  </>;
}