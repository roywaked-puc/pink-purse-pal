import { useEffect, useMemo, useRef, useState } from 'react';
import { endOfMonth, format, startOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { MoneyDisplay } from '@/components/ds/MoneyDisplay';
import { EmptyState } from '@/components/ds/EmptyState';
import { useApp } from '@/contexts/AppContext';
import { useUserSettings } from '@/hooks/useUserSettings';
import { isPermutaRelated } from '@/lib/accountBalance';
import { Transaction } from '@/types';
import { Receipt } from 'lucide-react';

export type CaixaDetalheTipo = 'empresa' | 'pessoal' | 'entrouNoMes' | 'gastosDoMes';

interface CaixaDetalheDrawerProps {
  tipo: CaixaDetalheTipo | null;
  /** Mês de referência usado nos cards de "Entrou no mês" e "Gastos do Mês". */
  mesReferencia: Date;
  onOpenChange: (open: boolean) => void;
}

const PAGINA = 20;

const titulos: Record<CaixaDetalheTipo, { title: string; description: string }> = {
  empresa: {
    title: 'Caixa Empresa · saldo atual',
    description: 'Entradas e saídas da empresa que formam este saldo.',
  },
  pessoal: {
    title: 'Caixa Pessoal · saldo atual',
    description: 'Entradas e saídas pessoais que formam este saldo.',
  },
  entrouNoMes: {
    title: 'Entrou no mês',
    description: 'Tudo que você recebeu no mês, empresa e pessoal.',
  },
  gastosDoMes: {
    title: 'Gastos do mês',
    description: 'Saídas pessoais lançadas no mês.',
  },
};

export function CaixaDetalheDrawer({ tipo, mesReferencia, onOpenChange }: CaixaDetalheDrawerProps) {
  const { transactions, accounts, appointments } = useApp();
  const { data: settings } = useUserSettings();
  const [visiveis, setVisiveis] = useState(PAGINA);

  const corteTime =
    settings?.caixa_reserva_ativo && settings?.caixa_inicio_em
      ? new Date(settings.caixa_inicio_em).getTime()
      : null;

  const itens = useMemo(() => {
    if (!tipo) return [] as Transaction[];
    const inicio = startOfMonth(mesReferencia);
    const fim = endOfMonth(mesReferencia);

    return transactions
      .filter((t) => {
        // Permuta nunca entra — mesma regra dos cards.
        if (isPermutaRelated(t, accounts, appointments)) return false;
        const data = new Date(t.date);

        if (tipo === 'empresa' || tipo === 'pessoal') {
          if (t.scope !== tipo) return false;
          if (corteTime !== null && data.getTime() < corteTime) return false;
          return true;
        }
        if (data < inicio || data > fim) return false;
        if (tipo === 'entrouNoMes') return t.type === 'entrada';
        return t.type === 'saida' && t.scope === 'pessoal';
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [tipo, transactions, accounts, appointments, corteTime, mesReferencia]);

  const total = itens.reduce((acc, t) => {
    if (tipo === 'empresa' || tipo === 'pessoal') {
      return t.type === 'entrada' ? acc + t.amount : acc - t.amount;
    }
    return acc + t.amount;
  }, 0);

  const nomeConta = (t: Transaction) => {
    const conta = accounts.find((a) => a.id === (t.accountId ?? t.account) || a.name === t.account);
    return conta?.name ?? t.account;
  };

  const info = tipo ? titulos[tipo] : null;
  const mesLabel = format(mesReferencia, 'MMMM/yyyy', { locale: ptBR });

  // O botão "voltar" do navegador deve apenas fechar o painel, sem sair da tela.
  const historicoRef = useRef(false);
  const onOpenChangeRef = useRef(onOpenChange);
  onOpenChangeRef.current = onOpenChange;

  useEffect(() => {
    if (!tipo) return;

    window.history.pushState({ caixaDetalheDrawer: true }, '');
    historicoRef.current = true;

    const aoVoltar = () => {
      historicoRef.current = false;
      setVisiveis(PAGINA);
      onOpenChangeRef.current(false);
    };

    window.addEventListener('popstate', aoVoltar);
    return () => window.removeEventListener('popstate', aoVoltar);
  }, [tipo]);

  const fechar = () => {
    setVisiveis(PAGINA);
    if (historicoRef.current) {
      historicoRef.current = false;
      window.history.back();
      return;
    }
    onOpenChange(false);
  };

  return (
    <Drawer
      open={!!tipo}
      onOpenChange={(open) => {
        if (!open) {
          fechar();
          return;
        }
        onOpenChange(open);
      }}
    >
      <DrawerContent className="max-h-[88vh]">
        <DrawerHeader className="text-left">
          <DrawerTitle>{info?.title}</DrawerTitle>
          <DrawerDescription>
            {info?.description}
            {tipo === 'entrouNoMes' || tipo === 'gastosDoMes' ? (
              <span className="capitalize"> {` · ${mesLabel}`}</span>
            ) : null}
          </DrawerDescription>
        </DrawerHeader>

        <div className="px-4 pb-3 flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            {itens.length} lançamento{itens.length === 1 ? '' : 's'}
          </span>
          <MoneyDisplay
            value={total}
            size="lg"
            variant={total < 0 ? 'negative' : 'default'}
          />
        </div>

        <div className="overflow-y-auto px-4 pb-6 space-y-2">
          {itens.length === 0 ? (
            <EmptyState
              icon={Receipt}
              title="Nada por aqui ainda"
              description="Nenhum lançamento entrou nesta conta neste período."
            />
          ) : (
            <>
              {itens.slice(0, visiveis).map((t) => (
                <div
                  key={t.id}
                  className="flex items-start justify-between gap-3 p-3 rounded-lg bg-card border border-border"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">
                      {t.description || t.clientName || t.category}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {format(new Date(t.date), 'dd/MM/yyyy', { locale: ptBR })}
                      {t.clientName && t.description ? ` • ${t.clientName}` : ''}
                      {` • ${t.category}`}
                      {nomeConta(t) ? ` • ${nomeConta(t)}` : ''}
                    </p>
                  </div>
                  <MoneyDisplay
                    value={t.type === 'entrada' ? t.amount : -t.amount}
                    size="sm"
                    variant={t.type === 'entrada' ? 'positive' : 'negative'}
                  />
                </div>
              ))}

              {itens.length > visiveis && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setVisiveis((v) => v + PAGINA)}
                >
                  Ver mais
                </Button>
              )}
            </>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
