import { useMemo } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from '@/components/ui/drawer';
import { useApp } from '@/contexts/AppContext';
import { Account } from '@/types';
import { belongsToAccount } from '@/lib/accountBalance';
import { cn } from '@/lib/utils';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

interface AccountExtratoDrawerProps {
  account: Account | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AccountExtratoDrawer({ account, open, onOpenChange }: AccountExtratoDrawerProps) {
  const { transactions } = useApp();

  const items = useMemo(() => {
    if (!account) return [];
    return transactions
      .filter((t) => belongsToAccount(t, account))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, account]);

  const saldo = items.reduce(
    (acc, t) => (t.type === 'entrada' ? acc + t.amount : acc - t.amount),
    0,
  );

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader className="text-left">
          <DrawerTitle>Extrato · {account?.name}</DrawerTitle>
          <DrawerDescription>
            Tudo que foi dado e recebido nesta permuta.
          </DrawerDescription>
        </DrawerHeader>

        <div className="px-4 pb-2 flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Saldo</span>
          <span
            className={cn('font-semibold', saldo >= 0 ? 'text-success' : 'text-destructive')}
          >
            {formatCurrency(saldo)}
          </span>
        </div>

        <div className="overflow-y-auto px-4 pb-6 space-y-2">
          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Nenhum lançamento nesta conta ainda.
            </p>
          ) : (
            items.map((t) => (
              <div
                key={t.id}
                className="flex items-center justify-between gap-3 p-3 rounded-lg bg-card border border-border"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">
                    {t.description || t.category}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(t.date), 'dd/MM/yyyy', { locale: ptBR })}
                    {t.clientName ? ` • ${t.clientName}` : ''}
                  </p>
                </div>
                <span
                  className={cn(
                    'text-sm font-semibold whitespace-nowrap',
                    t.type === 'entrada' ? 'text-success' : 'text-destructive',
                  )}
                >
                  {t.type === 'entrada' ? '+' : '-'} {formatCurrency(t.amount)}
                </span>
              </div>
            ))
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
