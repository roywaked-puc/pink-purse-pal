import { useState } from 'react';
import { Pencil, Trash2, Plus, Check, X } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DeleteConfirmDialog } from '@/components/shared/DeleteConfirmDialog';
import { cn } from '@/lib/utils';

const SERVICE_COLORS = [
  { name: 'Vermelho', value: '#EF4444' },
  { name: 'Rosa', value: '#EC4899' },
  { name: 'Roxo', value: '#8B5CF6' },
  { name: 'Azul', value: '#3B82F6' },
  { name: 'Ciano', value: '#06B6D4' },
  { name: 'Verde', value: '#10B981' },
  { name: 'Amarelo', value: '#F59E0B' },
  { name: 'Laranja', value: '#F97316' },
];

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

  const handleEdit = (id: string, description: string, amount: number, duration: number, notes?: string, color?: string) => {
    setEditingId(id);
    setEditDescription(description);
    setEditAmount(amount.toString());
    setEditDuration(duration.toString());
    setEditNotes(notes || '');
    setEditColor(color);
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

      <div className="space-y-2">
        {services.map((service) => (
          <div
            key={service.id}
            className="flex items-center gap-2 p-3 bg-card rounded-lg border border-border"
          >
            {editingId === service.id ? (
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
                    onClick={() => handleEdit(service.id, service.description, service.amount, service.duration, service.notes, service.color)}
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
        ))}

        {services.length === 0 && !isAdding && (
          <p className="text-sm text-muted-foreground text-center py-4">
            Nenhum serviço cadastrado
          </p>
        )}
      </div>

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