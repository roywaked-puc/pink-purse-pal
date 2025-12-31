import { useState, useMemo } from 'react';
import { Plus, Filter } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { TransactionItem } from '@/components/transactions/TransactionItem';
import { TransactionForm } from '@/components/transactions/TransactionForm';
import { DeleteConfirmDialog } from '@/components/shared/DeleteConfirmDialog';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useApp } from '@/contexts/AppContext';
import { Transaction, TransactionScope } from '@/types';

const Movimentacoes = () => {
  const { transactions, categories, deleteTransaction } = useApp();
  
  const [showForm, setShowForm] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  
  const [filterScope, setFilterScope] = useState<TransactionScope | 'todos'>('todos');
  const [filterCategory, setFilterCategory] = useState<string>('todos');

  const filteredTransactions = useMemo(() => {
    return transactions
      .filter(t => filterScope === 'todos' || t.scope === filterScope)
      .filter(t => filterCategory === 'todos' || t.category === filterCategory)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, filterScope, filterCategory]);

  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    setDeleteId(id);
  };

  const confirmDelete = () => {
    if (deleteId) {
      deleteTransaction(deleteId);
      setDeleteId(null);
    }
  };

  return (
    <MainLayout>
      <PageHeader
        title="Movimentações"
        subtitle="Controle suas entradas e saídas"
        action={
          <Button
            size="icon"
            onClick={() => {
              setEditingTransaction(null);
              setShowForm(true);
            }}
          >
            <Plus className="w-5 h-5" />
          </Button>
        }
      />

      {/* Filters */}
      <div className="flex gap-2 mb-4">
        <div className="flex-1">
          <Select value={filterScope} onValueChange={(v) => setFilterScope(v as TransactionScope | 'todos')}>
            <SelectTrigger className="w-full">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Origem" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todas</SelectItem>
              <SelectItem value="empresa">Empresa</SelectItem>
              <SelectItem value="pessoal">Pessoal</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1">
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todas</SelectItem>
              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Empresa</div>
              {categories.filter(c => c.scope === 'empresa').map((cat) => (
                <SelectItem key={cat.id} value={cat.name}>
                  {cat.name}
                </SelectItem>
              ))}
              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground border-t mt-1 pt-2">Pessoal</div>
              {categories.filter(c => c.scope === 'pessoal').map((cat) => (
                <SelectItem key={cat.id} value={cat.name}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Transaction List */}
      <div className="space-y-3">
        {filteredTransactions.length > 0 ? (
          filteredTransactions.map((transaction, index) => (
            <div
              key={transaction.id}
              style={{ animationDelay: `${index * 50}ms` }}
              className="animate-fade-in"
            >
              <TransactionItem
                transaction={transaction}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            </div>
          ))
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <p>Nenhuma movimentação encontrada</p>
            <Button
              variant="link"
              onClick={() => {
                setEditingTransaction(null);
                setShowForm(true);
              }}
              className="mt-2"
            >
              Adicionar primeira movimentação
            </Button>
          </div>
        )}
      </div>

      <TransactionForm
        open={showForm}
        onOpenChange={(open) => {
          setShowForm(open);
          if (!open) setEditingTransaction(null);
        }}
        transaction={editingTransaction}
        onDelete={() => {
          if (editingTransaction) {
            setDeleteId(editingTransaction.id);
            setShowForm(false);
          }
        }}
      />

      <DeleteConfirmDialog
        open={!!deleteId}
        onOpenChange={() => setDeleteId(null)}
        onConfirm={confirmDelete}
        title="Excluir movimentação"
        description="Tem certeza que deseja excluir esta movimentação? Os saldos serão atualizados automaticamente."
      />
    </MainLayout>
  );
};

export default Movimentacoes;
