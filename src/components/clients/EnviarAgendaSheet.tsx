import { useState } from 'react';
import { Copy, MessageCircle } from 'lucide-react';
import type { Appointment, Client, Service } from '@/types';
import { FormSheet } from '@/components/ds/FormSheet';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useIsMobile } from '@/hooks/use-mobile';
import { useToast } from '@/hooks/use-toast';
import { linkAgendaWhatsapp, montarMensagemAgenda } from '@/lib/agendaWhatsapp';

const preferenciaKey = 'agenda-whatsapp-mostrar-valores';
function lerPreferencia() {
  try { return localStorage.getItem(preferenciaKey) === 'true'; } catch { return false; }
}

export function EnviarAgendaSheet({ cliente, agendamentos, servicos, onOpenChange }: {
  cliente: Client; agendamentos: Appointment[]; servicos: Service[];
  onOpenChange: (open: boolean) => void;
}) {
  const mobile = useIsMobile();
  const { toast } = useToast();
  const [mostrarValores, setMostrarValores] = useState(lerPreferencia);
  const gerar = (valores: boolean) => montarMensagemAgenda(cliente, agendamentos, { mostrarValores: valores, servicos });
  const [original, setOriginal] = useState(() => gerar(mostrarValores));
  const [mensagem, setMensagem] = useState(original);
  const [mudancaPendente, setMudancaPendente] = useState<boolean | null>(null);
  const link = linkAgendaWhatsapp(cliente.phone, mensagem);

  const regenerar = (valores: boolean) => {
    const texto = gerar(valores);
    setMostrarValores(valores);
    setOriginal(texto);
    setMensagem(texto);
    setMudancaPendente(null);
    try { localStorage.setItem(preferenciaKey, String(valores)); } catch { /* Preferência opcional. */ }
  };
  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(mensagem);
      toast({ title: 'Mensagem copiada' });
    } catch {
      toast({ title: 'Não foi possível copiar a mensagem', description: 'Selecione o texto e copie manualmente.', variant: 'destructive' });
    }
  };

  return (
    <>
      <FormSheet open onOpenChange={onOpenChange} title="Enviar agenda" description={cliente.name}
        side={mobile ? 'bottom' : 'right'} hideFooter>
        <div className="min-w-0 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <Label htmlFor="agenda-valores">Mostrar valores</Label>
            <Switch id="agenda-valores" checked={mostrarValores} onCheckedChange={(valores) => {
              if (mensagem !== original) setMudancaPendente(valores);
              else regenerar(valores);
            }} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="agenda-mensagem">Mensagem</Label>
            <Textarea id="agenda-mensagem" value={mensagem} onChange={(e) => setMensagem(e.target.value)}
              className="min-h-[260px] w-full resize-y text-sm" />
          </div>
          {!link && <p className="text-sm text-muted-foreground">Cadastre o telefone da cliente para enviar</p>}
          <div className="flex flex-col gap-2 pb-2">
            {link ? (
              <Button asChild><a href={link} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="mr-2 h-4 w-4" />Abrir WhatsApp
              </a></Button>
            ) : <Button disabled><MessageCircle className="mr-2 h-4 w-4" />Abrir WhatsApp</Button>}
            <Button variant="outline" onClick={copiar}><Copy className="mr-2 h-4 w-4" />Copiar mensagem</Button>
          </div>
        </div>
      </FormSheet>
      <AlertDialog open={mudancaPendente !== null} onOpenChange={(open) => { if (!open) setMudancaPendente(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Substituir a mensagem editada?</AlertDialogTitle>
            <AlertDialogDescription>Ao mudar a opção de valores, suas alterações no texto serão substituídas.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (mudancaPendente !== null) regenerar(mudancaPendente); }}>Substituir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}