import { useMemo, useState } from 'react';
import { Pencil, Trash2, Plus, ChevronDown, AlertTriangle } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { DeleteConfirmDialog } from '@/components/shared/DeleteConfirmDialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { getFaixasDoServico } from '@/lib/serviceFaixas';
import { ServiceFormSheet, formatBRL } from './ServiceFormSheet';
import type { Service } from '@/types';

type Filtro = 'todos' | 'com' | 'sem';

const normalize = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

export function ServiceList() {
  const { services, deleteService } = useApp();
  const [filtro, setFiltro] = useState<Filtro>('todos');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<Service | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const { principais, revisar } = useMemo(() => {
    const principais = services
      .filter(s => !s.servicoPaiId)
      .map(s => ({ service: s, faixas: getFaixasDoServico(s.id, services) }));
    const revisar = principais.filter(p => normalize(p.service.description).includes('manutencao'));
    const revIds = new Set(revisar.map(r => r.service.id));
    return { principais: principais.filter(p => !revIds.has(p.service.id)), revisar };
  }, [services]);

  const lista = principais.filter(({ service, faixas }) => {
    const com = !!service.possuiManutencao || faixas.length > 0;
    return filtro === 'todos' || (filtro === 'com' ? com : !com);
  });

  const openNew = () => { setEditing(null); setSheetOpen(true); };
  const openEdit = (s: Service) => { setEditing(s); setSheetOpen(true); };

  const Card = ({ service, faixas }: { service: Service; faixas: ReturnType<typeof getFaixasDoServico> }) => {
    const com = !!service.possuiManutencao || faixas.length > 0;
    const isOpen = !!expanded[service.id];
    return (
      <div className="rounded-lg border border-border bg-card p-3">
        <div className="flex items-start gap-2">
          {service.color && <div className="w-3 h-3 mt-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: service.color }} />}
          <div className="flex-1 min-w-0">
            <p className="font-medium text-foreground break-words">{service.description}</p>
            <p className="text-sm">
              <span className="text-primary font-semibold">{formatBRL(service.amount)}</span>
              <span className="text-xs text-muted-foreground"> • {service.duration} min</span>
            </p>
            {service.notes && <p className="text-xs text-muted-foreground">{service.notes}</p>}
          </div>
          <Button size="icon" variant="ghost" className="h-11 w-11" aria-label="Editar" onClick={() => openEdit(service)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="ghost" className="h-11 w-11 text-destructive hover:text-destructive" aria-label="Excluir" onClick={() => setDeleteId(service.id)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
        {com && (
          <Collapsible open={isOpen} onOpenChange={() => setExpanded(p => ({ ...p, [service.id]: !p[service.id] }))}>
            <CollapsibleTrigger asChild>
              <button className="mt-2 inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 min-h-11 text-xs font-semibold text-primary">
                Manutenção · {faixas.length} {faixas.length === 1 ? 'faixa' : 'faixas'}
                <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', isOpen && 'rotate-180')} />
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2 space-y-1">
              {faixas.length === 0 && <p className="text-xs text-muted-foreground">Nenhuma faixa cadastrada.</p>}
              {faixas.map((f, i) => (
                <p key={f.id} className="text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground">{i + 1}ª</span> · De {f.de} até {f.ate} dias · {formatBRL(f.amount)} · {f.duration} min
                </p>
              ))}
            </CollapsibleContent>
          </Collapsible>
        )}
      </div>
    );
  };

  const chips: { id: Filtro; label: string }[] = [
    { id: 'todos', label: 'Todos' },
    { id: 'com', label: 'Com manutenção' },
    { id: 'sem', label: 'Sem' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex gap-2 flex-wrap">
          {chips.map(c => (
            <button key={c.id} onClick={() => setFiltro(c.id)}
              className={cn('rounded-full px-4 min-h-11 text-sm border',
                filtro === c.id ? 'bg-primary text-primary-foreground border-primary' : 'bg-background border-border text-foreground')}>
              {c.label}
            </button>
          ))}
        </div>
        <Button variant="outline" className="h-11 gap-1" onClick={openNew}>
          <Plus className="h-4 w-4" />Adicionar
        </Button>
      </div>

      <div className="space-y-2">
        {lista.map(p => <Card key={p.service.id} {...p} />)}
        {lista.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">Nenhum serviço encontrado</p>
        )}
      </div>

      {revisar.length > 0 && (
        <div className="space-y-2 rounded-lg border border-dashed border-border p-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-primary" />
            <p className="text-sm font-semibold">Revisar ({revisar.length})</p>
          </div>
          <p className="text-xs text-muted-foreground">
            Estes serviços parecem manutenções mas não ficaram ligados a um serviço principal. Cadastre a faixa no serviço certo e exclua o antigo, se quiser.
          </p>
          {revisar.map(p => <Card key={p.service.id} {...p} />)}
        </div>
      )}

      <ServiceFormSheet open={sheetOpen} onOpenChange={setSheetOpen} service={editing} services={services} />

      <DeleteConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        onConfirm={() => { if (deleteId) deleteService(deleteId); setDeleteId(null); }}
        title="Excluir serviço"
        description="Tem certeza que deseja excluir este serviço? As faixas de manutenção dele também serão excluídas."
      />
    </div>
  );
}
