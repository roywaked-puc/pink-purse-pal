import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { primeirosPassos } from '@/content/manual';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';

const chaveProgresso = (userId?: string) => `primeirosPassos:${userId ?? 'anon'}`;
export const chaveOcultarHome = (userId?: string) => `primeirosPassosOcultoHome:${userId ?? 'anon'}`;

export function lerProgresso(userId?: string): string[] {
  try {
    const bruto = localStorage.getItem(chaveProgresso(userId));
    return bruto ? (JSON.parse(bruto) as string[]) : [];
  } catch {
    return [];
  }
}

export function usePrimeirosPassos() {
  const { user } = useAuth();
  const [feitos, setFeitos] = useState<string[]>(() => lerProgresso(user?.id));
  useEffect(() => setFeitos(lerProgresso(user?.id)), [user?.id]);
  const alternar = (id: string) => {
    setFeitos((atual) => {
      const novo = atual.includes(id) ? atual.filter((x) => x !== id) : [...atual, id];
      localStorage.setItem(chaveProgresso(user?.id), JSON.stringify(novo));
      return novo;
    });
  };
  const total = primeirosPassos.length;
  const concluidos = primeirosPassos.filter((p) => feitos.includes(p.id)).length;
  return { feitos, alternar, total, concluidos, completo: concluidos >= total };
}

interface Props {
  compacto?: boolean;
  acaoExtra?: React.ReactNode;
}

export function PrimeirosPassos({ compacto, acaoExtra }: Props) {
  const navigate = useNavigate();
  const { feitos, alternar, total, concluidos } = usePrimeirosPassos();
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
        {primeirosPassos.map((p) => {
          const feito = feitos.includes(p.id);
          return (
            <li key={p.id} className="flex items-start gap-3">
              <Checkbox id={`passo-${p.id}`} checked={feito} onCheckedChange={() => alternar(p.id)} className="mt-1" />
              <label htmlFor={`passo-${p.id}`} className="flex-1 min-w-0 cursor-pointer">
                <span className={`text-sm font-medium ${feito ? 'line-through text-muted-foreground' : ''}`}>{p.titulo}</span>
                {!compacto && <span className="block text-xs text-muted-foreground mt-0.5">{p.texto}</span>}
              </label>
              <Button variant="outline" size="sm" className="h-8 shrink-0" onClick={() => navigate(p.destino)}>Ir</Button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export function PrimeirosPassosHome() {
  const { user } = useAuth();
  const { completo } = usePrimeirosPassos();
  const [oculto, setOculto] = useState(() => localStorage.getItem(chaveOcultarHome(user?.id)) === 'true');
  useEffect(() => setOculto(localStorage.getItem(chaveOcultarHome(user?.id)) === 'true'), [user?.id]);
  if (completo || oculto) return null;
  return (
    <div className="mb-6">
      <PrimeirosPassos
        compacto
        acaoExtra={
          <Button variant="ghost" size="sm" className="h-8 text-muted-foreground" onClick={() => {
            localStorage.setItem(chaveOcultarHome(user?.id), 'true');
            setOculto(true);
          }}>Ocultar</Button>
        }
      />
    </div>
  );
}
