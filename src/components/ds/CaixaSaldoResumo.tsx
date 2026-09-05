import { ReactNode } from 'react';
import { format, addMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Briefcase, User, TrendingUp, Eye, EyeOff, ChevronLeft, ChevronRight } from 'lucide-react';
import { BalanceCard } from '@/components/dashboard/BalanceCard';
import { Button } from '@/components/ui/button';

interface CaixaSaldoResumoProps {
  saldoEmpresa: number;
  saldoPessoal: number;
  entrouNoMes: number;
  /** Mês de referência do valor "Entrou no mês". */
  mesReferencia: Date;
  /** Estado de oculto/revelado — controlado pela tela (cada tela tem o seu). */
  hidden: boolean;
  onToggle: () => void;
  /** Quando true, exibe um seletor de mês pequeno que afeta apenas o "Entrou no mês". */
  mostrarSeletorMes?: boolean;
  onMesChange?: (mes: Date) => void;
  /** Quando a separação de caixa está ativa nas configurações, usa nomes "Caixa". */
  caixaAtivo?: boolean;
  /** Card extra opcional, adicionado ao final da grade (ex: Gastos do Mês na Home). */
  extraCard?: ReactNode;
}

/**
 * Bloco de resumo de caixa com o padrão de privacidade do app:
 * oculto por padrão, revelado só com toque. Reutilizado na Home e em Movimentações.
 */
export function CaixaSaldoResumo({
  saldoEmpresa,
  saldoPessoal,
  entrouNoMes,
  mesReferencia,
  hidden,
  onToggle,
  mostrarSeletorMes,
  onMesChange,
  caixaAtivo,
  extraCard,
}: CaixaSaldoResumoProps) {
  if (hidden) {
    return (
      <button
        onClick={onToggle}
        className="w-full mb-6 p-4 rounded-xl border border-dashed border-border bg-muted/40 flex items-center justify-center gap-2 text-muted-foreground hover:bg-muted transition-colors"
      >
        <Eye className="w-4 h-4" />
        <span className="text-sm">Saldos ocultos — toque para exibir</span>
      </button>
    );
  }

  const mesLabel = format(mesReferencia, "MMM/yyyy", { locale: ptBR });
  const isMesAtual =
    mesReferencia.getMonth() === new Date().getMonth() &&
    mesReferencia.getFullYear() === new Date().getFullYear();

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-muted-foreground">
          Saldos acumulados até hoje
        </span>
        <div className="flex items-center gap-1">
          {mostrarSeletorMes && onMesChange && (
            <div className="flex items-center gap-1 mr-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => onMesChange(addMonths(mesReferencia, -1))}
                title="Mês anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-xs font-medium capitalize min-w-[4.5rem] text-center">
                {mesLabel}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => onMesChange(addMonths(mesReferencia, 1))}
                disabled={isMesAtual}
                title="Próximo mês"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground"
            onClick={onToggle}
            title="Ocultar saldos"
          >
            <EyeOff className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className={`grid grid-cols-1 gap-4 ${extraCard ? 'md:grid-cols-4' : 'md:grid-cols-3'}`}>
        <BalanceCard
          title={caixaAtivo ? 'Caixa Empresa · saldo atual' : 'Saldo da Empresa · atual'}
          value={saldoEmpresa}
          icon={Briefcase}
          variant="primary"
        />
        <div className="grid grid-cols-2 md:contents gap-3">
          <BalanceCard
            title={caixaAtivo ? 'Caixa Pessoal · saldo atual' : 'Saldo Pessoal · atual'}
            value={saldoPessoal}
            icon={User}
            variant="secondary"
          />
          <BalanceCard
            title={`Entrou no mês · ${mesLabel}`}
            value={entrouNoMes}
            icon={TrendingUp}
            variant="accent"
          />
        </div>
        {extraCard}
      </div>
    </div>
  );
}
