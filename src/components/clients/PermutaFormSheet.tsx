import { useState } from 'react';
import { toast } from 'sonner';
import { FormSheet } from '@/components/ds/FormSheet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ConfirmarPermutaDialog } from './ConfirmarPermutaDialog';
import { useApp } from '@/contexts/AppContext';
import { useMutacoesPermuta, useExtratoPermuta } from '@/hooks/usePermuta';
import { dinheiroPermuta, contasAcertoPermuta, categoriasAcertoPermuta, type LinhaPermuta } from '@/lib/permutaExtrato';
import type { Client } from '@/types';

const hoje = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
export function PermutaFormSheet({ cliente, saldo = 0, tipo, linha, onClose }: { cliente?: Client; saldo?: number; tipo: 'fui_atendida' | 'ajuste' | 'acerto'; linha?: LinhaPermuta; onClose: () => void }) {
  const { clients, accounts, categories } = useApp();
  const { salvar, acerto } = useMutacoesPermuta();
  const [clientId, setClientId] = useState(cliente?.id ?? '');
  const { data: extrato = [], isFetching } = useExtratoPermuta(cliente ? cliente.id : clientId || undefined);
  const [descricao, setDescricao] = useState(linha?.descricao ?? '');
  const [valor, setValor] = useState(linha ? String(tipo === 'fui_atendida' ? Math.abs(linha.valor) : linha.valor) : tipo === 'acerto' && saldo ? String(Math.abs(saldo)) : '');
  const [data, setData] = useState(linha ? new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(linha.date)) : hoje());
  const [direcao, setDirecao] = useState<'recebido' | 'pago'>(saldo < 0 ? 'pago' : 'recebido');
  const [scope, setScope] = useState<'empresa' | 'pessoal'>('empresa');
  const [conta, setConta] = useState('');
  const [categoria, setCategoria] = useState('');
  const [confirmar, setConfirmar] = useState(false);
  const numero = Number(valor.replace(',', '.'));
  const valorAssinado = tipo === 'fui_atendida' || (tipo === 'acerto' && direcao === 'recebido') ? -Math.abs(numero) : numero;
  const saldoAtual = cliente ? saldo : extrato.filter(l => l.client_id === clientId).reduce((s, l) => s + l.valor, 0);
  const saldoApos = saldoAtual - (linha?.valor ?? 0) + valorAssinado;
  const categorias = categoriasAcertoPermuta(categories, direcao, scope);
  const pendente = salvar.isPending || acerto.isPending;
  const valido = clientId && data && !isFetching && Number.isFinite(numero) && numero !== 0 && Math.abs(numero * 100 - Math.round(numero * 100)) < 0.000001 && (tipo === 'ajuste' || numero > 0) && (tipo === 'acerto' ? Boolean(conta && categorias.some(c => c.id === categoria)) : descricao.trim());
  const enviar = async () => {
    if (!valido || pendente) return;
    try {
      const date = linha && data === new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(linha.date)) ? linha.date : new Date(`${data}T12:00:00-03:00`).toISOString();
      if (tipo === 'acerto') await acerto.mutateAsync({ clientId, date, valor: numero, direcao, accountId: conta, categoryId: categoria, scope, descricao });
      else await salvar.mutateAsync({ id: linha?.permuta_lancamento_id ?? undefined, clientId, tipo, date, valor: valorAssinado, descricao });
      toast.success(tipo === 'acerto' ? 'Acerto registrado' : 'Lançamento salvo');
      onClose();
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Não foi possível salvar.'); }
    setConfirmar(false);
  };
  return <>
    <FormSheet side="bottom" open onOpenChange={o => { if (!o && !pendente) onClose(); }} title={tipo === 'acerto' ? 'Acertar em dinheiro' : tipo === 'ajuste' ? (linha ? 'Editar ajuste' : 'Ajuste') : (linha ? 'Editar: Fui atendida' : 'Fui atendida')} description={cliente?.name} onSubmit={() => linha ? setConfirmar(true) : enviar()} submitting={pendente} submitDisabled={!valido}>
      <div className="mx-auto max-w-lg space-y-4">
        {!cliente && <div className="space-y-2"><Label>Cliente *</Label><Select value={clientId} onValueChange={setClientId}><SelectTrigger aria-label="Cliente da permuta"><SelectValue placeholder="Escolher cliente" /></SelectTrigger><SelectContent>{clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select></div>}
        {tipo === 'acerto' && <>
          <div className="space-y-2"><Label>Quem pagou?</Label><Select value={direcao} onValueChange={v => { setDirecao(v as 'recebido' | 'pago'); setCategoria(''); }}><SelectTrigger aria-label="Direção do acerto"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="recebido">{cliente?.name ?? 'A cliente'} me pagou</SelectItem><SelectItem value="pago">Eu paguei {cliente?.name ?? 'a cliente'}</SelectItem></SelectContent></Select></div>
          <div className="space-y-2"><Label>Caixa</Label><Select value={scope} onValueChange={v => { setScope(v as 'empresa' | 'pessoal'); setCategoria(''); }}><SelectTrigger aria-label="Caixa do acerto"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="empresa">Empresa</SelectItem><SelectItem value="pessoal">Pessoal</SelectItem></SelectContent></Select></div>
          <div className="space-y-2"><Label>Conta / Banco *</Label><Select value={conta} onValueChange={setConta}><SelectTrigger aria-label="Conta do acerto"><SelectValue placeholder="Escolher conta" /></SelectTrigger><SelectContent>{contasAcertoPermuta(accounts).map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}</SelectContent></Select></div>
          <div className="space-y-2"><Label>Categoria *</Label><Select value={categoria} onValueChange={setCategoria}><SelectTrigger aria-label="Categoria do acerto"><SelectValue placeholder="Escolher categoria" /></SelectTrigger><SelectContent>{categorias.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select></div>
        </>}
        <div className="space-y-2"><Label htmlFor="permuta-descricao">{tipo === 'acerto' ? 'Descrição' : 'Descrição do serviço *'}</Label><Textarea id="permuta-descricao" value={descricao} onChange={e => setDescricao(e.target.value)} /></div>
        <div className="grid grid-cols-2 gap-3"><div className="space-y-2"><Label htmlFor="permuta-valor">Valor (R$) *</Label><Input id="permuta-valor" inputMode="decimal" value={valor} onChange={e => setValor(e.target.value)} /></div><div className="space-y-2"><Label htmlFor="permuta-data">Data *</Label><Input id="permuta-data" type="date" value={data} onChange={e => setData(e.target.value)} /></div></div>
        {Number.isFinite(numero) && <p className="text-sm font-medium">Saldo após este lançamento: {dinheiroPermuta(saldoApos)}</p>}
      </div>
    </FormSheet>
    <ConfirmarPermutaDialog open={confirmar} onOpenChange={setConfirmar} title="Confirmar edição" description="Salvar as alterações deste lançamento de permuta?" label="Salvar alterações" pending={pendente} onConfirm={enviar} />
  </>;
}