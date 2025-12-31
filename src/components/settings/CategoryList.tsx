import { useState } from 'react';
import { Plus, Pencil, Trash2, Check, X } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DeleteConfirmDialog } from '@/components/shared/DeleteConfirmDialog';

export function CategoryList() {
  const { categories, addCategory, updateCategory, deleteCategory } = useApp();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleEdit = (id: string, name: string) => {
    setEditingId(id);
    setEditValue(name);
  };

  const handleSaveEdit = () => {
    if (editingId && editValue.trim()) {
      updateCategory(editingId, { name: editValue.trim() });
      setEditingId(null);
      setEditValue('');
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditValue('');
  };

  const handleAdd = () => {
    if (newCategoryName.trim()) {
      addCategory({ name: newCategoryName.trim() });
      setNewCategoryName('');
      setIsAdding(false);
    }
  };

  const handleConfirmDelete = () => {
    if (deleteId) {
      deleteCategory(deleteId);
      setDeleteId(null);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Categorias de Gastos</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsAdding(true)}
          className="text-primary"
        >
          <Plus className="w-4 h-4 mr-1" />
          Adicionar
        </Button>
      </div>

      <div className="space-y-2">
        {isAdding && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-muted animate-fade-in">
            <Input
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="Nome da categoria"
              className="flex-1"
              autoFocus
            />
            <Button size="icon" variant="ghost" onClick={handleAdd}>
              <Check className="w-4 h-4 text-success" />
            </Button>
            <Button size="icon" variant="ghost" onClick={() => setIsAdding(false)}>
              <X className="w-4 h-4 text-destructive" />
            </Button>
          </div>
        )}

        {categories.map((category) => (
          <div
            key={category.id}
            className="flex items-center gap-2 p-3 rounded-lg bg-card border border-border"
          >
            {editingId === category.id ? (
              <>
                <Input
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  className="flex-1"
                  autoFocus
                />
                <Button size="icon" variant="ghost" onClick={handleSaveEdit}>
                  <Check className="w-4 h-4 text-success" />
                </Button>
                <Button size="icon" variant="ghost" onClick={handleCancelEdit}>
                  <X className="w-4 h-4 text-destructive" />
                </Button>
              </>
            ) : (
              <>
                <span className="flex-1 font-medium">{category.name}</span>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => handleEdit(category.id, category.name)}
                  className="h-8 w-8"
                >
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setDeleteId(category.id)}
                  className="h-8 w-8 text-destructive hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </>
            )}
          </div>
        ))}
      </div>

      <DeleteConfirmDialog
        open={!!deleteId}
        onOpenChange={() => setDeleteId(null)}
        onConfirm={handleConfirmDelete}
        title="Excluir categoria"
        description="Tem certeza que deseja excluir esta categoria? As movimentações associadas não serão afetadas."
      />
    </div>
  );
}
