import { useState, useMemo } from 'react';
import { Pencil, Trash2, Plus, Check, X, ChevronDown } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DeleteConfirmDialog } from '@/components/shared/DeleteConfirmDialog';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import type { Service } from '@/types';

const SERVICE_COLORS = [
  { name: 'Tomate', value: '#D50000' },
  { name: 'Flamingo', value: '#E67C73' },
  { name: 'Tangerina', value: '#F4511E' },
  { name: 'Banana', value: '#F6BF26' },
  { name: 'Salvia', value: '#33B679' },
  { name: 'Manjericão', value: '#0B8043' },
  { name: 'Pavão', value: '#039BE5' },
  { name: 'Mirtilo', value: '#3F51B5' },
  { name: 'Lavanda', value: '#7986CB' },
  { name: 'Uva', value: '#8E24AA' },
  { name: 'Grafite', value: '#616161' },
];

const TIER_LABELS: Record<string, string> = {
  colocacao: 'Colocação',
  manutencao: 'Manutenção',
  avulso: 'Avulso',
};

function maintenanceLabel(diasMin?: number, diasMax?: number) {
  if (diasMin === undefined || diasMax === undefined) return 'Manutenção';
  return `Manutenção ${diasMin}–${diasMax} dias`;
}

function serviceSubtitle(service: Service) {
  if (service.tierType === 'manutencao') {
    return maintenanceLabel(service.diasMin, service.diasMax);
  }
  return TIER_LABELS[service.tierType || ''] || service.tierType || '';
}

export function ServiceList() {
  const { services, addService, updateService, deleteService } = useApp();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDescription, setEditDescription] = useState('');
  const [editAmount, setEditAmount] = useState('');
  const [editDuration, setEditDuration] = useState('60');
  const [editNotes, setEditNotes] = useState('');
  const [editColor, setEditColor] = useState<string | undefined>(undefined);
  const [newDescription, setNewDescription] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newDuration, setNewDuration] = useState('60');
  const [newNotes, setNewNotes] = useState('');
  const [newColor, setNewColor] = useState<string | undefined>(undefined);
  const [isAdding, setIsAdding] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [openTechniques, setOpenTechniques] = useState<Record<string, boolean>>({});

  const grouped = useMemo(() => {
    const avulsos = services.filter(s => s.tierType === 'avulso' || !s.tierType);
    const byTechnique = new Map<string, Service[]>();

    services.forEach(service => {
      if (service.tierType && service.tierType !== 'avulso' && service.techniqueName) {
        const list = byTechnique.get(service.techniqueName) || [];
        list.push(service);
        byTechnique.set(service.techniqueName, list);
      }
    });

    const techniques = Array.from(byTechnique.entries())
      .map(([name, list]) => ({
        name,
        colocacao: list.filter(s => s.tierType === 'colocacao'),
        manutencao: list
          .filter(s => s.tierType === 'manutencao')
          .sort((a, b) => (a.diasMin || 0) - (b.diasMin || 0)),
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    return { avulsos, techniques };
  }, [services]);

  const toggleTechnique = (name: string) => {
    setOpenTechniques(prev => ({ ...prev, [name]: !prev[name] }));
  };

  const handleEdit = (service: Service) => {
    setEditingId(service.id);
    setEditDescription(service.description);
    setEditAmount(service.amount.toString());
    setEditDuration(service.duration.toString());
    setEditNotes(service.notes || '');
    setEditColor(service.color);
  };

  const handleSaveEdit = () => {
    if (editingId && editDescription.trim()) {
      updateService(editingId, { 
        description: editDescription.trim(), 
        amount: parseFloat(editAmount) || 0,
        duration: parseInt(editDuration) || 60,
        notes: editNotes.trim() || undefined,
        color: editColor
      });
      setEditingId(null);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditDescription('');
    setEditAmount('');
    setEditDuration('60');
    setEditNotes('');
    setEditColor(undefined);
  };

  const handleAdd = () => {
    if (newDescription.trim()) {
      addService({ 
        description: newDescription.trim(), 
        amount: parseFloat(newAmount) || 0,
        duration: parseInt(newDuration) || 60,
        notes: newNotes.trim() || undefined,
        color: newColor
      });
      setNewDescription('');
      setNewAmount('');
      setNewDuration('60');
      setNewNotes('');
      setNewColor(undefined);
      setIsAdding(false);
    }
  };

  const handleConfirmDelete = () => {
    if (deleteId) {
      deleteService(deleteId);
      setDeleteId(null);
    }
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const ColorPicker = ({ value, onChange }: { value?: string; onChange: (color?: string) => void }) => (
    <div className="space-y-2">
      <p className="text-sm text-muted-foreground">Cor (opcional)</p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onChange(undefined)}
          className={cn(
            "w-7 h-7 rounded-full border-2 flex items-center justify-center",
            !value ? "border-primary" : "border-border"
          )}
        >
          <X className="w-3 h-3 text-muted-foreground" />
        </button>
        {SERVICE_COLORS.map((color) => (
          <button
            key={color.value}
            type="button"
            onClick={() => onChange(color.value)}
            className={cn(
              "w-7 h-7 rounded-full border-2 transition-transform hover:scale-110",
              value === color.value ? "border-foreground ring-2 ring-offset-2 ring-primary" : "border-transparent"
            )}
            style={{ backgroundColor: color.value }}
            title={color.name}
          />
        ))}
      </div>
    </div>
  );

  const ServiceEditForm = ({ service }: { service: Service }) => (
    <div className="flex-1 space-y-2">
      <Input
        value={editDescription}
        onChange={(e) => setEditDescription(e.target.value)}
        autoFocus
      />
      <Input
        type="number"
        step="0.01"
        min="0"
        value={editAmount}
        onChange={(e) => setEditAmount(e.target.value)}
        placeholder="Valor (R$)"
      />
      <div className="flex gap-2 items-center">
        <Input
          type="number"
          min="15"
          step="15"
          value={editDuration}
          onChange={(e) => setEditDuration(e.target.value)}
          placeholder="Duração"
          className="flex-1"
        />
        <span className="text-sm text-muted-foreground whitespace-nowrap">min</span>
      </div>
      <Input
        value={editNotes}
        onChange={(e) => setEditNotes(e.target.value)}
        placeholder="Observação (opcional)"
      />
      <ColorPicker value={editColor} onChange={setEditColor} />
      <div className="flex gap-2">
        <Button size="sm" onClick={handleSaveEdit}>
          <Check className="h-4 w-4" />
        </Button>
        <Button size="sm" variant="outline" onClick={handleCancelEdit}>
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  const ServiceRow = ({ service }: { service: Service }) => (
    <div className="flex items-center gap-2 p-3 bg-card rounded-lg border border-border">
      {editingId === service.id ? (
        <ServiceEditForm service={service} />
      ) : (
        <>
          <div className="flex items-center gap-2 flex-1">
            {service.color && (
              <div 
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: service.color }}
              />
            )}
            <div className="flex-1">
              <p className="font-medium text-foreground">{service.description}</p>
              <div className="flex items-center gap-2">
                {service.amount > 0 && (
                  <span className="text-sm text-primary font-semibold">{formatCurrency(service.amount)}</span>
                )}
                {service.duration > 0 && (
                  <span className="text-xs text-muted-foreground">{service.amount > 0 ? '• ' : ''}{service.duration} min</span>
                )}
              </div>
              {service.notes && (
                <p className="text-xs text-muted-foreground">{service.notes}</p>
              )}
            </div>
          </div>
          <div className="flex gap-1">
            <Button
              size="icon"
              variant="ghost"
              onClick={() => handleEdit(service)}
              className="h-8 w-8"
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setDeleteId(service.id)}
              className="h-8 w-8 text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </>
      )}
    </div>
  );

  const ServiceBlock = ({ title, services }: { title: string; services: Service[] }) => {
    if (services.length === 0) return null;
    return (
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</p>
        {services.map(service => (
          <ServiceRow key={service.id} service={service} />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        {!isAdding && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsAdding(true)}
            className="gap-1"
          >
            <Plus className="h-4 w-4" />
            Adicionar
          </Button>
        )}
      </div>

      {isAdding && (
        <div className="p-3 bg-muted/50 rounded-lg space-y-3">
          <Input
            value={newDescription}
            onChange={(e) => setNewDescription(e.target.value)}
            placeholder="Descrição do serviço"
            autoFocus
          />
          <Input
            type="number"
            step="0.01"
            min="0"
            value={newAmount}
            onChange={(e) => setNewAmount(e.target.value)}
            placeholder="Valor (R$)"
          />
          <div className="flex gap-2 items-center">
            <Input
              type="number"
              min="15"
              step="15"
              value={newDuration}
              onChange={(e) => setNewDuration(e.target.value)}
              placeholder="Duração"
              className="flex-1"
            />
            <span className="text-sm text-muted-foreground whitespace-nowrap">min</span>
          </div>
          <Input
            value={newNotes}
            onChange={(e) => setNewNotes(e.target.value)}
            placeholder="Observação (opcional)"
          />
          <ColorPicker value={newColor} onChange={setNewColor} />
          <div className="flex gap-2">
            <Button size="sm" onClick={handleAdd} disabled={!newDescription.trim()}>
              <Check className="h-4 w-4 mr-1" />
              Salvar
            </Button>
            <Button size="sm" variant="outline" onClick={() => {
              setIsAdding(false);
              setNewDescription('');
              setNewAmount('');
              setNewNotes('');
              setNewColor(undefined);
            }}>
              <X className="h-4 w-4 mr-1" />
              Cancelar
            </Button>
          </div>
        </div>
      )}

      {/* Serviços por técnica */}
      <div className="space-y-3">
        {grouped.techniques.map(({ name, colocacao, manutencao }) => {
          const total = colocacao.length + manutencao.length;
          const isOpen = !!openTechniques[name];
          return (
            <Collapsible
              key={name}
              open={isOpen}
              onOpenChange={() => toggleTechnique(name)}
              className="border rounded-lg bg-muted/30 overflow-hidden"
            >
              <CollapsibleTrigger className="w-full">
                <div className="flex items-center justify-between p-3 text-left">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                      {name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{name}</p>
                      <p className="text-xs text-muted-foreground">
                        {total} {total === 1 ? 'serviço' : 'serviços'}
                      </p>
                    </div>
                  </div>
                  <ChevronDown className={cn(
                    "h-4 w-4 text-muted-foreground transition-transform",
                    isOpen && "rotate-180"
                  )} />
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="p-3 pt-0 space-y-4">
                  <ServiceBlock title="Colocação" services={colocacao} />
                  {manutencao.map(service => (
                    <ServiceBlock
                      key={service.id}
                      title={maintenanceLabel(service.diasMin, service.diasMax)}
                      services={[service]}
                    />
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          );
        })}
      </div>

      {/* Serviços avulsos */}
      {grouped.avulsos.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Serviços avulsos</p>
          {grouped.avulsos.map(service => (
            <ServiceRow key={service.id} service={service} />
          ))}
        </div>
      )}

      {services.length === 0 && !isAdding && (
        <p className="text-sm text-muted-foreground text-center py-4">
          Nenhum serviço cadastrado
        </p>
      )}

      <DeleteConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        onConfirm={handleConfirmDelete}
        title="Excluir Serviço"
        description="Tem certeza que deseja excluir este serviço?"
      />
    </div>
  );
}
