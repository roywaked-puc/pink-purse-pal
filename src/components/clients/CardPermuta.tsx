import { useState } from 'react';
import { ArrowLeftRight, Calendar, MoreHorizontal, Pencil, Trash2, MessageCircle, Wallet, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useExtratoPermuta, useMutacoesPermuta } from '@/hooks/usePermuta';
import { useUserSettings } from '@/hooks/useUserSettings';
import { useApp } from '@/contexts/AppContext';
import { ordenarExtrato, dinheiroPermuta, podeEditarPermuta, type LinhaPermuta } from '@/lib/permutaExtrato';
import { PermutaFormSheet } from './PermutaFormSheet';
import { PermutaWhatsappSheet } from './PermutaWhatsappSheet';
import { ConfirmarPermutaDialog } from './ConfirmarPermutaDialog';
import type { Client, Appointment } from '@/types';

export function CardPermuta({ cliente, onAppointment, sempre = false }: { cliente: Client; onAppointment?: (a: Appointment) => void; sempre?: boolean }) {
  const { data: settings } = useUserSettings();
  const { appointments } = useApp();
  const { data: linhas = [], isLoading, error, refetch } = useExtratoPermuta(cliente.id);
  const { excluir } = useMutacoesPermuta();
  const [form, setForm] = useState<{ tipo: 'fui_atendida' | 'ajuste' | 'acerto'; linha?: LinhaPermuta } | null>(null);
  const [whatsapp, setWhatsapp] = useState(false);
  const [remover, setRemover] = useState<LinhaPermuta | null>(null);
  if (!settings?.permuta_corte_em || (!sempre && !cliente.pagaPermuta && !linhas.length && !error && !isLoading)) return null;
  let saldo = 0;
  const correntes = ordenarExtrato(linhas).map(l => { saldo = Math.round((saldo + l.valor) * 100) / 100; return { ...l, saldo }; }).reverse();
  const cor = saldo > 0 ? 'text-success' : saldo < 0 ? 'text-warning' : 'text-muted-foreground';
  return <section className="space-y-4 rounded-lg border border-border bg-card p-4 shadow-soft" aria-label={`Permuta de ${cliente.name}`}>
    <div className="flex items-center justify-between gap-2"><h2 className="flex items-center gap-2 text-lg font-semibold"><ArrowLeftRight className="h-5 w-5 text-primary" />Permuta</h2><DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-11 w-11" aria-label="Mais ações de permuta"><MoreHorizontal className="h-5 w-5" /></Button></DropdownMenuTrigger><DropdownMenuContent><DropdownMenuItem onSelect={() => setForm({ tipo: 'ajuste' })}>Ajuste</DropdownMenuItem></DropdownMenuContent></DropdownMenu></div>
    {isLoading ? <p>Carregando extrato…</p> : error ? <div><p className="text-sm text-destructive">Não foi possível carregar o extrato.</p><Button variant="outline" onClick={() => refetch()}>Tentar novamente</Button></div> : <>
      <p className={`text-2xl font-semibold ${cor}`}>{dinheiroPermuta(Math.abs(saldo))}</p>
      <p className={`text-sm ${cor}`}>{saldo > 0 ? `${cliente.name} te deve ${dinheiroPermuta(saldo)} em serviços` : saldo < 0 ? `Você deve ${dinheiroPermuta(-saldo)} em serviços para ${cliente.name}` : 'Permuta em dia'}</p>
      <div className="flex flex-wrap gap-2"><Button className="min-h-11" onClick={() => setForm({ tipo: 'fui_atendida' })}><Plus className="h-4 w-4" />Fui atendida</Button><Button className="min-h-11" variant="outline" onClick={() => setForm({ tipo: 'acerto' })}><Wallet className="h-4 w-4" />Acertar em dinheiro</Button><Button className="min-h-11" variant="outline" onClick={() => setWhatsapp(true)}><MessageCircle className="h-4 w-4" />Enviar no WhatsApp</Button></div>
      {!linhas.length && <p className="text-sm text-muted-foreground">Nenhum lançamento.</p>}
      <div className="divide-y divide-border">{correntes.map(l => {
        const a = appointments.find(a => a.id === l.appointment_id);
        const editavel = podeEditarPermuta(l.tipo) && Boolean(l.permuta_lancamento_id);
        const Icone = l.tipo === 'atendimento' ? Calendar : l.tipo.startsWith('acerto') ? Wallet : l.tipo === 'fui_atendida' ? ArrowLeftRight : Plus;
        return <div key={l.permuta_lancamento_id ?? l.appointment_id} className="py-3 space-y-1">
          <div className="flex items-start gap-2"><Icone className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" /><div className="min-w-0 flex-1">{a && onAppointment ? <Button variant="link" className="h-auto min-h-11 whitespace-normal p-0 text-left text-foreground" onClick={() => onAppointment(a)}>{l.descricao || 'Atendimento'}</Button> : <p className="break-words text-sm font-medium">{l.descricao || (l.tipo.startsWith('acerto') ? 'Acerto de permuta' : l.tipo === 'saldo_inicial' ? 'Saldo inicial' : 'Lançamento')}</p>}<p className="text-xs text-muted-foreground">{new Date(l.date).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })} · {l.tipo === 'fui_atendida' ? 'Fui atendida' : l.tipo === 'ajuste' ? 'Ajuste' : l.tipo.startsWith('acerto') ? 'Acerto de permuta · somente leitura' : l.tipo === 'saldo_inicial' ? 'Saldo inicial · somente leitura' : 'Atendimento'}</p></div><span className={`shrink-0 text-sm font-semibold ${l.valor > 0 ? 'text-success' : 'text-warning'}`}>{l.valor > 0 ? '+' : '−'} {dinheiroPermuta(Math.abs(l.valor))}</span></div>
          <div className="flex items-center justify-between gap-2"><p className="text-xs text-muted-foreground">Saldo corrente: {dinheiroPermuta(l.saldo)}</p>{editavel && <div className="flex"><Button aria-label="Editar lançamento de permuta" title="Editar" variant="ghost" size="icon" className="h-11 w-11" onClick={() => setForm({ tipo: l.tipo as 'fui_atendida' | 'ajuste', linha: l })}><Pencil className="h-4 w-4" /></Button><Button aria-label="Excluir lançamento de permuta" title="Excluir" variant="ghost" size="icon" className="h-11 w-11" onClick={() => setRemover(l)}><Trash2 className="h-4 w-4 text-destructive" /></Button></div>}</div>
        </div>;
      })}</div>
    </>}
    {form && <PermutaFormSheet cliente={cliente} saldo={saldo} tipo={form.tipo} linha={form.linha} onClose={() => setForm(null)} />}
    {whatsapp && <PermutaWhatsappSheet cliente={cliente} linhas={linhas} onClose={() => setWhatsapp(false)} />}
    <ConfirmarPermutaDialog open={Boolean(remover)} pending={excluir.isPending} label="Excluir" onOpenChange={o => !o && setRemover(null)} title="Excluir lançamento de permuta?" description="O saldo será recalculado. Esta ação não pode ser desfeita." onConfirm={async () => { if (!remover?.permuta_lancamento_id || excluir.isPending) return; try { await excluir.mutateAsync(remover.permuta_lancamento_id); setRemover(null); toast.success('Lançamento excluído'); } catch (e) { toast.error(e instanceof Error ? e.message : 'Não foi possível excluir.'); } }} />
  </section>;
}