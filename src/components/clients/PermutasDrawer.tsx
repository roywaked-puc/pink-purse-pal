import { useState } from 'react';
import { ArrowLeftRight, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { FormSheet } from '@/components/ds/FormSheet';
import { useApp } from '@/contexts/AppContext';
import { useExtratoPermuta } from '@/hooks/usePermuta';
import { useUserSettings } from '@/hooks/useUserSettings';
import { dinheiroPermuta } from '@/lib/permutaExtrato';
import { CardPermuta } from './CardPermuta';
import { PermutaFormSheet } from './PermutaFormSheet';
import type { Client } from '@/types';
export function PermutasDrawer() {
  const { data: settings } = useUserSettings();
  const { clients } = useApp();
  const { data: linhas = [], isLoading, error, refetch } = useExtratoPermuta();
  const [open, setOpen] = useState(false);
  const [quitadas, setQuitadas] = useState(false);
  const [cliente, setCliente] = useState<Client | null>(null);
  const [novo, setNovo] = useState(false);
  if (!settings?.permuta_corte_em) return null;
  const saldos = clients.map(c => ({ cliente: c, saldo: Math.round(linhas.filter(l => l.client_id === c.id).reduce((s, l) => s + l.valor, 0) * 100) / 100, tem: c.pagaPermuta || linhas.some(l => l.client_id === c.id) })).filter(s => s.tem && (quitadas || s.saldo !== 0)).sort((a, b) => Math.abs(b.saldo) - Math.abs(a.saldo));
  return <>
    <Button variant="outline" className="min-h-11" onClick={() => setOpen(true)}><ArrowLeftRight className="h-4 w-4" />Permutas</Button>
    <FormSheet open={open} side="bottom" onOpenChange={setOpen} title="Permutas" hideFooter><div className="mx-auto max-w-2xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-2"><Switch id="mostrar-quitadas" checked={quitadas} onCheckedChange={setQuitadas} /><Label htmlFor="mostrar-quitadas">Mostrar quitadas</Label></div><Button className="min-h-11" onClick={() => setNovo(true)}><Plus className="h-4 w-4" />Fui atendida</Button></div>
      {isLoading && <p>Carregando permutas…</p>}{error && <><p className="text-destructive">Não foi possível carregar.</p><Button onClick={() => refetch()}>Tentar novamente</Button></>}
      {!isLoading && !error && !saldos.length && <p className="text-sm text-muted-foreground">Nenhuma permuta neste filtro.</p>}
      {[{ titulo: 'Te devem', filtro: (s: number) => s > 0 }, { titulo: 'Você deve', filtro: (s: number) => s < 0 }, { titulo: 'Quitadas', filtro: (s: number) => s === 0 }].map(g => { const grupo = saldos.filter(s => g.filtro(s.saldo)); return grupo.length ? <section key={g.titulo} className="space-y-2"><h3 className="font-semibold">{g.titulo}</h3>{grupo.map(s => <Button key={s.cliente.id} variant="outline" className="h-auto min-h-11 w-full justify-between gap-3 whitespace-normal py-3" onClick={() => setCliente(s.cliente)}><span className="text-left">{s.cliente.name}</span><span className={s.saldo > 0 ? 'text-success' : s.saldo < 0 ? 'text-warning' : 'text-muted-foreground'}>{dinheiroPermuta(Math.abs(s.saldo))}</span></Button>)}</section> : null; })}
    </div></FormSheet>
    {cliente && <FormSheet open side="bottom" onOpenChange={o => !o && setCliente(null)} title={cliente.name} hideFooter><div className="mx-auto max-w-2xl space-y-3"><Button asChild variant="outline"><Link to={`/cliente/${cliente.id}`} onClick={() => { setCliente(null); setOpen(false); }}>Abrir ficha e atendimentos</Link></Button><CardPermuta cliente={cliente} sempre /></div></FormSheet>}
    {novo && <PermutaFormSheet tipo="fui_atendida" onClose={() => setNovo(false)} />}
  </>;
}