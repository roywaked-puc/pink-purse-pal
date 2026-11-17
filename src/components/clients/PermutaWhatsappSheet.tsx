import { useState } from 'react';
import { Copy, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';
import { FormSheet } from '@/components/ds/FormSheet';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { DeleteConfirmDialog } from '@/components/shared/DeleteConfirmDialog';
import { montarMensagemPermuta, type LinhaPermuta, type PeriodoPermuta } from '@/lib/permutaExtrato';
import { whatsappLink } from '@/lib/whatsapp';
import type { Client } from '@/types';
const periodos: { id: PeriodoPermuta; label: string }[] = [{ id: 'ultimo_acerto', label: 'Desde o último acerto' }, { id: '90_dias', label: 'Últimos 90 dias' }, { id: 'tudo', label: 'Tudo' }];
export function PermutaWhatsappSheet({ cliente, linhas, onClose }: { cliente: Client; linhas: LinhaPermuta[]; onClose: () => void }) {
  const [periodo, setPeriodo] = useState<PeriodoPermuta>('ultimo_acerto');
  const [original, setOriginal] = useState(() => montarMensagemPermuta(cliente.name, linhas));
  const [texto, setTexto] = useState(original);
  const [proximo, setProximo] = useState<PeriodoPermuta | null>(null);
  const mudar = (p: PeriodoPermuta) => { const mensagem = montarMensagemPermuta(cliente.name, linhas, p); setPeriodo(p); setOriginal(mensagem); setTexto(mensagem); setProximo(null); };
  const telefone = cliente.phone.replace(/\D/g, '');
  const valido = /^(?:55)?\d{10,11}$/.test(telefone);
  const link = valido ? whatsappLink(cliente.phone, texto) : null;
  return <>
    <FormSheet side="bottom" open onOpenChange={o => !o && onClose()} title="Enviar no WhatsApp" description={cliente.name} hideFooter>
      <div className="mx-auto max-w-2xl space-y-4">
        <div className="flex flex-wrap gap-2">{periodos.map(p => <Button className="min-h-11" key={p.id} variant={periodo === p.id ? 'default' : 'outline'} onClick={() => { if (p.id === periodo) return; if (texto !== original) setProximo(p.id); else mudar(p.id); }}>{p.label}</Button>)}</div>
        <Textarea aria-label="Mensagem de permuta" className="min-h-72" value={texto} onChange={e => setTexto(e.target.value)} />
        {!valido && <p className="text-sm text-muted-foreground">Telefone inválido. Você pode copiar a mensagem.</p>}
        <div className="flex flex-wrap gap-2"><Button className="min-h-11 flex-1" variant="outline" onClick={async () => { try { await navigator.clipboard.writeText(texto); toast.success('Mensagem copiada'); } catch { toast.error('Não foi possível copiar.'); } }}><Copy className="h-4 w-4" />Copiar</Button><Button className="min-h-11 flex-1" disabled={!link || !texto.trim()} onClick={() => { if (link) window.open(link, '_blank', 'noopener,noreferrer'); }}><MessageCircle className="h-4 w-4" />Abrir WhatsApp</Button></div>
      </div>
    </FormSheet>
    <DeleteConfirmDialog open={Boolean(proximo)} onOpenChange={o => !o && setProximo(null)} title="Trocar período?" description="O texto editado será substituído pelo extrato do novo período." onConfirm={() => proximo && mudar(proximo)} />
  </>;
}