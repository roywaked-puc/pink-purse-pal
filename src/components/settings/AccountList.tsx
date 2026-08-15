import { useState } from 'react';
import { Plus, Pencil, Trash2, Check, X, Wallet, Building2, CreditCard } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { Account } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DeleteConfirmDialog } from '@/components/shared/DeleteConfirmDialog';
import { cn } from '@/lib/utils';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

const typeConfig = {
  dinheiro: { icon: Wallet, label: 'Dinheiro' },
  banco: { icon: Building2, label: 'Banco' },
  maquininha: { icon: CreditCard, label: 'Maquininha' },
};

export function AccountList() {
  const { accounts, addAccount, updateAccount, deleteAccount, getAccountBalance } = useApp();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editType, setEditType] = useState<Account['type']>('banco');
  const [editFee, setEditFee] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [newAccountName, setNewAccountName] = useState('');
  const [newAccountType, setNewAccountType] = useState<Account['type']>('banco');
  const [newAccountFee, setNewAccountFee] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleEdit = (account: Account) => {
    setEditingId(account.id);
    setEditName(account.name);
    setEditType(account.type);
    setEditFee(account.feePercentage?.toString() || '');
  };

  const handleSaveEdit = () => {
    if (editingId && editName.trim()) {
      updateAccount(editingId, { 
        name: editName.trim(), 
        type: editType,
        feePercentage: parseFloat(editFee) || 0,
      });
      setEditingId(null);
      setEditName('');
      setEditFee('');
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditName('');
  };

  const handleAdd = () => {
    if (newAccountName.trim()) {
      addAccount({ 
        name: newAccountName.trim(), 
        type: newAccountType,
        feePercentage: parseFloat(newAccountFee) || 0,
      });
      setNewAccountName('');
      setNewAccountType('banco');
      setNewAccountFee('');
      setIsAdding(false);
    }
  };

  const handleConfirmDelete = () => {
    if (deleteId) {
      deleteAccount(deleteId);
      setDeleteId(null);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-end">
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
          <div className="p-3 rounded-lg bg-muted space-y-3 animate-fade-in">
            <Input
              value={newAccountName}
              onChange={(e) => setNewAccountName(e.target.value)}
              placeholder="Nome da conta"
              autoFocus
            />
            <div className="flex items-center gap-2">
              <Select value={newAccountType} onValueChange={(v) => setNewAccountType(v as Account['type'])}>
                <SelectTrigger className="flex-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dinheiro">Dinheiro</SelectItem>
                  <SelectItem value="banco">Banco</SelectItem>
                  <SelectItem value="maquininha">Maquininha</SelectItem>
                </SelectContent>
              </Select>
              <Input
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={newAccountFee}
                onChange={(e) => setNewAccountFee(e.target.value)}
                placeholder="Taxa %"
                className="w-24"
              />
              <Button size="icon" variant="ghost" onClick={handleAdd}>
                <Check className="w-4 h-4 text-success" />
              </Button>
              <Button size="icon" variant="ghost" onClick={() => setIsAdding(false)}>
                <X className="w-4 h-4 text-destructive" />
              </Button>
            </div>
          </div>
        )}

        {accounts.map((account) => {
          const config = typeConfig[account.type];
          const Icon = config.icon;
          const balance = getAccountBalance(account.id);

          return (
            <div
              key={account.id}
              className="p-3 rounded-lg bg-card border border-border"
            >
              {editingId === account.id ? (
                <div className="space-y-3">
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    autoFocus
                  />
                  <div className="flex items-center gap-2">
                    <Select value={editType} onValueChange={(v) => setEditType(v as Account['type'])}>
                      <SelectTrigger className="flex-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="dinheiro">Dinheiro</SelectItem>
                        <SelectItem value="banco">Banco</SelectItem>
                        <SelectItem value="maquininha">Maquininha</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={editFee}
                      onChange={(e) => setEditFee(e.target.value)}
                      placeholder="Taxa %"
                      className="w-24"
                    />
                    <Button size="icon" variant="ghost" onClick={handleSaveEdit}>
                      <Check className="w-4 h-4 text-success" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={handleCancelEdit}>
                      <X className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                  {editType === 'maquininha' && (
                    <AccountFeeTypes accountId={account.id} />
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-muted">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{account.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {config.label}
                      {account.feePercentage && account.feePercentage > 0 && (
                        <span className="ml-2 text-warning">• Taxa: {account.feePercentage}%</span>
                      )}
                    </p>
                  </div>
                  <p className={cn(
                    "font-semibold",
                    balance >= 0 ? "text-success" : "text-destructive"
                  )}>
                    {formatCurrency(balance)}
                  </p>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleEdit(account)}
                    className="h-8 w-8"
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => setDeleteId(account.id)}
                    className="h-8 w-8 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <DeleteConfirmDialog
        open={!!deleteId}
        onOpenChange={() => setDeleteId(null)}
        onConfirm={handleConfirmDelete}
        title="Excluir conta"
        description="Tem certeza que deseja excluir esta conta? As movimentações associadas não serão afetadas."
      />
    </div>
  );
}
