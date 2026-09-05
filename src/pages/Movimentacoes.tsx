import { useState, useMemo } from 'react';
import { Plus, Filter, Search, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
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
import { useCaixaSummary } from '@/hooks/useCaixaSummary';
import { useUserSettings } from '@/hooks/useUserSettings';
import { CaixaSaldoResumo } from '@/components/ds/CaixaSaldoResumo';
import { Transaction, TransactionScope } from '@/types';
import { useToast } from '@/hooks/use-toast';

const Movimentacoes = () => {
  const navigate = useNavigate();
  const { transactions, categories, accounts, deleteTransaction } = useApp();
  const { toast } = useToast();
  
  const [showForm, setShowForm] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [deletingTransaction, setDeletingTransaction] = useState<Transaction | null>(null);
  
  const [filterScope, setFilterScope] = useState<TransactionScope | 'todos'>('todos');
  const [filterCategory, setFilterCategory] = useState<string>('todos');
  const [searchQuery, setSearchQuery] = useState('');

  // Resumo de caixa: estado de ocultar/revelar próprio desta tela + mês do "Entrou no mês"
  const [resumoVisible, setResumoVisible] = useState(
    () => localStorage.getItem('caixaResumoMovimentacoesVisible') === 'true',
  );
  const [mesResumo, setMesResumo] = useState(() => new Date());
  const resumoCaixa = useCaixaSummary(mesResumo);
  const { data: userSettings } = useUserSettings();
  const caixaAtivo = !!userSettings?.caixa_reserva_ativo;

  const toggleResumo = () => {
    const newState = !resumoVisible;
    setResumoVisible(newState);
    localStorage.setItem('caixaResumoMovimentacoesVisible', String(newState));
  };

  // Helper para obter nome da conta a partir do ID
  const getAccountName = (accountId: string): string => {
    const account = accounts.find(a => a.id === accountId);
    return account?.name || '';
  };

  const filteredTransactions = useMemo(() => {
    return transactions
      .filter(t => filterScope === 'todos' || t.scope === filterScope)
      .filter(t => filterCategory === 'todos' || t.category === filterCategory)
      .filter(t => {
        if (searchQuery === '') return true;
        const query = searchQuery.toLowerCase();
        const accountName = getAccountName(t.account);
        return (
          t.description?.toLowerCase().includes(query) ||
          t.category?.toLowerCase().includes(query) ||
          accountName.toLowerCase().includes(query) ||
          t.clientName?.toLowerCase().includes(query)
        );
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, filterScope, filterCategory, searchQuery, accounts]);

  const handleEdit = (transaction: Transaction) => {
    if (transaction.appointmentId) {
      toast({
        title: "Edição não permitida",
        description: "Esta movimentação está vinculada a um agendamento e não pode ser editada. Você pode apenas excluí-la.",
        variant: "destructive",
      });
      return;
    }
    setEditingTransaction(transaction);
    setShowForm(true);
  };

  const handleDelete = (transaction: Transaction) => {
    setDeletingTransaction(transaction);
  };

  const confirmDelete = () => {
    if (deletingTransaction) {
      deleteTransaction(deletingTransaction);
      setDeletingTransaction(null);
    }
  };

  return (
    <MainLayout>
      <PageHeader
        title="Movimentações"
        subtitle="Controle suas entradas e saídas"
        action={
          <div className="flex gap-2">
            <Button 
              variant="outline"
              size="sm"
              onClick={() => navigate('/relatorio-movimentacoes')}
            >
              <FileText className="w-4 h-4 mr-1" />
              Relatório
            </Button>
            <Button 
              size="icon" 
              onClick={() => {
                setEditingTransaction(null);
                setShowForm(true);
              }}
            >
              <Plus className="w-5 h-5" />
            </Button>
          </div>
        }
      />

      {/* Search */}
      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por banco, categoria, descrição ou cliente..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

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

      {/* Resumo de caixa (oculto por padrão) */}
      <CaixaSaldoResumo
        saldoEmpresa={resumoCaixa.saldoEmpresa}
        saldoPessoal={resumoCaixa.saldoPessoal}
        entrouNoMes={resumoCaixa.entrouNoMes}
        mesReferencia={mesResumo}
        hidden={!resumoVisible}
        onToggle={toggleResumo}
        mostrarSeletorMes
        onMesChange={setMesResumo}
        caixaAtivo={caixaAtivo}
        inicioEm={resumoCaixa.inicioEm}
      />

      {/* Transaction List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
            setDeletingTransaction(editingTransaction);
            setShowForm(false);
          }
        }}
      />

      <DeleteConfirmDialog
        open={!!deletingTransaction}
        onOpenChange={() => setDeletingTransaction(null)}
        onConfirm={confirmDelete}
        title="Excluir movimentação"
        description="Tem certeza que deseja excluir esta movimentação? Os saldos serão atualizados automaticamente."
      />
    </MainLayout>
  );
};

export default Movimentacoes;
