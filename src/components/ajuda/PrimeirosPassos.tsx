import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle2, Circle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useApp } from '@/contexts/AppContext';
import { useUserSettings, useUpdateUserSettings } from '@/hooks/useUserSettings';
import { supabase } from '@/integrations/supabase/client';
import { primeirosPassos } from '@/content/manual';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const chaveProgressoLegada = (userId?: string) => `primeirosPassos:${userId ?? 'anon'}`;
const chaveOcultarLegada = (userId?: string) => `primeirosPassosOcultoHome:${userId ?? 'anon'}`;

/** Fonte única do checklist: status calculado dos dados reais; "ocultar" salvo nas configurações. */
export function usePrimeirosPassos() {
  const { user } = useAuth();
  const { accounts, services, clients, appointments, loading: isLoading } = useApp();
  const { data: settings, isLoading: settingsLoading } = useUserSettings();
  const atualizar = useUpdateUserSettings();

  const maquininhas = accounts.filter((a) => a.type === 'maquininha');
  const { data: idsComTaxa = [], isLoading: taxasLoading } = useQuery({
    queryKey: ['account_fee_types', 'primeiros-passos', maquininhas.map((m) => m.id).join(',')],
    enabled: maquininhas.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase.from('account_fee_types').select('account_id').in('account_id', maquininhas.map((m) => m.id));
      if (error) throw error;
      return (data ?? []).map((r) => r.account_id as string);
    },
  });

  const taxasOk = maquininhas.length === 0 ||
    maquininhas.some((m) => idsComTaxa.includes(m.id) || Number(m.feePercentage ?? 0) > 0);
  const status: Record<string, boolean> = {
    conta: true,
    contas: accounts.some((a) => a.type !== 'permuta'),
    taxas: taxasOk,
    servicos: services.length > 0,
    clientes: clients.length > 0,
    horario: appointments.length > 0,
  };
  const itens = primeirosPassos.map((p) => ({ id: p.id, titulo: p.titulo, texto: p.texto, destino: p.destino, concluido: !!status[p.id] }));
  const total = itens.length;
  const concluidos = itens.filter((i) => i.concluido).length;
  const oculto = !!settings?.primeiros_passos_oculto_em;
  const carregando = isLoading || settingsLoading || (maquininhas.length > 0 && taxasLoading);

  const ocultar = async () => {
    try {
      await atualizar.mutateAsync({ primeiros_passos_oculto_em: new Date().toISOString() });
    } catch {
      toast.error('Não foi possível ocultar agora. Tente novamente.');
    }
  };

  // Compatibilidade: leva o "Ocultar" antigo do navegador para o banco uma única vez.
  const migrou = useRef(false);
  useEffect(() => {
    if (!user || settingsLoading || migrou.current) return;
    migrou.current = true;
    try {
      localStorage.removeItem(chaveProgressoLegada(user.id));
      if (localStorage.getItem(chaveOcultarLegada(user.id)) !== 'true') return;
      if (settings?.primeiros_passos_oculto_em) { localStorage.removeItem(chaveOcultarLegada(user.id)); return; }
      atualizar.mutateAsync({ primeiros_passos_oculto_em: new Date().toISOString() })
        .then(() => localStorage.removeItem(chaveOcultarLegada(user.id)))
        .catch(() => { migrou.current = false; });
    } catch { /* localStorage indisponível */ }
  }, [user, settingsLoading, settings?.primeiros_passos_oculto_em, atualizar]);

  return { itens, concluidos, total, completo: concluidos >= total, oculto, ocultar, carregando, ocultando: atualizar.isPending };
}

type Estado = ReturnType<typeof usePrimeirosPassos>;

interface Props {
  compacto?: boolean;
  acaoExtra?: React.ReactNode;
  estado?: Estado;
}

function Lista({ compacto, acaoExtra, estado }: Props & { estado: Estado }) {
  const navigate = useNavigate();
  const { itens, total, concluidos } = estado;
  const pct = Math.round((concluidos / total) * 100);
  return (
    <section className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0">
          <p className="font-semibold">Primeiros passos</p>
          <p className="text-xs text-muted-foreground">{concluidos} de {total} concluídos</p>
        </div>
        {acaoExtra}
      </div>
      <Progress value={pct} className="h-2 mb-3" aria-label="Progresso dos primeiros passos" />
      <ul className="space-y-2">
        {itens.map((p) => (
          <li key={p.id} className="flex items-start gap-3">
            {p.concluido
              ? <CheckCircle2 className="h-5 w-5 mt-0.5 shrink-0 text-success" aria-label="Concluído" />
              : <Circle className="h-5 w-5 mt-0.5 shrink-0 text-muted-foreground" aria-label="Pendente" />}
            <div className="flex-1 min-w-0">
              <span className={`text-sm font-medium ${p.concluido ? 'line-through text-muted-foreground' : ''}`}>{p.titulo}</span>
              {!compacto && <span className="block text-xs text-muted-foreground mt-0.5">{p.texto}</span>}
            </div>
            <Button variant="outline" size="sm" className="h-8 shrink-0" onClick={() => navigate(p.destino)}>Ir</Button>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function PrimeirosPassos(props: Props) {
  const estado = usePrimeirosPassos();
  return <Lista {...props} estado={props.estado ?? estado} />;
}

export function PrimeirosPassosHome() {
  const estado = usePrimeirosPassos();
  if (estado.carregando || estado.completo || estado.oculto) return null;
  return (
    <div className="mb-6">
      <Lista
        compacto
        estado={estado}
        acaoExtra={
          <Button variant="ghost" size="sm" className="h-8 text-muted-foreground" disabled={estado.ocultando} onClick={estado.ocultar}>Ocultar</Button>
        }
      />
    </div>
  );
}
