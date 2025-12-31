import { useState } from 'react';
import { Pencil, Trash2, Plus, Check, X } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DeleteConfirmDialog } from '@/components/shared/DeleteConfirmDialog';

export function ServiceList() {
  const { services, addService, updateService, deleteService } = useApp();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDescription, setEditDescription] = useState('');
  const [editAmount, setEditAmount] = useState('');
  const [editDuration, setEditDuration] = useState('60');
  const [editNotes, setEditNotes] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newDuration, setNewDuration] = useState('60');
  const [newNotes, setNewNotes] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleEdit = (id: string, description: string, amount: number, duration: number, notes?: string) => {
    setEditingId(id);
    setEditDescription(description);
    setEditAmount(amount.toString());
    setEditDuration(duration.toString());
    setEditNotes(notes || '');
  };

  const handleSaveEdit = () => {
    if (editingId && editDescription.trim() && editAmount) {
      updateService(editingId, { 
        description: editDescription.trim(), 
        amount: parseFloat(editAmount),
        duration: parseInt(editDuration) || 60,
        notes: editNotes.trim() || undefined
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
  };

  const handleAdd = () => {
    if (newDescription.trim() && newAmount) {
      addService({ 
        description: newDescription.trim(), 
        amount: parseFloat(newAmount),
        duration: parseInt(newDuration) || 60,
        notes: newNotes.trim() || undefined
      });
      setNewDescription('');
      setNewAmount('');
      setNewDuration('60');
      setNewNotes('');
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Serviços</h3>
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
          <div className="flex gap-2">
            <Button size="sm" onClick={handleAdd} disabled={!newDescription.trim() || !newAmount}>
              <Check className="h-4 w-4 mr-1" />
              Salvar
            </Button>
            <Button size="sm" variant="outline" onClick={() => {
              setIsAdding(false);
              setNewDescription('');
              setNewAmount('');
              setNewNotes('');
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
                <div className="flex-1">
                  <p className="font-medium text-foreground">{service.description}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-primary font-semibold">{formatCurrency(service.amount)}</span>
                    <span className="text-xs text-muted-foreground">• {service.duration} min</span>
                  </div>
                  {service.notes && (
                    <p className="text-xs text-muted-foreground">{service.notes}</p>
                  )}
                </div>
                <div className="flex gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleEdit(service.id, service.description, service.amount, service.duration, service.notes)}
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
