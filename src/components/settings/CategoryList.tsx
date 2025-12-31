import { useState } from 'react';
import { Plus, Pencil, Trash2, Check, X } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DeleteConfirmDialog } from '@/components/shared/DeleteConfirmDialog';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type CategoryType = 'entrada' | 'saida';
type CategoryScope = 'empresa' | 'pessoal';

export function CategoryList() {
  const { categories, addCategory, updateCategory, deleteCategory } = useApp();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [editType, setEditType] = useState<CategoryType>('saida');
  const [editScope, setEditScope] = useState<CategoryScope>('pessoal');
  const [isAdding, setIsAdding] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryType, setNewCategoryType] = useState<CategoryType>('saida');
  const [newCategoryScope, setNewCategoryScope] = useState<CategoryScope>('pessoal');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleEdit = (id: string, name: string, type: CategoryType, scope: CategoryScope) => {
    setEditingId(id);
    setEditValue(name);
    setEditType(type);
    setEditScope(scope);
  };

  const handleSaveEdit = () => {
    if (editingId && editValue.trim()) {
      updateCategory(editingId, { 
        name: editValue.trim(),
        type: editType,
        scope: editScope
      });
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
      addCategory({ 
        name: newCategoryName.trim(),
        type: newCategoryType,
        scope: newCategoryScope
      });
      setNewCategoryName('');
      setNewCategoryType('saida');
      setNewCategoryScope('pessoal');
      setIsAdding(false);
    }
  };

  const handleConfirmDelete = () => {
    if (deleteId) {
      deleteCategory(deleteId);
      setDeleteId(null);
    }
  };

  const empresaCategories = categories.filter(c => c.scope === 'empresa');
  const pessoalCategories = categories.filter(c => c.scope === 'pessoal');

  const renderCategoryItem = (category: typeof categories[0]) => (
    <div
      key={category.id}
      className="flex items-center gap-2 p-3 rounded-lg bg-card border border-border"
    >
      {editingId === category.id ? (
        <div className="flex-1 space-y-3">
          <Input
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            placeholder="Descrição"
            autoFocus
          />
          <div className="grid grid-cols-2 gap-2">
            <Select value={editType} onValueChange={(v) => setEditType(v as CategoryType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="entrada">Entrada</SelectItem>
                <SelectItem value="saida">Saída</SelectItem>
              </SelectContent>
            </Select>
            <Select value={editScope} onValueChange={(v) => setEditScope(v as CategoryScope)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="empresa">Empresa</SelectItem>
                <SelectItem value="pessoal">Pessoal</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end gap-2">
            <Button size="icon" variant="ghost" onClick={handleSaveEdit}>
              <Check className="w-4 h-4 text-success" />
            </Button>
            <Button size="icon" variant="ghost" onClick={handleCancelEdit}>
              <X className="w-4 h-4 text-destructive" />
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex-1">
            <span className="font-medium">{category.name}</span>
            <div className="flex gap-2 mt-1">
              <Badge variant={category.type === 'entrada' ? 'default' : 'secondary'} className="text-xs">
                {category.type === 'entrada' ? 'Entrada' : 'Saída'}
              </Badge>
            </div>
          </div>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => handleEdit(category.id, category.name, category.type, category.scope)}
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
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Categorias</h3>
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

      {isAdding && (
        <div className="p-3 rounded-lg bg-muted animate-fade-in space-y-3">
          <Input
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            placeholder="Descrição da categoria"
            autoFocus
          />
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Tipo</label>
              <Select value={newCategoryType} onValueChange={(v) => setNewCategoryType(v as CategoryType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="entrada">Entrada</SelectItem>
                  <SelectItem value="saida">Saída</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Origem</label>
              <Select value={newCategoryScope} onValueChange={(v) => setNewCategoryScope(v as CategoryScope)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="empresa">Empresa</SelectItem>
                  <SelectItem value="pessoal">Pessoal</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="ghost" onClick={() => setIsAdding(false)}>
              <X className="w-4 h-4 mr-1" />
              Cancelar
            </Button>
            <Button size="sm" onClick={handleAdd}>
              <Check className="w-4 h-4 mr-1" />
              Salvar
            </Button>
          </div>
        </div>
      )}

      {/* Categorias Empresa */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-muted-foreground">Empresa</h4>
        {empresaCategories.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma categoria da empresa</p>
        ) : (
          empresaCategories.map(renderCategoryItem)
        )}
      </div>

      {/* Categorias Pessoal */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-muted-foreground">Pessoal</h4>
        {pessoalCategories.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma categoria pessoal</p>
        ) : (
          pessoalCategories.map(renderCategoryItem)
        )}
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
