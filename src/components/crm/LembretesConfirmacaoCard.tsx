import { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, ChevronDown, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useApp } from '@/contexts/AppContext';
import { useUserSettings } from '@/hooks/useUserSettings';
import { useLembretesConfirmacao } from '@/hooks/useLembretesConfirmacao';
import { montarMensagemConfirmacao, servicoConfirmacao, whatsappLink } from '@/lib/whatsapp';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/ds/StatusBadge';
import { EmptyState } from '@/components/ds/EmptyState';

export function LembretesConfirmacaoCard({ home = false }: { home?: boolean }) {
  const { appointments, getClientById, getServiceById, marcarLembreteEnviado } = useApp();
  const { data: configuracoes } = useUserSettings();
  const [agora, setAgora] = useState(() => new Date());
  const [mostrarEnviados, setMostrarEnviados] = useState(false);
  const [salvando, setSalvando] = useState<string | null>(null);
  useEffect(() => {
    const timer = window.setInterval(() => setAgora(new Date()), 60_000);
    return () => window.clearInterval(timer);
  }, []);
  const lembretes = useLembretesConfirmacao(appointments, configuracoes?.crm_confirm_days ?? 3,
    configuracoes?.cancellation_notice_hours ?? 48, agora);
  const pendentes = lembretes.filter(l => !l.enviado);
  const enviados = lembretes.filter(l => l.enviado);
  const visiveis = home ? [...pendentes, ...(mostrarEnviados ? enviados : [])] : lembretes;

  const enviar = async (id: string) => {
    const agendamento = appointments.find(a => a.id === id);
    if (!agendamento || salvando) return;
    const telefone = agendamento.clientId ? getClientById(agendamento.clientId)?.phone : undefined;
    const servico = agendamento.serviceId ? getServiceById(agendamento.serviceId) : undefined;
    const link = whatsappLink(telefone, montarMensagemConfirmacao(agendamento, configuracoes ?? {}, servico));
    if (!link) return;
    // Abrir durante o gesto de toque evita bloqueio de popup; não envia a mensagem sozinho.
    const janela = window.open(link, '_blank');
    if (!janela) {
      toast.error('Permita abrir o WhatsApp e tente novamente');
      return;
    }
    janela.opener = null;
    setSalvando(id);
    try {
      await marcarLembreteEnviado(id);
    } catch (erro) {
      toast.error('O WhatsApp foi aberto, mas não foi possível registrar o lembrete', {
        description: erro instanceof Error ? erro.message : 'Tente novamente',
      });
    } finally {
      setSalvando(null);
    }
  };

  if (home && lembretes.length === 0) return null;
  return (
    <section className="mb-6 min-w-0 space-y-3" aria-label="Lembretes para enviar">
      <h2 className="font-semibold flex items-center gap-2">
        <MessageCircle className="w-5 h-5 text-primary shrink-0" />
        Lembretes para enviar
        <Badge variant="secondary">{pendentes.length}</Badge>
      </h2>
      {pendentes.length === 0 && <EmptyState icon={CheckCircle2} title="Nenhum lembrete pendente 🎉" className="py-4" />}
      <div className="space-y-2">
        {visiveis.map(({ agendamento, enviado, prazoPassou }) => {
          const telefone = agendamento.clientId ? getClientById(agendamento.clientId)?.phone : undefined;
          const servico = agendamento.serviceId ? getServiceById(agendamento.serviceId) : undefined;
          const semTelefone = !whatsappLink(telefone, '');
          const dia = new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', weekday: 'short' }).format(agendamento.date).replace('.', '');
          const data = new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit' }).format(agendamento.date);
          const horario = new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(agendamento.date);
          return (
            <div key={agendamento.id} className="min-w-0 rounded-lg border border-border bg-card p-3 space-y-2" data-lembrete-id={agendamento.id}>
              <div className="flex items-start justify-between gap-2">
                <p className="font-semibold text-sm break-words min-w-0">{agendamento.clientName}</p>
                {enviado && <StatusBadge status="enviado" className="shrink-0" />}
              </div>
              <p className="text-xs text-muted-foreground">{dia}, {data} · {horario}</p>
              <p className="text-sm break-words">{servicoConfirmacao(agendamento, servico)}</p>
              {prazoPassou && <Badge variant="outline" className="text-destructive bg-destructive/10 border-destructive/20 whitespace-normal gap-1">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />Prazo de cancelamento já passou
              </Badge>}
              <div>
                <Button variant={enviado ? 'ghost' : 'outline'} size="sm" className="min-h-11 h-auto whitespace-normal text-left" disabled={semTelefone || !!salvando}
                  onClick={() => void enviar(agendamento.id)}>
                  <MessageCircle className="w-4 h-4 mr-2 shrink-0" />
                  {semTelefone ? 'Sem telefone cadastrado' : salvando === agendamento.id ? 'Registrando...' : enviado ? 'Reenviar' : 'Enviar lembrete'}
                </Button>
              </div>
            </div>
          );
        })}
      </div>
      {home && enviados.length > 0 && <Button variant="ghost" className="min-h-11" onClick={() => setMostrarEnviados(v => !v)}>
        <ChevronDown className="w-4 h-4 mr-1" />{mostrarEnviados ? 'Ocultar enviados' : `Ver enviados (${enviados.length})`}
      </Button>}
    </section>
  );
}