import { useState } from 'react';
import { Plus, Trash2, Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  useAccountFeeTypes,
  useAddAccountFeeType,
  useUpdateAccountFeeType,
  useDeleteAccountFeeType,
  useCreateDefaultFeeTypes,
} from '@/hooks/useAccountFeeTypes';

interface AccountFeeTypesProps {
  accountId: string;
}

export function AccountFeeTypes({ accountId }: AccountFeeTypesProps) {
  const { data: feeTypes = [], isLoading } = useAccountFeeTypes(accountId);
  const addFeeType = useAddAccountFeeType();
  const updateFeeType = useUpdateAccountFeeType();
  const deleteFeeType = useDeleteAccountFeeType();
  const createDefaults = useCreateDefaultFeeTypes();

  const [newLabel, setNewLabel] = useState('');
  const [newFee, setNewFee] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const handleAdd = () => {
    if (!newLabel.trim()) return;
    addFeeType.mutate(
      {
        accountId,
        label: newLabel.trim(),
        feePercentage: parseFloat(newFee) || 0,
        orderIndex: feeTypes.length,
      },
      {
        onSuccess: () => {
          setNewLabel('');
          setNewFee('');
          setIsAdding(false);
        },
      }
    );
  };

  return (
    <div className="rounded-lg border border-border bg-background p-3 space-y-3">
      <p className="text-sm font-medium">Tipos de cobrança</p>

      {isLoading ? (
        <div className="flex justify-center py-2">
          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
        </div>
      ) : feeTypes.length === 0 && !isAdding ? (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">
            Nenhum tipo de cobrança cadastrado para esta conta.
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full"
            disabled={createDefaults.isPending}
            onClick={() => createDefaults.mutate(accountId)}
          >
            {createDefaults.isPending ? (
              <Loader2 className="w-4 h-4 mr-1 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4 mr-1" />
            )}
            Criar tipos padrão (Pix, Débito, Crédito)
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {feeTypes.map((ft) => (
            <div key={ft.id} className="flex items-center gap-2">
              <Input
                defaultValue={ft.label}
                onBlur={(e) => {
                  const label = e.target.value.trim();
                  if (label && label !== ft.label) {
                    updateFeeType.mutate({ id: ft.id, label });
                  }
                }}
                className="flex-1"
              />
              <Input
                type="number"
                step="0.01"
                min="0"
                max="100"
                defaultValue={ft.feePercentage}
                onBlur={(e) => {
                  const feePercentage = parseFloat(e.target.value) || 0;
                  if (feePercentage !== ft.feePercentage) {
                    updateFeeType.mutate({ id: ft.id, feePercentage });
                  }
                }}
                placeholder="Taxa %"
                className="w-24"
              />
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-destructive hover:text-destructive"
                onClick={() => deleteFeeType.mutate(ft.id)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {isAdding && (
        <div className="flex items-center gap-2">
          <Input
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            placeholder="Ex: Crédito 3x"
            autoFocus
            className="flex-1"
          />
          <Input
            type="number"
            step="0.01"
            min="0"
            max="100"
            value={newFee}
            onChange={(e) => setNewFee(e.target.value)}
            placeholder="Taxa %"
            className="w-24"
          />
          <Button type="button" size="sm" onClick={handleAdd} disabled={addFeeType.isPending}>
            Salvar
          </Button>
        </div>
      )}

      {!isAdding && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-primary"
          onClick={() => setIsAdding(true)}
        >
          <Plus className="w-4 h-4 mr-1" />
          Adicionar tipo
        </Button>
      )}
    </div>
  );
}
