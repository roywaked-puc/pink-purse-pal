import { useEffect, useMemo, useState } from 'react';
import { MessageCircle } from 'lucide-react';
import { FormSheet } from '@/components/ds/FormSheet';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useApp } from '@/contexts/AppContext';
import { atendimentosEmAberto, montarMensagemCobranca, totalEmAberto } from '@/lib/cobranca';
import { whatsappLink } from '@/lib/whatsapp';
import type { Client } from '@/types';

const formatBRL = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: Client | null;
}

/**
 * Bottom sheet de cobrança de saldo pendente via WhatsApp.
 * Reutilizado na ficha da cliente (aba CRM) e no card "Com saldo pendente" do /crm.
 */
export function CobrancaSheet({ open, onOpenChange, client }: Props) {
  const { appointments, getServiceById } = useApp();
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set());
  const [mensagem, setMensagem] = useState('');
  const [mensagemEditada, setMensagemEditada] = useState(false);

  const itens = useMemo(
    () => (client ? atendimentosEmAberto(appointments, client.id, getServiceById) : []),
    [appointments, client, getServiceById],
  );

  const itensSelecionados = useMemo(
    () => itens.filter((i) => selecionados.has(i.appointment.id)),
    [itens, selecionados],
  );

  // Ao abrir/trocar de cliente: tudo marcado e mensagem regenerada
  useEffect(() => {
    if (open && client) {
      setSelecionados(new Set(itens.map((i) => i.appointment.id)));
      setMensagemEditada(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, client?.id]);

  // Recalcula a mensagem conforme os checkboxes, sem pisar em edição manual
  useEffect(() => {
    if (!client || mensagemEditada) return;
    setMensagem(
      itensSelecionados.length > 0 ? montarMensagemCobranca(client.name, itensSelecionados) : '',
    );
  }, [client, itensSelecionados, mensagemEditada]);

  if (!client) return null;

  const toggle = (id: string, marcado: boolean) => {
    setSelecionados((prev) => {
      const next = new Set(prev);
      if (marcado) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const link = whatsappLink(client.phone, mensagem);
  const total = totalEmAberto(itensSelecionados);

  return (
    <FormSheet
      open={open}
      onOpenChange={onOpenChange}
      title="Cobrar no WhatsApp"
      description={`Saldo pendente de ${client.name}`}
      side="bottom"
      hideFooter
    >
      <div className="space-y-4">
        <div className="space-y-2">
          <p className="text-sm font-medium">Atendimentos em aberto</p>
          {itens.map((item) => {
            const a = item.appointment;
            const marcado = selecionados.has(a.id);
            return (
              <label
                key={a.id}
                className="flex items-start gap-3 p-3 border border-border rounded-lg bg-card cursor-pointer"
              >
                <Checkbox
                  checked={marcado}
                  onCheckedChange={(v) => toggle(a.id, v === true)}
                  className="mt-0.5"
                />
                <span className="flex-1 min-w-0">
                  <span className="block text-sm font-medium truncate">{item.descricao}</span>
                  <span className="block text-xs text-muted-foreground">
                    {new Intl.DateTimeFormat('pt-BR', {
                      timeZone: 'America/Sao_Paulo',
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                    }).format(new Date(a.date))}
                    {(a.paidAmount || 0) > 0 && ` · Pago ${formatBRL(a.paidAmount)}`}
                  </span>
                </span>
                <span className="text-sm font-semibold tabular-nums text-rose-600">
                  {formatBRL(item.emAberto)}
                </span>
              </label>
            );
          })}
        </div>

        <div className="flex items-center justify-between text-sm font-medium">
          <span>Total selecionado</span>
          <span className="tabular-nums text-rose-600">{formatBRL(total)}</span>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium">Mensagem</p>
          <Textarea
            value={mensagem}
            onChange={(e) => {
              setMensagem(e.target.value);
              setMensagemEditada(true);
            }}
            rows={12}
            className="text-sm"
          />
        </div>

        <Button
          className="w-full"
          disabled={!link || itensSelecionados.length === 0}
          onClick={() => link && window.open(link, '_blank', 'noopener,noreferrer')}
        >
          <MessageCircle className="w-4 h-4 mr-2" />
          Enviar no WhatsApp
        </Button>
      </div>
    </FormSheet>
  );
}
