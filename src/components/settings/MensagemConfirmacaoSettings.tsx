import { useRef } from 'react';
import { RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { montarMensagemConfirmacao, TEMPLATE_CONFIRMACAO_PADRAO } from '@/lib/whatsapp';

interface Props {
  texto: string;
  horas: number;
  taxa: number;
  dias: number;
  onTexto: (texto: string) => void;
  onHoras: (horas: number) => void;
  onTaxa: (taxa: number) => void;
}

export function MensagemConfirmacaoSettings({ texto, horas, taxa, dias, onTexto, onHoras, onTaxa }: Props) {
  const textarea = useRef<HTMLTextAreaElement>(null);
  const agora = new Date();
  const amanha = new Date(agora.getTime() + 86_400_000);
  const data = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(amanha);
  const previa = montarMensagemConfirmacao({ date: new Date(`${data}T13:00:00-03:00`), clientName: 'Maria Silva', service: 'Manutenção', serviceId: 'exemplo' },
    { confirm_message_template: texto, cancellation_notice_hours: horas, cancellation_fee: taxa },
    { id: 'exemplo', description: 'Manutenção', tierType: 'manutencao', amount: 0, duration: 60 }, agora);

  const inserir = (variavel: string) => {
    const campo = textarea.current;
    const inicio = campo?.selectionStart ?? texto.length;
    const fim = campo?.selectionEnd ?? inicio;
    onTexto(texto.slice(0, inicio) + variavel + texto.slice(fim));
    requestAnimationFrame(() => {
      campo?.focus();
      campo?.setSelectionRange(inicio + variavel.length, inicio + variavel.length);
    });
  };

  return <section className="space-y-4 border-t border-border pt-5 min-w-0">
    <h3 className="font-semibold">Mensagem de confirmação</h3>
    <div className="space-y-2">
      <Label htmlFor="cancellationHours">Aviso mínimo para cancelamento (horas)</Label>
      <Input id="cancellationHours" type="number" min={1} step={1} value={horas} onChange={e => onHoras(Number(e.target.value))} className="max-w-[180px]" />
    </div>
    <div className="space-y-2">
      <Label htmlFor="cancellationFee">Taxa por falta/cancelamento (R$)</Label>
      <Input id="cancellationFee" type="number" min={0} step="0.01" value={taxa} onChange={e => onTaxa(Number(e.target.value))} className="max-w-[180px]" />
    </div>
    <div className="space-y-2">
      <Label htmlFor="confirmationTemplate">Texto da mensagem</Label>
      <Textarea ref={textarea} id="confirmationTemplate" value={texto} onChange={e => onTexto(e.target.value)} rows={12} />
      <div className="flex flex-wrap gap-2">
        {['saudacao', 'nome', 'servico', 'data', 'horario', 'horas_aviso', 'taxa'].map(chave => <Button key={chave} size="sm" variant="outline" className="text-xs rounded-full" onClick={() => inserir(`{${chave}}`)}>{`{${chave}}`}</Button>)}
      </div>
      <Button variant="ghost" size="sm" onClick={() => onTexto(TEMPLATE_CONFIRMACAO_PADRAO)}><RotateCcw className="w-4 h-4 mr-2" />Restaurar texto padrão</Button>
    </div>
    <p className="text-xs text-muted-foreground">Os lembretes aparecem para agendamentos dos próximos {dias} dias.</p>
    <div className="space-y-2">
      <h4 className="text-sm font-medium">Pré-visualização</h4>
      <p className="text-sm whitespace-pre-wrap break-words bg-muted/40 p-3 rounded-lg" aria-live="polite">{previa}</p>
    </div>
  </section>;
}